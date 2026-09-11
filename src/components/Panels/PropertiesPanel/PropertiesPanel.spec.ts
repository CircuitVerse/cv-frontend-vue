import { describe, test, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import PropertiesPanel from "./PropertiesPanel.vue";

vi.mock("#/components/Panels/PropertiesPanel/ModuleProperty/ModuleProperty.vue", () => ({
  default: { name: "ModuleProperty", template: "<div />" },
}));
vi.mock("#/components/Panels/PropertiesPanel/LayoutProperty/LayoutProperty.vue", () => ({
  default: { name: "LayoutProperty", template: "<div />" },
}));

vi.mock("codemirror", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    fromTextArea: vi.fn(() => ({ setValue: () => {} })),
  };
});

vi.mock("codemirror-editor-vue3", () => ({
  defineSimpleMode: vi.fn(),
}));

describe("PropertiesPanel.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test("clears its polling interval on unmount instead of leaking it", () => {
    const wrapper = mount(PropertiesPanel);

    const timerCountAfterMount = vi.getTimerCount();
    expect(timerCountAfterMount).toBeGreaterThan(0);

    wrapper.unmount();

    expect(vi.getTimerCount()).toBe(timerCountAfterMount - 1);
  });
});
