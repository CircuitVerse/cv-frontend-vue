import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { createPinia, setActivePinia } from "pinia";
import vuetify from "#/plugins/vuetify";

vi.hoisted(() => {
  class MockStorage implements Storage {
    private store: Record<string, string> = {};

    get length(): number {
      return Object.keys(this.store).length;
    }

    clear(): void {
      this.store = {};
    }

    getItem(key: string): string | null {
      return this.store[key] ?? null;
    }

    key(index: number): string | null {
      return Object.keys(this.store)[index] ?? null;
    }

    removeItem(key: string): void {
      delete this.store[key];
    }

    setItem(key: string, value: string): void {
      this.store[key] = String(value);
    }
  }

  const storage = new MockStorage();
  if (typeof window !== "undefined") {
    Object.defineProperty(window, "localStorage", {
      value: storage,
      writable: true,
      configurable: true,
    });
  }
  Object.defineProperty(globalThis, "localStorage", {
    value: storage,
    writable: true,
    configurable: true,
  });
  return storage;
});

vi.mock("codemirror", () => ({
  default: { fromTextArea: vi.fn(() => ({ setValue: vi.fn() })) },
  fromTextArea: vi.fn(() => ({ setValue: vi.fn() })),
}));

vi.mock("codemirror-editor-vue3", () => ({
  defineSimpleMode: vi.fn(),
}));

vi.mock("#/simulator/src/themer/themer", async (importOriginal) => {
  const actual = await importOriginal<typeof import("#/simulator/src/themer/themer")>();
  return {
    ...actual,
    updateBG: vi.fn(),
  };
});

import themeOptions, { defaultCustomTheme, getCustomTheme } from "../src/themer/themes";
import { updateThemeForStyle } from "../src/themer/themer";
import { CreateAbstraction } from "../src/themer/customThemeAbstraction";
import ApplyThemes from "#/components/DialogBox/Themes/ApplyThemes.vue";
import { useState } from "#/store/SimulatorStore/state";
describe("Theme subsystem and dialog", () => {
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    localStorage.clear();
    localStorage.setItem("theme", "Default Theme");
    document.body.innerHTML = "";
  });

  const openAndMountDialog = async () => {
    const simulatorState = useState();
    simulatorState.dialogBox.theme_dialog = true;
    const wrapper = mount(ApplyThemes, {
      attachTo: document.body,
      global: { plugins: [pinia, vuetify] },
    });
    await nextTick();
    return wrapper;
  };

  it("defaultCustomTheme contains --table-head-dark and --br-circuit from Default Theme", () => {
    expect(defaultCustomTheme["--table-head-dark"]).toBe("#3d3d3d");
    expect(defaultCustomTheme["--br-circuit"]).toBe("#454545");
  });

  it("CreateAbstraction succeeds with defaultCustomTheme", () => {
    const abstraction = CreateAbstraction(defaultCustomTheme);
    expect(abstraction.Primary?.color).toBe(defaultCustomTheme["--primary"]);
    expect(abstraction.Navbar?.color).toBe(defaultCustomTheme["--bg-navbar"]);
    expect(abstraction.Canvas?.color).toBe(defaultCustomTheme["--canvas-fill"]);
  });

  it("falls back to defaultCustomTheme when localStorage Custom Theme is 'null'", async () => {
    localStorage.setItem("Custom Theme", "null");
    await openAndMountDialog();

    const buttons = Array.from(document.body.querySelectorAll("button"));
    const customThemeBtn = buttons.find((btn) => btn.textContent?.includes("Custom Theme"));
    expect(customThemeBtn).toBeDefined();

    if (customThemeBtn) {
      customThemeBtn.click();
      await nextTick();
    }

    expect(themeOptions["Custom Theme"]["--primary"]).toBe(defaultCustomTheme["--primary"]);

    const closeBtn = document.body.querySelector(".dialogClose") as HTMLButtonElement | null;
    if (closeBtn) {
      closeBtn.click();
      await nextTick();
    }
    expect(localStorage.getItem("theme")).toBe("Default Theme");
  });

  it("falls back to defaultCustomTheme when localStorage Custom Theme contains invalid JSON", async () => {
    localStorage.setItem("Custom Theme", "{invalid-json-string");
    await openAndMountDialog();

    const buttons = Array.from(document.body.querySelectorAll("button"));
    const customThemeBtn = buttons.find((btn) => btn.textContent?.includes("Custom Theme"));
    expect(customThemeBtn).toBeDefined();

    if (customThemeBtn) {
      customThemeBtn.click();
      await nextTick();
    }

    expect(themeOptions["Custom Theme"]["--bg-navbar"]).toBe(defaultCustomTheme["--bg-navbar"]);
  });

  it("preserves saved Custom Theme in localStorage when applying a predefined theme", async () => {
    const customData = { ...defaultCustomTheme, "--primary": "#abcdef" };
    localStorage.setItem("Custom Theme", JSON.stringify(customData));

    await openAndMountDialog();

    const nightSkyCard = document.body.querySelector(
      '[id="Night Sky"] .themeSel',
    ) as HTMLElement | null;
    expect(nightSkyCard).not.toBeNull();
    nightSkyCard?.click();
    await nextTick();

    const buttons = Array.from(document.body.querySelectorAll("button"));
    const applyBtn = buttons.find((btn) => btn.textContent?.includes("Apply Theme"));
    expect(applyBtn).toBeDefined();
    if (applyBtn) {
      applyBtn.click();
      await nextTick();
    }

    expect(localStorage.getItem("theme")).toBe("Night Sky");
    const savedCustom = localStorage.getItem("Custom Theme");
    expect(savedCustom).not.toBeNull();
    if (savedCustom) {
      const parsed = JSON.parse(savedCustom);
      expect(parsed["--primary"]).toBe("#abcdef");
    }
  });

  it("selects Default Theme dot after picking another theme and then Default", async () => {
    localStorage.setItem("theme", "Default Theme");
    await openAndMountDialog();

    const defaultRadio = document.body.querySelector(
      'input[value="Default Theme"]',
    ) as HTMLInputElement | null;
    const nightSkyRadio = document.body.querySelector(
      'input[value="Night Sky"]',
    ) as HTMLInputElement | null;

    expect(defaultRadio).not.toBeNull();
    expect(nightSkyRadio).not.toBeNull();

    // 1. Pick another theme (Night Sky)
    const nightSkyCard = document.body.querySelector(
      '[id="Night Sky"] .themeSel',
    ) as HTMLElement | null;
    expect(nightSkyCard).not.toBeNull();
    nightSkyCard?.click();
    await nextTick();

    expect(nightSkyRadio!.checked).toBe(true);
    expect(defaultRadio!.checked).toBe(false);

    // 2. Pick Default Theme again
    const defaultCard = document.body.querySelector(
      '[id="Default Theme"] .themeSel',
    ) as HTMLElement | null;
    expect(defaultCard).not.toBeNull();
    defaultCard?.click();
    await nextTick();

    expect(defaultRadio!.checked).toBe(true);
    expect(nightSkyRadio!.checked).toBe(false);
    expect(document.documentElement.style.getPropertyValue("--primary")).toBe(
      themeOptions["Default Theme"]["--primary"],
    );
  });

  it("returns the dot and CSS variables to the applied theme after closing without Apply", async () => {
    localStorage.setItem("theme", "Default Theme");
    await openAndMountDialog();

    const nightSkyRadio = document.body.querySelector(
      'input[value="Night Sky"]',
    ) as HTMLInputElement | null;
    expect(nightSkyRadio).not.toBeNull();
    const nightSkyCard = document.body.querySelector(
      '[id="Night Sky"] .themeSel',
    ) as HTMLElement | null;
    expect(nightSkyCard).not.toBeNull();
    nightSkyCard?.click();
    await nextTick();
    expect(nightSkyRadio?.checked).toBe(true);

    const closeBtn = document.body.querySelector(".dialogClose") as HTMLButtonElement | null;
    expect(closeBtn).not.toBeNull();
    if (closeBtn) {
      closeBtn.click();
      await nextTick();
    }

    expect(localStorage.getItem("theme")).toBe("Default Theme");

    await openAndMountDialog();
    const defaultRadio = document.body.querySelector(
      'input[value="Default Theme"]',
    ) as HTMLInputElement | null;
    const nightSkyRadioAfter = document.body.querySelector(
      'input[value="Night Sky"]',
    ) as HTMLInputElement | null;

    expect(defaultRadio?.checked).toBe(true);
    expect(nightSkyRadioAfter?.checked).toBe(false);
    expect(document.documentElement.style.getPropertyValue("--primary")).toBe(
      themeOptions["Default Theme"]["--primary"],
    );
  });
  it("keeps the saved theme and CSS when closing Custom Theme without Apply", async () => {
    localStorage.setItem("theme", "Default Theme");
    await openAndMountDialog();

    const buttons = Array.from(document.body.querySelectorAll("button"));
    const customThemeBtn = buttons.find((btn) => btn.textContent?.includes("Custom Theme"));
    expect(customThemeBtn).toBeDefined();
    if (customThemeBtn) {
      customThemeBtn.click();
      await nextTick();
    }

    const primaryInput = document.body.querySelector(
      'input[name="Primary"]',
    ) as HTMLInputElement | null;
    expect(primaryInput).not.toBeNull();
    if (primaryInput) {
      primaryInput.value = "#abcdef";
      primaryInput.dispatchEvent(new Event("input"));
      await nextTick();
    }

    const closeBtn = document.body.querySelector(".dialogClose") as HTMLButtonElement | null;
    expect(closeBtn).not.toBeNull();
    if (closeBtn) {
      closeBtn.click();
      await nextTick();
    }

    expect(localStorage.getItem("theme")).toBe("Default Theme");
    expect(document.documentElement.style.getPropertyValue("--primary")).toBe(
      themeOptions["Default Theme"]["--primary"],
    );
    expect(themeOptions["Custom Theme"]["--primary"]).toBe(defaultCustomTheme["--primary"]);
  });

  it("updates CSS variables on the first Apply in Custom Theme when a preset was applied first", async () => {
    localStorage.setItem("theme", "Night Sky");
    updateThemeForStyle("Night Sky");
    expect(document.documentElement.style.getPropertyValue("--primary")).toBe(
      themeOptions["Night Sky"]["--primary"],
    );

    await openAndMountDialog();

    const buttons = Array.from(document.body.querySelectorAll("button"));
    const customThemeBtn = buttons.find((btn) => btn.textContent?.includes("Custom Theme"));
    expect(customThemeBtn).toBeDefined();
    if (customThemeBtn) {
      customThemeBtn.click();
      await nextTick();
    }

    const applyButtons = Array.from(document.body.querySelectorAll("button"));
    const applyBtn = applyButtons.find((btn) => btn.textContent?.includes("Apply Theme"));
    expect(applyBtn).toBeDefined();
    if (applyBtn) {
      applyBtn.click();
      await nextTick();
    }

    expect(localStorage.getItem("theme")).toBe("Custom Theme");
    expect(document.documentElement.style.getPropertyValue("--primary")).toBe(
      defaultCustomTheme["--primary"],
    );
  });
});

describe("getCustomTheme validation", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns the default theme when nothing is saved", () => {
    expect(getCustomTheme()).toEqual(defaultCustomTheme);
  });

  it("falls back to the default theme on malformed JSON", () => {
    localStorage.setItem("Custom Theme", "{invalid-json-string");
    expect(getCustomTheme()).toEqual(defaultCustomTheme);
  });

  it("falls back to the default theme for an empty object", () => {
    localStorage.setItem("Custom Theme", "{}");
    expect(getCustomTheme()).toEqual(defaultCustomTheme);
  });

  it("falls back to the default theme for an array", () => {
    localStorage.setItem("Custom Theme", '["#123456"]');
    expect(getCustomTheme()).toEqual(defaultCustomTheme);
  });

  it.each(["null", '"#123456"', "42", "true"])(
    "falls back to the default theme for non-object JSON %s",
    (saved) => {
      localStorage.setItem("Custom Theme", saved);
      expect(getCustomTheme()).toEqual(defaultCustomTheme);
    },
  );

  it("fills missing keys from the default theme for a partial saved theme", () => {
    localStorage.setItem("Custom Theme", JSON.stringify({ "--bg-navbar": "#123456" }));
    const theme = getCustomTheme();
    expect(theme["--bg-navbar"]).toBe("#123456");
    expect(theme["--primary"]).toBe(defaultCustomTheme["--primary"]);
    expect(theme["--canvas-fill"]).toBe(defaultCustomTheme["--canvas-fill"]);
    // No field is left undefined, so CreateAbstraction gets a color for every key.
    expect(Object.values(theme).every((value) => typeof value === "string")).toBe(true);
    expect(() => CreateAbstraction(theme)).not.toThrow();
    expect(CreateAbstraction(theme).Primary?.color).toBe(defaultCustomTheme["--primary"]);
  });
  it("falls back per key for invalid color strings and non-string values", () => {
    localStorage.setItem(
      "Custom Theme",
      JSON.stringify({
        "--primary": "red",
        "--bg-navbar": "#12",
        "--canvas-fill": 123,
        "--text": null,
        "--bg-tabs": "#abcdef",
      }),
    );
    const theme = getCustomTheme();
    expect(theme["--primary"]).toBe(defaultCustomTheme["--primary"]);
    expect(theme["--bg-navbar"]).toBe(defaultCustomTheme["--bg-navbar"]);
    expect(theme["--canvas-fill"]).toBe(defaultCustomTheme["--canvas-fill"]);
    expect(theme["--text"]).toBe(defaultCustomTheme["--text"]);
    expect(theme["--bg-tabs"]).toBe("#abcdef");
  });

  it("keeps valid saved values, including 8-digit hex and rgba", () => {
    localStorage.setItem(
      "Custom Theme",
      JSON.stringify({
        ...defaultCustomTheme,
        "--primary": "#abcdef",
        "--bg-primary-moz": "#454545e6",
        "--bg-primary-chr": "rgba(46, 43, 33, 1)",
      }),
    );
    const theme = getCustomTheme();
    expect(theme["--primary"]).toBe("#abcdef");
    expect(theme["--bg-primary-moz"]).toBe("#454545e6");
    expect(theme["--bg-primary-chr"]).toBe("rgba(46, 43, 33, 1)");
  });

  it("ignores unknown saved keys", () => {
    localStorage.setItem(
      "Custom Theme",
      JSON.stringify({ "--unknown-key": "#123456", "--primary": "#abcdef" }),
    );
    const theme = getCustomTheme();
    expect(theme).not.toHaveProperty("--unknown-key");
    expect(theme["--primary"]).toBe("#abcdef");
  });

  it("every built-in theme color is #rrggbb, except intentionally rgba or 8-digit hex", () => {
    const colorPattern = /^(?:#[0-9a-fA-F]{6}|#[0-9a-fA-F]{8}|rgba\(.+\)|hsla?\(.+\))$/;
    for (const [themeName, theme] of Object.entries(themeOptions)) {
      for (const [key, value] of Object.entries(theme)) {
        expect(value, `${themeName} ${key}`).toMatch(colorPattern);
      }
    }
    for (const [key, value] of Object.entries(defaultCustomTheme)) {
      expect(value, `defaultCustomTheme ${key}`).toMatch(colorPattern);
    }
  });
});
