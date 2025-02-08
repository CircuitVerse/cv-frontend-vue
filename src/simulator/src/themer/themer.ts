import { dots } from '../canvasApi';
import importedThemeOptions from './themes';
import{ ThemeOptions } from './themer.types'

const themeOptions: ThemeOptions = importedThemeOptions;
import themeCardSvg from './themeCardSvg';
import { SimulatorStore } from '#/store/SimulatorStore/SimulatorStore';

/**
 * Extracts canvas theme colors from CSS-Variables and returns a JSON Object
 * @returns {Object.<string, string>}
 */
const getCanvasColors = (): Record<string, string> => {
    const colors: Record<string, string> = {};
    colors['hover_select'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--hover-and-sel');
    colors['fill'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--fill');
    colors['mini_fill'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--mini-map');
    colors['mini_stroke'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--mini-map-stroke');
    colors['stroke'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--stroke');
    colors['stroke_alt'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--secondary-stroke');
    colors['input_text'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--input-text');
    colors['color_wire_draw'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--wire-draw');
    colors['color_wire_con'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--wire-cnt');
    colors['color_wire_pow'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--wire-pow');
    colors['color_wire_sel'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--wire-sel');
    colors['color_wire_lose'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--wire-lose');
    colors['color_wire'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--wire-norm');
    colors['text'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--text');
    colors['node'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--node');
    colors['node_norm'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--node-norm');
    colors['splitter'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--splitter');
    colors['out_rect'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--output-rect');
    colors['canvas_stroke'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--canvas-stroke');
    colors['canvas_fill'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--canvas-fill');
    return colors;
};

/**
 * Common canvas theme color object, used for rendering canvas elements
 */
export let colors: Record<string, string> = getCanvasColors();

/**
 * Updates theme
 * 1) Sets CSS Variables for UI elements
 * 2) Sets color variable for Canvas elements
 * @param {string} themeName - Name of the theme to apply
 */
export function updateThemeForStyle(themeName: string): void {
    const selectedTheme = themeOptions[themeName];
    if (selectedTheme === undefined) return;
    const html = document.getElementsByTagName('html')[0];
    Object.keys(selectedTheme).forEach((property) => {
        html.style.setProperty(property, selectedTheme[property]);
    });
    colors = getCanvasColors();
}

/**
 * Theme Preview Card SVG
 * Sets the SVG colors according to theme
 * @param {string} themeName - Name of theme
 * @returns {string} - SVG HTML as a string
 */
export const getThemeCardSvg = (themeName: string): string => {
    if (!themeOptions[themeName]) {
                console.error(`Theme "${themeName}" not found`);
                return '';
            }

    const colors = themeOptions[themeName];
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(themeCardSvg, 'image/svg+xml');

    // Check for parsing errors
    const parserError = svgDoc.querySelector('parsererror');
    if (parserError) {
        console.error('Failed to parse SVG:', parserError);
        return '';
    }
    
    const svgElement = svgDoc.documentElement;

    // Dynamically set the colors according to the theme
    svgElement.querySelectorAll('.svgText').forEach((el) => {
        el.setAttribute('fill', colors['--text-panel'] || '#000000');
    });
    svgElement.querySelectorAll('.svgNav').forEach((el) => {
        el.setAttribute('fill', colors['--bg-tab']);
        el.setAttribute('stroke', colors['--br-primary']);
    });
    svgElement.querySelectorAll('.svgGridBG').forEach((el) => {
        el.setAttribute('fill', colors['--canvas-fill']);
    });
    svgElement.querySelectorAll('.svgGrid').forEach((el) => {
        el.setAttribute('fill', colors['--canvas-stroke']);
    });
    svgElement.querySelectorAll('.svgPanel').forEach((el) => {
        el.setAttribute('fill', colors['--primary']);
        el.setAttribute('stroke', colors['--br-primary']);
    });
    svgElement.querySelectorAll('.svgChev').forEach((el) => {
        el.setAttribute('stroke', colors['--br-secondary']);
    });
    svgElement.querySelectorAll('.svgHeader').forEach((el) => {
        el.setAttribute('fill', colors['--primary']);
    });

    return svgElement.outerHTML;
};

/**
 * Generates theme card HTML
 * @param {string} themeName - Name of theme
 * @param {boolean} selected - Flag variable for currently selected theme
 * @return {string} - Theme card HTML as a string
 */
const escapeHtml = (unsafe: string): string => {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };
    
export const getThemeCard = (themeName: string, selected: boolean): string => {
    if (themeName === 'Custom Theme') return '<div></div>';
    const themeId = escapeHtml(themeName.replace(' ', ''));
    const selectedClass = selected ? 'selected set' : '';
    // themeSel is the hit area
    return `
            <div id="theme" class="theme ${selectedClass}">
              <div class='themeSel'></div>
              <span>${getThemeCardSvg(themeName)}</span>
              <span id='themeNameBox' class='themeNameBox'>
                <input type='radio' id='${themeId}' value='${escapeHtml(themeName)}' name='theme'>
                <label for='${themeId}'>${escapeHtml(themeName)}</label>
              </span>
            </div>
            `;
};

/**
 * Create Color Themes Dialog
 */
export const colorThemes = (): void => {
    const simulatorStore = SimulatorStore();
    const cleanupListeners: (() => void)[] = [];
    
    simulatorStore.dialogBox.theme_dialog = true;    
    const colorThemesDialog = document.getElementById('colorThemesDialog');
    if (colorThemesDialog) {
        colorThemesDialog.focus();
    }
    
    const dialogClickHandler = () => {
        const colorThemesDialog = document.getElementById('colorThemesDialog');
        if (colorThemesDialog) {
            colorThemesDialog.focus();
        }
    };
    
    const dialog = document.querySelector('.ui-dialog[aria-describedby="colorThemesDialog"]');
    if (dialog) {
        dialog.addEventListener('click', dialogClickHandler);
        cleanupListeners.push(() => dialog.removeEventListener('click', dialogClickHandler));
    }
    document.querySelectorAll('.themeSel').forEach((element) => {
        const mousedownHandler = (e: MouseEvent) => {
            e.preventDefault();
            document.querySelectorAll('.selected').forEach((el) => {
                el.classList.remove('selected');
            });
            const themeCard = (e.target as HTMLElement).parentElement;
            if (themeCard) {
                themeCard.classList.add('selected');
                const radioButton = themeCard.querySelector('input[type=radio]') as HTMLInputElement;
                if (radioButton) {
                    radioButton.click(); // Mark as selected
                }
                const label = themeCard.querySelector('label');
                if (label) {
                    updateThemeForStyle(label.textContent || ''); // Extract theme name and set
                }
                updateBG();
            }
        };
        element.addEventListener('mousedown', mousedownHandler as EventListener);
        cleanupListeners.push(() => element.removeEventListener('mousedown', mousedownHandler as EventListener));
    });
    // Add cleanup method to store
    simulatorStore.cleanupThemeDialog = () => {
        cleanupListeners.forEach(cleanup => cleanup());
    };
};

export const updateBG = (): void => dots(true, false, true);

// Initialize theme on load
(() => {
    if (!localStorage.getItem('theme')) {
        localStorage.setItem('theme', 'Default Theme');
    }
    updateThemeForStyle(localStorage.getItem('theme') || 'Default Theme');
})();