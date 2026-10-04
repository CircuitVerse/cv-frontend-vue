import { beforeEach, describe, expect, it, vi } from "vitest";

describe("themes", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("falls back to the default custom theme when stored data is malformed", async () => {
    localStorage.setItem("Custom Theme", "{invalid json");
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { default: themes } = await import("../src/themer/themes");

    expect(themes["Custom Theme"]["--primary"]).toBe("#454545");
    expect(localStorage.getItem("Custom Theme")).toBeNull();
    expect(warning).toHaveBeenCalled();

    warning.mockRestore();
  });
});
