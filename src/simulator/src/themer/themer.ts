import { dots } from "../canvasApi";
import importedThemeOptions from "./themes";
import { ThemeOptions } from "./themer.types";
import themeCardSvg from "./themeCardSvg";
import { SimulatorStore } from "#/store/SimulatorStore/SimulatorStore";

const themeOptions: ThemeOptions = importedThemeOptions;

/**
 * Helper function to set CSS variable values into a colors object.
 */
const setColor = (colors: Record<string, string>, key: string, cssVar: string): void => {
  colors[key] = getComputedStyle(document.documentElement).getPropertyValue(cssVar);
};

/**
 * Extracts canvas theme colors from CSS variables and returns a JSON object.
 */
const getCanvasColors = (): Record<string, string> => {
  const colors: Record<string, string> = {};
  setColor(colors, "hover_select", "--hover-and-sel");
  setColor(colors, "fill", "--fill");
  setColor(colors, "mini_fill", "--mini-map");
  setColor(colors, "mini_stroke", "--mini-map-stroke");
  setColor(colors, "stroke", "--stroke");
  setColor(colors, "stroke_alt", "--secondary-stroke");
  setColor(colors, "input_text", "--input-text");
  setColor(colors, "color_wire_draw", "--wire-draw");
  setColor(colors, "color_wire_con", "--wire-cnt");
  setColor(colors, "color_wire_pow", "--wire-pow");
  setColor(colors, "color_wire_sel", "--wire-sel");
  setColor(colors, "color_wire_lose", "--wire-lose");
  setColor(colors, "color_wire", "--wire-norm");
  setColor(colors, "text", "--text");
  setColor(colors, "node", "--node");
  setColor(colors, "node_norm", "--node-norm");
  setColor(colors, "splitter", "--splitter");
  setColor(colors, "out_rect", "--output-rect");
  setColor(colors, "canvas_stroke", "--canvas-stroke");
  setColor(colors, "canvas_fill", "--canvas-fill");
  return colors;
};

/**
 * Common canvas theme color object, used for rendering canvas elements.
 */
export let colors: Record<string, string> = getCanvasColors();

/**
 * Updates theme by setting CSS variables and updating the colors object.
 */
export function updateThemeForStyle(themeName: string): void {
  const selectedTheme = themeOptions[themeName];
  if (selectedTheme === undefined) return;

  const html = document.documentElement;
  Object.keys(selectedTheme).forEach((property) => {
    html.style.setProperty(property, selectedTheme[property]);
  });

  colors = getCanvasColors();
}

/**
 * Helper function to set attributes for SVG elements.
 */
const setAttributes = (element: Element, attributes: Record<string, string>): void => {
  Object.entries(attributes).forEach(([attr, value]) => {
    element.setAttribute(attr, value);
  });
};

/**
 * Generates a theme preview card SVG with colors based on the selected theme.
 */
export const getThemeCardSvg = (themeName: string): string => {
  if (!themeOptions[themeName]) {
    console.error(`Theme "${themeName}" not found`);
    return "";
  }

  const colors = themeOptions[themeName];
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(themeCardSvg, "image/svg+xml");

  // Check for parsing errors
  const parserError = svgDoc.querySelector("parsererror");
  if (parserError) {
    console.error("Failed to parse SVG:", parserError);
    return "";
  }

  const svgElement = svgDoc.documentElement;

  const applyStyles = (selector: string, attributes: Record<string, string>): void => {
    svgElement.querySelectorAll(selector).forEach((el) => setAttributes(el, attributes));
  };

  applyStyles(".svgText", { fill: colors["--text-panel"] || "#000000" });
  applyStyles(".svgNav", { fill: colors["--bg-tab"], stroke: colors["--br-primary"] });
  applyStyles(".svgGridBG", { fill: colors["--canvas-fill"] });
  applyStyles(".svgGrid", { fill: colors["--canvas-stroke"] });
  applyStyles(".svgPanel", { fill: colors["--primary"], stroke: colors["--br-primary"] });
  applyStyles(".svgChev", { stroke: colors["--br-secondary"] });
  applyStyles(".svgHeader", { fill: colors["--primary"] });

  return svgElement.outerHTML;
};

/**
 * Generates theme card HTML.
 */
export const getThemeCard = (themeName: string, selected: boolean): string => {
  if (themeName === "Custom Theme") return "<div></div>";

  const themeId = themeName.replace(" ", "");
  const selectedClass = selected ? "selected set" : "";

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
 * Handles theme selection logic.
 */
const handleThemeSelection = (e: MouseEvent): void => {
  e.preventDefault();

  // Remove 'selected' class from all theme cards
  document.querySelectorAll(".selected").forEach((el) => el.classList.remove("selected"));

  const themeCard = (e.target as HTMLElement).parentElement;
  if (!themeCard) return;

  // Add 'selected' class to the clicked theme card
  themeCard.classList.add("selected");

  // Find the radio button and label within the theme card
  const radioButton = themeCard.querySelector("input[type=radio]") as HTMLInputElement;
  const label = themeCard.querySelector("label");

  if (radioButton) {
    radioButton.click(); // Mark the radio button as selected
  }

  if (label) {
    updateThemeForStyle(label.textContent || ""); // Update the theme based on the label text
  }

  updateBG(); // Update the background
};

/**
 * Sets up event listeners for theme selection.
 */
const setupThemeSelectionHandlers = (cleanupListeners: (() => void)[]): void => {
  document.querySelectorAll(".themeSel").forEach((element) => {
    const mousedownHandler = (e: MouseEvent) => handleThemeSelection(e);

    element.addEventListener("mousedown", mousedownHandler as EventListener);
    cleanupListeners.push(() =>
      element.removeEventListener("mousedown", mousedownHandler as EventListener),
    );
  });
};

/**
 * Initializes the color themes dialog.
 */
export const colorThemes = (): void => {
  const simulatorStore = SimulatorStore();
  const cleanupListeners: (() => void)[] = [];

  simulatorStore.dialogBox.theme_dialog = true;

  const dialog = document.querySelector('.ui-dialog[aria-describedby="colorThemesDialog"]');
  if (dialog) {
    const dialogClickHandler = () => {
      const colorThemesDialog = document.getElementById("colorThemesDialog");
      if (colorThemesDialog) colorThemesDialog.focus();
    };

    dialog.addEventListener("click", dialogClickHandler);
    cleanupListeners.push(() => dialog.removeEventListener("click", dialogClickHandler));
  }

  setupThemeSelectionHandlers(cleanupListeners);

  // Add cleanup method to store
  (simulatorStore as any).cleanupThemeDialog = () => {
    cleanupListeners.forEach((cleanup) => cleanup());
  };
};

/**
 * Updates the background of the canvas.
 */
export const updateBG = (): void => dots(true, false, true);

/**
 * Initializes the theme on load.
 */
const initializeTheme = (): void => {
  const theme = localStorage.getItem("theme") || "Default Theme";
  if (!localStorage.getItem("theme")) {
    localStorage.setItem("theme", theme);
  }
  updateThemeForStyle(theme);
};

// Initialize theme on load
initializeTheme();
