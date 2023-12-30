import {dots} from '../canvas_api';
import themeOptions from './themes';
import themeCardSvg from './themeCardSvg';
import {SimulatorStore} from '#/store/SimulatorStore/SimulatorStore';

/**
 * Color set for theme.
 */
export class ColorSet {
  /**
   * @param {string} hoverSelect
   * @param {string} fill
   * @param {string} miniFill
   * @param {string} miniStroke
   * @param {string} stroke
   * @param {string} strokeAlt
   * @param {string} inputText
   * @param {string} colorWireDraw
   * @param {string} colorWireCon
   * @param {string} colorWirePow
   * @param {string} colorWireSel
   * @param {string} colorWireLose
   * @param {string} colorWire
   * @param {string} text
   * @param {string} node
   * @param {string} nodeNorm
   * @param {string} splitter
   * @param {string} outRect
   * @param {string} canvasStroke
   * @param {string} canvasFill
   */
  constructor(hoverSelect,
      fill,
      miniFill,
      miniStroke,
      stroke,
      strokeAlt,
      inputText,
      colorWireDraw,
      colorWireCon,
      colorWirePow,
      colorWireSel,
      colorWireLose,
      colorWire,
      text,
      node,
      nodeNorm,
      splitter,
      outRect,
      canvasStroke,
      canvasFill) {
    this.hover_select = hoverSelect;
    this. fill = fill;
    this.mini_fill = miniFill;
    this.mini_stroke = miniStroke;
    this.stroke = stroke;
    this.stroke_alt = strokeAlt;
    this.input_text = inputText;
    this.color_wire_draw = colorWireDraw;
    this.color_wire_con = colorWireCon;
    this.color_wire_pow = colorWirePow;
    this.color_wire_sel = colorWireSel;
    this.color_wire_lose = colorWireLose;
    this.color_wire = colorWire;
    this.text = text;
    this.node = node;
    this.node_norm = nodeNorm;
    this.splitter = splitter;
    this.out_rect = outRect;
    this.canvas_stroke = canvasStroke;
    this.canvas_fill = canvasFill;
  }
}
/**
 * Extracts canvas theme colors from CSS-Variables and returns a JSON Object
 * @return {ColorSet}
 */
const getCanvasColors = () => {
  const el = document.documentElement;
  const colors = new ColorSet(
      getComputedStyle(el).getPropertyValue('--hover-and-sel'),
      getComputedStyle(el).getPropertyValue('--fill'),
      getComputedStyle(el).getPropertyValue('--mini-map'),
      getComputedStyle(el).getPropertyValue('--mini-map-stroke'),
      getComputedStyle(el).getPropertyValue('--stroke'),
      getComputedStyle(el).getPropertyValue('--secondary-stroke'),
      getComputedStyle(el).getPropertyValue('--input-text'),
      getComputedStyle(el).getPropertyValue('--wire-draw'),
      getComputedStyle(el).getPropertyValue('--wire-cnt'),
      getComputedStyle(el).getPropertyValue('--wire-pow'),
      getComputedStyle(el).getPropertyValue('--wire-sel'),
      getComputedStyle(el).getPropertyValue('--wire-lose'),
      getComputedStyle(el).getPropertyValue('--wire-norm'),
      getComputedStyle(el).getPropertyValue('--text'),
      getComputedStyle(el).getPropertyValue('--node'),
      getComputedStyle(el).getPropertyValue('--node-norm'),
      getComputedStyle(el).getPropertyValue('--splitter'),
      getComputedStyle(el).getPropertyValue('--output-rect'),
      getComputedStyle(el).getPropertyValue('--canvas-stroke'),
      getComputedStyle(el).getPropertyValue('--canvas-fill'),
  );
  return colors;
};

/**
 * Common canvas theme color object, used for rendering canvas elements
 */
export let colors = getCanvasColors();

/**
 * Updates theme
 * 1) Sets CSS Variables for UI elements
 * 2) Sets color variable for Canvas elements
 * @param {string} themeName - name of the theme.
 */
export function updateThemeForStyle(themeName) {
  const selectedTheme = themeOptions[themeName];
  if (selectedTheme === undefined) {
    return;
  }
  const html = document.getElementsByTagName('html')[0];
  Object.keys(selectedTheme).forEach((property, i) => {
    html.style.setProperty(property, selectedTheme[property]);
  });
  colors = getCanvasColors();
}

/**
 * Theme Preview Card SVG
 * Sets the SVG colors according to theme
 * @param {string} themeName Name of theme
 * @return {SVG}
 */
export const getThemeCardSvg = (themeName) => {
  const colors = themeOptions[themeName];
  const svgIcon = $(themeCardSvg);

  // Dynamically set the colors according to the theme
  $('.svgText', svgIcon).attr('fill', colors['--text-panel']);

  $('.svgNav', svgIcon).attr('fill', colors['--bg-tab']);
  $('.svgNav', svgIcon).attr('stroke', colors['--br-primary']);

  $('.svgGridBG', svgIcon).attr('fill', colors['--canvas-fill']);
  $('.svgGrid', svgIcon).attr('fill', colors['--canvas-stroke']);

  $('.svgPanel', svgIcon).attr('fill', colors['--primary']);
  $('.svgPanel', svgIcon).attr('stroke', colors['--br-primary']);

  $('.svgChev', svgIcon).attr('stroke', colors['--br-secondary']);

  $('.svgHeader', svgIcon).attr('fill', colors['--primary']);
  return svgIcon.prop('outerHTML');
};

/**
 * Generates theme card HTML
 * @param {string} themeName Name of theme
 * @param {boolean} selected Flag variable for currently selected theme
 * @return {string} Theme card html
 */
export const getThemeCard = (themeName, selected) => {
  if (themeName === 'Custom Theme') {
    return '<div></div>';
  }
  const themeId = themeName.replace(' ', '');
  const selectedClass = selected ? 'selected set' : '';
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
    `;
};

/**
 * Create Color Themes Dialog
 */
export const colorThemes = () => {
  const simulatorStore = SimulatorStore();
  simulatorStore.dialogBox.theme_dialog = true;

  $('#colorThemesDialog').focus();
  $('.ui-dialog[aria-describedby="colorThemesDialog"]').on('click', () =>
    $('#colorThemesDialog').focus(),
  ); // hack for losing focus

  $('.themeSel').on('mousedown', (e) => {
    e.preventDefault();
    $('.selected').removeClass('selected');
    const themeCard = $(e.target.parentElement);
    themeCard.addClass('selected');
    // Extract radio button
    const radioButton = themeCard.find('input[type=radio]');
    radioButton.trigger('click'); // Mark as selected
    // Extract theme name and set
    updateThemeForStyle(themeCard.find('label').text());
    updateBG();
  });
};

export const updateBG = () => dots(globalScope, true, false, true)
;(() => {
  if (!localStorage.getItem('theme')) {
    localStorage.setItem('theme', 'Default Theme');
  }
  updateThemeForStyle(localStorage.getItem('theme'));
})();
