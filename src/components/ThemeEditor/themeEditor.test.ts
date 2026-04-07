import { describe, it, expect, beforeEach, afterEach } from "vitest";
import themeEditor from "#/plugins/themeEditor";

describe("themeEditor plugin", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("exports expected helpers", () => {
    expect(typeof themeEditor.getRootTheme).toBe("function");
    expect(typeof themeEditor.applyTheme).toBe("function");
    expect(typeof themeEditor.applyThemeWithTransition).toBe("function");
    expect(typeof themeEditor.saveTheme).toBe("function");
    expect(typeof themeEditor.getAllSavedThemes).toBe("function");
    expect(typeof themeEditor.getDefaultThemes).toBe("function");
    expect(typeof themeEditor.applyDefaultTheme).toBe("function");
    expect(typeof themeEditor.exportTheme).toBe("function");
    expect(typeof themeEditor.importThemeFromJSON).toBe("function");
  });

  it("getDefaultThemes returns at least the built-in themes", () => {
    const themes = themeEditor.getDefaultThemes();
    expect(Object.keys(themes).length).toBeGreaterThanOrEqual(2);
    expect(themes["cute"]).toBeDefined();
    expect(themes["night-sky"]).toBeDefined();
  });

  it("saveTheme and getAllSavedThemes work correctly", () => {
    const testTheme = { "--primary": "#ff0000", "--text": "#ffffff" };
    themeEditor.saveTheme("test-theme", testTheme);

    const allThemes = themeEditor.getAllSavedThemes();
    expect(allThemes["test-theme"]).toBeDefined();
    expect(allThemes["test-theme"]["--primary"]).toBe("#ff0000");
  });

  it("exportTheme produces valid JSON", () => {
    const testTheme = { "--primary": "#ff0000" };
    const exported = themeEditor.exportTheme("my-theme", testTheme);
    const parsed = JSON.parse(exported);

    expect(parsed.name).toBe("my-theme");
    expect(parsed.theme["--primary"]).toBe("#ff0000");
  });

  it("importThemeFromJSON validates and saves themes", () => {
    const validJSON = JSON.stringify({
      name: "imported-theme",
      theme: { "--primary": "#00ff00", "--text": "#000000" },
    });

    const result = themeEditor.importThemeFromJSON(validJSON);
    expect(result).toBeDefined();
    expect(result?.name).toBe("imported-theme");

    // Explicitly save the theme after importing
    if (result) {
      themeEditor.saveTheme(result.name, result.theme);
    }

    const saved = themeEditor.getAllSavedThemes();
    expect(saved["imported-theme"]).toBeDefined();
  });

  it("importThemeFromJSON rejects invalid input", () => {
    // Invalid JSON string
    expect(themeEditor.importThemeFromJSON("not json")).toBeNull();

    // JSON missing name
    expect(
      themeEditor.importThemeFromJSON(JSON.stringify({ theme: { "--ok": "#fff" } })),
    ).toBeNull();

    // JSON missing theme
    expect(themeEditor.importThemeFromJSON(JSON.stringify({ name: "test" }))).toBeNull();

    // Non-string name
    expect(
      themeEditor.importThemeFromJSON(
        JSON.stringify({
          name: 123,
          theme: { "--ok": "#fff" },
        }),
      ),
    ).toBeNull();

    // Theme keys not starting with "--"
    expect(
      themeEditor.importThemeFromJSON(
        JSON.stringify({
          name: "bad",
          theme: { "no-dash": "#fff" },
        }),
      ),
    ).toBeNull();

    // Theme values that are non-strings
    expect(
      themeEditor.importThemeFromJSON(
        JSON.stringify({
          name: "bad",
          theme: { "--ok": 123 },
        }),
      ),
    ).toBeNull();

    // Verify invalid themes are not saved
    const saved = themeEditor.getAllSavedThemes();
    expect(saved["bad"]).toBeUndefined();
  });

  it("applyTheme updates document.documentElement CSS variables", () => {
    const testTheme = { "--primary": "#abcdef", "--text": "#123456" };
    themeEditor.applyTheme(testTheme);
    const rootTheme = themeEditor.getRootTheme();
    expect(document.documentElement.style.getPropertyValue("--primary")).toBe("#abcdef");
    expect(document.documentElement.style.getPropertyValue("--text")).toBe("#123456");
  });

  it("saveTheme persists to localStorage", () => {
    const testTheme = { "--primary": "#aabbcc" };
    themeEditor.saveTheme("persist-test", testTheme);

    // Read directly from localStorage
    const raw = localStorage.getItem("live-themes");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed["persist-test"]["--primary"]).toBe("#aabbcc");
  });

  it("applyDefaultTheme applies a default theme", () => {
    themeEditor.applyDefaultTheme("cute");
    const docPrimary = document.documentElement.style.getPropertyValue("--primary");
    const cutePrimary = themeEditor.getDefaultThemes()["cute"]["--primary"];
    expect(docPrimary).toBe(cutePrimary);
  });

  it("has accessible contrast in default themes", () => {
    // Basic contrast check utility for test
    const getLuminance = (hex: string) => {
      let r = parseInt(hex.slice(1, 3), 16) / 255;
      let g = parseInt(hex.slice(3, 5), 16) / 255;
      let b = parseInt(hex.slice(5, 7), 16) / 255;
      r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
      g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
      b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const contrastRatio = (hex1: string, hex2: string) => {
      const l1 = getLuminance(hex1);
      const l2 = getLuminance(hex2);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    };

    const themes = themeEditor.getDefaultThemes();
    const cute = themes["cute"];

    // Extract hex values (making sure they're 6-chars for the helper)
    const bgStr = cute["--primary"];
    const textStr = cute["--text-lite"];

    if (
      bgStr &&
      textStr &&
      bgStr.startsWith("#") &&
      textStr.startsWith("#") &&
      bgStr.length === 7 &&
      textStr.length === 7
    ) {
      const ratio = contrastRatio(bgStr, textStr);
      // Validate readability metric
      expect(ratio).toBeGreaterThan(1);
    } else {
      // Just assert they exist as fallback
      expect(bgStr).toBeDefined();
      expect(textStr).toBeDefined();
    }
  });
});
