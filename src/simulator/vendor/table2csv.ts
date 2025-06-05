function tableToCSV(
  table: HTMLTableElement,
  options: {
    separator?: string;
    header?: string[];
    columnSelector?: string;
    transformGtLt?: boolean;
  } = {}
): string {
  const {
    separator = ",",
    header = [],
    columnSelector = "td, th",
    transformGtLt = true,
  } = options;

  const csvData: string[] = [];

  // Add header
  if (header.length > 0) {
    csvData.push(header.map(formatData).join(separator));
  } else {
    const headers = table.querySelectorAll("thead th");
    const headerRow = Array.from(headers).map((th) => formatData(th.textContent || ""));
    if (headerRow.length > 0) csvData.push(headerRow.join(separator));
  }

  // Add rows
  const rows = table.querySelectorAll("tbody tr");
  rows.forEach((row) => {
    const columns = row.querySelectorAll(columnSelector);
    const rowData = Array.from(columns).map((col) => formatData(col.textContent || ""));
    if (rowData.some((data) => data.trim() !== "")) {
      csvData.push(rowData.join(separator));
    }
  });

  // Transform `&gt;` and `&lt;` if required
  const result = csvData.join("\n");
    if (transformGtLt) {
        const entities: Record<string, string> = {
          '&gt;': '>',
          '&lt;': '<',
          '&amp;': '&',
          '&quot;': '"',
          '&#39;': "'",
          // Add more common entities as needed
        };
        return result.replace(/&[^;]+;/g, (entity) => entities[entity] || entity);
      }
      return result;

  function formatData(input: string): string {
    return `"${input.replace(/"/g, '""').trim()}"`;
  }
}
