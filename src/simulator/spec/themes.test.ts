import { describe, expect, it } from "vitest";
import themeOptions from "#/simulator/src/themer/themes";
import { THEME } from "#/assets/constants/theme";

describe("Theme system", () => {
  it("includes Sunset Glow in the THEME constant", () => {
    expect(THEME["sunset-glow"]).toBe("Sunset Glow");
  });

  it("provides a palette for Sunset Glow", () => {
    expect(themeOptions["Sunset Glow"]).toBeDefined();
    const colors = themeOptions["Sunset Glow"];
    expect(colors["--bg-navbar"]).toContain("linear-gradient");
  });
});
