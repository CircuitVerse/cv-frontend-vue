import { dots } from '../canvasApi'
import themeOptions from './themes'
import themeCardSvg from './themeCardSvg'
import { SimulatorStore } from '#/store/SimulatorStore/SimulatorStore'

/**
 * Extracts canvas theme colors from CSS-Variables and returns a JSON Object
 * @returns {object}
 */
const getCanvasColors = () => {
    let colors = {}
    colors['hover_select'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--hover-and-sel')
    colors['fill'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--fill')
    colors['mini_fill'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--mini-map')
    colors['mini_stroke'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--mini-map-stroke')
    colors['stroke'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--stroke')
    colors['stroke_alt'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--secondary-stroke')
    colors['input_text'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--input-text')
    colors['color_wire_draw'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--wire-draw')
    colors['color_wire_con'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--wire-cnt')
    colors['color_wire_pow'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--wire-pow')
    colors['color_wire_sel'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--wire-sel')
    colors['color_wire_lose'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--wire-lose')
    colors['color_wire'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--wire-norm')
    colors['text'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--text')
    colors['node'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--node')
    colors['node_norm'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--node-norm')
    colors['splitter'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--splitter')
    colors['out_rect'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--output-rect')
    colors['canvas_stroke'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--canvas-stroke')
    colors['canvas_fill'] = getComputedStyle(
        document.documentElement
    ).getPropertyValue('--canvas-fill')
    return colors
}

/**
 * Common canvas theme color object, used for rendering canvas elements
 */
export let colors = getCanvasColors()

/**
 * Updates theme
 * 1) Sets CSS Variables for UI elements
 * 2) Sets color variable for Canvas elements
 */
export function updateThemeForStyle(themeName) {
    const selectedTheme = themeOptions[themeName]
    if (selectedTheme === undefined) return
    const html = document.getElementsByTagName('html')[0]
    Object.keys(selectedTheme).forEach((property, i) => {
        html.style.setProperty(property, selectedTheme[property])
    })
    colors = getCanvasColors()
}

/**
 * Theme Preview Card SVG
 * Sets the SVG colors according to theme
 * @param {string} themeName Name of theme
 * @returns {SVG}
 */
export const getThemeCardSvg = (themeName) => {
    const colors = themeOptions[themeName]
    let svgIcon = document.querySelector(themeCardSvg)

    // Dynamically set the colors according to the theme
    svgIcon.querySelectorAll('.svgText').forEach(element => {
        element.setAttribute('fill', colors['--text-panel']);
    });

    svgIcon.querySelectorAll('.svgNav').forEach(element => {
        element.setAttribute('fill', colors['--bg-tab']);
        element.setAttribute('stroke', colors['--br-primary']);
    });

    svgIcon.querySelectorAll('.svgGridBG').forEach(element => {
        element.setAttribute('fill', colors['--canvas-fill']);
    });

    svgIcon.querySelectorAll('.svgGrid').forEach(element => {
        element.setAttribute('fill', colors['--canvas-stroke']);
    });

    svgIcon.querySelectorAll('.svgPanel').forEach(element => {
        element.setAttribute('fill', colors['--primary']);
        element.setAttribute('stroke', colors['--br-primary']);
    });

    svgIcon.querySelectorAll('.svgChev').forEach(element => {
        element.setAttribute('stroke', colors['--br-secondary']);
    });

    svgIcon.querySelectorAll('.svgHeader').forEach(element => {
        element.setAttribute('fill', colors['--primary']);
    });

    let temp = svgIcon.outerHTML;

    console.log('----------')
    console.log('===OKK===')
    console.log(temp)
    console.log('----------')
    return svgIcon.prop('outerHTML')
}

/**
 * Generates theme card HTML
 * @param {string} themeName Name of theme
 * @param {boolean} selected Flag variable for currently selected theme
 * @return {string} Theme card html
 */
export const getThemeCard = (themeName, selected) => {
    if (themeName === 'Custom Theme') return '<div></div>'
    let themeId = themeName.replace(' ', '')
    let selectedClass = selected ? 'selected set' : ''
    // themeSel is the hit area
    return `
            <div id="theme" class="theme ${selectedClass}">
              <div class='themeSel'></div>
              <span>${getThemeCardSvg(themeName)}</span>
              <span id='themeNameBox' class='themeNameBox'>
                <input type='radio' id='${themeId}' value='${themeName}' name='theme'>
                <label for='${themeId}'>${themeName}</label>
              </span>
            </div>
            `
}

/**
 * Create Color Themes Dialog
 */
export const colorThemes = () => {
    console.log('Hello')
    const simulatorStore = SimulatorStore()
    simulatorStore.dialogBox.theme_dialog = true

    document.getElementById('#colorThemesDialog').focus()
    document.querySelector('.ui-dialog[aria-describedby="colorThemesDialog"]').addEventListener('click', () => document.getElementById('#colorThemesDialog').focus()) //hack for losing focus

    Array.from(document.getElementsByClassName('themeSel')).forEach(themeSel => {
        themeSel.addEventListener('mousedown', (e) => {
            e.preventDefault();
            Array.from(document.getElementsByClassName('selected')).forEach(selected => {
                selected.classList.remove('selected');
            });
            let themeCard = e.target.parentElement;
            themeCard.classList.add('selected');
            // Extract radio button
            var radioButton = themeCard.querySelector('input[type=radio]');
            radioButton.click(); // Mark as selected
            updateThemeForStyle(themeCard.querySelector('label').textContent); // Extract theme name and set
            updateBG();
        });
    });
}

export const updateBG = () => dots(true, false, true)
; (() => {
    if (!localStorage.getItem('theme'))
        localStorage.setItem('theme', 'Default Theme')
    updateThemeForStyle(localStorage.getItem('theme'))
})()
