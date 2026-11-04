import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { createPinia, setActivePinia } from "pinia";
import vuetify from "#/plugins/vuetify";

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

/**
 * In-memory MockStorage implementation for Vitest environments.
 */
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

const mockStorage = new MockStorage();
if (typeof window !== "undefined") {
  Object.defineProperty(window, "localStorage", {
    value: mockStorage,
    writable: true,
    configurable: true,
  });
}
Object.defineProperty(globalThis, "localStorage", {
  value: mockStorage,
  writable: true,
  configurable: true,
});

import themeOptions, { defaultCustomTheme } from "../src/themer/themes";
import { CreateAbstraction } from "../src/themer/customThemeAbstraction";
import ApplyThemes from "#/components/DialogBox/Themes/ApplyThemes.vue";
import { useState } from "#/store/SimulatorStore/state";

describe("Theme subsystem & dialog (v0, #1504)", () => {
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

    // Find Custom Theme button in DOM
    const buttons = Array.from(document.body.querySelectorAll("button"));
    const customThemeBtn = buttons.find((btn) => btn.textContent?.includes("Custom Theme"));
    expect(customThemeBtn).toBeDefined();

    if (customThemeBtn) {
      customThemeBtn.click();
      await nextTick();
    }

    // Should not throw TypeError and should fallback to defaultCustomTheme
    expect(themeOptions["Custom Theme"]["--primary"]).toBe(defaultCustomTheme["--primary"]);

    // Close without applying - applied theme must be restored
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

    // Select Night Sky theme radio
    const nightSkyRadio = document.body.querySelector('input[value="Night Sky"]') as HTMLInputElement | null;
    expect(nightSkyRadio).not.toBeNull();
    if (nightSkyRadio) {
      nightSkyRadio.click();
      nightSkyRadio.dispatchEvent(new Event("change"));
      await nextTick();
    }

    const buttons = Array.from(document.body.querySelectorAll("button"));
    const applyBtn = buttons.find((btn) => btn.textContent?.includes("Apply Theme"));
    expect(applyBtn).toBeDefined();
    if (applyBtn) {
      applyBtn.click();
      await nextTick();
    }

    expect(localStorage.getItem("theme")).toBe("Night Sky");
    // Ensure Custom Theme was NOT wiped out
    const savedCustom = localStorage.getItem("Custom Theme");
    expect(savedCustom).not.toBeNull();
    if (savedCustom) {
      const parsed = JSON.parse(savedCustom);
      expect(parsed["--primary"]).toBe("#abcdef");
    }
  });

  it("reverts preview to applied theme when dialog is closed without applying", async () => {
    localStorage.setItem("theme", "Default Theme");
    await openAndMountDialog();

    // Preview Night Sky
    const nightSkyRadio = document.body.querySelector('input[value="Night Sky"]') as HTMLInputElement | null;
    expect(nightSkyRadio).not.toBeNull();
    if (nightSkyRadio) {
      nightSkyRadio.click();
      nightSkyRadio.dispatchEvent(new Event("change"));
      await nextTick();
    }

    // Close dialog without clicking Apply
    const closeBtn = document.body.querySelector(".dialogClose") as HTMLButtonElement | null;
    expect(closeBtn).not.toBeNull();
    if (closeBtn) {
      closeBtn.click();
      await nextTick();
    }

    expect(localStorage.getItem("theme")).toBe("Default Theme");
  });
});

