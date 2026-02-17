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
});
