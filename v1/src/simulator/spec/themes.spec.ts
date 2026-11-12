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

import themeOptions, { defaultCustomTheme } from "../src/themer/themes";
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

    const nightSkyRadio = document.body.querySelector(
      'input[value="Night Sky"]',
    ) as HTMLInputElement | null;
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
    const savedCustom = localStorage.getItem("Custom Theme");
    expect(savedCustom).not.toBeNull();
    if (savedCustom) {
      const parsed = JSON.parse(savedCustom);
      expect(parsed["--primary"]).toBe("#abcdef");
    }
  });

  it("checks the Default Theme dot initially", async () => {
    localStorage.setItem("theme", "Default Theme");
    await openAndMountDialog();

    const defaultRadio = document.body.querySelector(
      'input[value="Default Theme"]',
    ) as HTMLInputElement | null;
    const nightSkyRadio = document.body.querySelector(
      'input[value="Night Sky"]',
    ) as HTMLInputElement | null;

    expect(defaultRadio?.checked).toBe(true);
    expect(nightSkyRadio?.checked).toBe(false);
  });

  it("returns the dot and CSS variables to the applied theme after closing without Apply", async () => {
    localStorage.setItem("theme", "Default Theme");
    await openAndMountDialog();

    const nightSkyRadio = document.body.querySelector(
      'input[value="Night Sky"]',
    ) as HTMLInputElement | null;
    expect(nightSkyRadio).not.toBeNull();
    if (nightSkyRadio) {
      nightSkyRadio.click();
      nightSkyRadio.dispatchEvent(new Event("change"));
      await nextTick();
      expect(nightSkyRadio.checked).toBe(true);
    }

    const closeBtn = document.body.querySelector(".dialogClose") as HTMLButtonElement | null;
    expect(closeBtn).not.toBeNull();
    if (closeBtn) {
      closeBtn.click();
      await nextTick();
    }

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

    expect(document.documentElement.style.getPropertyValue("--primary")).toBe(
      themeOptions["Default Theme"]["--primary"],
    );
    expect(themeOptions["Custom Theme"]["--primary"]).toBe(
      defaultCustomTheme["--primary"],
    );
  });

  it("updates CSS variables on the first Apply in Custom Theme", async () => {
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

    const applyButtons = Array.from(document.body.querySelectorAll("button"));
    const applyBtn = applyButtons.find((btn) => btn.textContent?.includes("Apply Theme"));
    expect(applyBtn).toBeDefined();
    if (applyBtn) {
      applyBtn.click();
      await nextTick();
    }

    expect(localStorage.getItem("theme")).toBe("Custom Theme");
    expect(document.documentElement.style.getPropertyValue("--primary")).toBe("#abcdef");
  });
});
