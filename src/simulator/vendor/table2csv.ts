/**
 * jQuery Table to CSV Plugin
 *
 * Converts HTML tables to CSV format with three delivery options:
 * - 'value': Returns CSV as a string
 * - 'popup': Opens a popup window with the CSV content
 * - 'download': Opens a data URL to download the CSV file
 *
 * @example
 * ```typescript
 * // Get CSV as string
 * const csv = $('#myTable').table2CSV({ delivery: 'value' });
 *
 * // Download CSV file
 * $('#myTable').table2CSV({ delivery: 'download', filename: 'export.csv' });
 *
 * // Show in popup
 * $('#myTable').table2CSV({ delivery: 'popup' });
 * ```
 */


/**
 * Configuration options for the table2CSV plugin.
 *
 * @property separator - Column separator character (default: ',')
 * @property header - Custom header array to use instead of table headers (default: [])
 * @property headerSelector - CSS selector for header elements (default: 'none')
 * @property columnSelector - CSS selector for column elements (default: 'td, th')
 * @property delivery - Output delivery mode: 'value' returns string, 'popup' opens window, 'download' triggers download
 * @property filename - Optional filename for download mode
 * @property transform_gt_lt - Transform HTML entities &gt; and &lt; to > and < (default: true)
 */
interface Table2CSVOptions {
    separator: string;
    header: string[];
    headerSelector: string;
    columnSelector: string;
    delivery: 'value' | 'popup' | 'download';
    filename?: string;
    transform_gt_lt: boolean;
}

// Augment jQuery interface to include table2CSV method
declare global {
    interface JQuery<TElement = HTMLElement> {
        table2CSV(options?: Partial<Table2CSVOptions>): string | boolean;
    }
}

/** Regex pattern for matching double quotes (for CSV escaping per RFC 4180) */
const DOUBLE_QUOTE_REGEX: RegExp = /["]/g;

/** Regex pattern for matching HTML tags */
const HTML_TAG_REGEX: RegExp = /<[^<]+>/g;

/** Regex pattern for matching &gt; HTML entity */
const GT_ENTITY_REGEX: RegExp = /&gt;/g;

/** Regex pattern for matching &lt; HTML entity */
const LT_ENTITY_REGEX: RegExp = /&lt;/g;

/** Regex pattern for matching &nbsp; HTML entity (case insensitive) */
const NBSP_REGEX: RegExp = /&nbsp;/gi;

/**
 * Transforms HTML entities &gt; and &lt; back to their character equivalents.
 *
 * @param input - String containing HTML entities to transform
 * @returns String with &gt; replaced by > and &lt; replaced by <
 */
function sinriRecoverGtAndLt(input: string): string {
    let result: string = input.replace(GT_ENTITY_REGEX, '>');
    result = result.replace(LT_ENTITY_REGEX, '<');
    return result;
}

/**
 * Formats and escapes cell data for CSV output.
 * - Escapes double quotes by doubling them (per RFC 4180)
 * - Strips HTML tags
 * - Replaces &nbsp; with spaces
 * - Wraps result in double quotes
 *
 * @param input - Raw cell content (may contain HTML)
 * @returns Properly escaped and quoted CSV cell value
 */
function formatData(input: string): string {
    // Double " according to RFC 4180
    let output: string = input.replace(DOUBLE_QUOTE_REGEX, '""');
    // Strip HTML tags
    output = output.replace(HTML_TAG_REGEX, '');
    // Replace &nbsp; with space
    output = output.replace(NBSP_REGEX, ' ');
    if (output === '') return '';
    return '"' + output.trim() + '"';
}

/**
 * Opens a popup window displaying the CSV data in a textarea.
 *
 * @param data - The CSV string to display
 * @returns Always returns true after opening the popup
 */
function popup(data: string): boolean {
    const generator: Window | null = window.open('', 'csv', 'height=400,width=600');
    if (generator) {
        generator.document.write('<html><head><title>CSV</title>');
        generator.document.write('</head><body >');
        generator.document.write('<textArea cols=70 rows=15 wrap="off" >');
        generator.document.write(data);
        generator.document.write('</textArea>');
        generator.document.write('</body></html>');
        generator.document.close();
    }
    return true;
}

// Extend jQuery prototype with table2CSV method
jQuery.fn.table2CSV = function (
    this: JQuery<HTMLElement>,
    options?: Partial<Table2CSVOptions>
): string | boolean {
    const mergedOptions: Table2CSVOptions = jQuery.extend(
        {
            separator: ',',
            header: [],
            headerSelector: 'none',
            columnSelector: 'td, th',
            delivery: 'value', // popup, value, download
            // filename: 'test.csv', // filename to download
            transform_gt_lt: true, // make &gt; and &lt; to > and <
        },
        options
    );

    const csvData: string[] = [];
    const headerArr: string[] = [];
    const tableElement: JQuery<HTMLElement> = this;

    /**
     * Converts a row array to a CSV line and adds it to csvData.
     *
     * @param rowData - Array of formatted cell values
     */
    function row2CSV(rowData: string[]): void {
        const joined: string = rowData.join(''); // to remove any blank rows
        if (rowData.length > 0 && joined !== '') {
            const csvLine: string = rowData.join(mergedOptions.separator);
            csvData[csvData.length] = csvLine;
        }
    }

    // Header
    const numCols: number = mergedOptions.header.length;
    let tmpRow: string[] = []; // construct header available array

    if (numCols > 0) {
        for (let i = 0; i < numCols; i++) {
            tmpRow[tmpRow.length] = formatData(mergedOptions.header[i]);
        }
    } else {
        jQuery(tableElement)
            .filter(':visible')
            .find(mergedOptions.headerSelector)
            .each(function (this: HTMLElement): void {
                if (jQuery(this).css('display') !== 'none') {
                    tmpRow[tmpRow.length] = formatData(jQuery(this).html());
                }
            });
    }

    row2CSV(tmpRow);

    // Actual data
    jQuery(tableElement)
        .find('tr')
        .each(function (this: HTMLElement): void {
            const rowCells: string[] = [];
            jQuery(this)
                .filter(':visible')
                .find(mergedOptions.columnSelector)
                .each(function (this: HTMLElement): void {
                    if (jQuery(this).css('display') !== 'none') {
                        rowCells[rowCells.length] = formatData(jQuery(this).html());
                    }
                });
            row2CSV(rowCells);
        });

    if (mergedOptions.delivery === 'popup') {
        let csvOutput: string = csvData.join('\n');
        if (mergedOptions.transform_gt_lt) {
            csvOutput = sinriRecoverGtAndLt(csvOutput);
        }
        return popup(csvOutput);
    } else if (mergedOptions.delivery === 'download') {
        let csvOutput: string = csvData.join('\n');
        if (mergedOptions.transform_gt_lt) {
            csvOutput = sinriRecoverGtAndLt(csvOutput);
        }
        const url: string = 'data:text/csv;charset=utf8,' + encodeURIComponent(csvOutput);
        window.open(url);
        return true;
    } else {
        let csvOutput: string = csvData.join('\n');
        if (mergedOptions.transform_gt_lt) {
            csvOutput = sinriRecoverGtAndLt(csvOutput);
        }
        return csvOutput;
    }
};

export {};
