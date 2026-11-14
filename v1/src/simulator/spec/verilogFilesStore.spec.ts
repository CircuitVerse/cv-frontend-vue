import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, test } from "vitest";
import { useVerilogFilesStore } from "../../store/verilogFilesStore";

describe("useVerilogFilesStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test("starts with one default file", () => {
    const store = useVerilogFilesStore();

    expect(store.files).toHaveLength(1);
    expect(store.files[0]?.name).toBe("main.v");
    expect(store.files[0]?.content).toBe("");
    expect(store.activeFileName).toBe("main.v");
    expect(store.entryFileName).toBe("main.v");
    expect(store.activeContent).toBe("");
    expect(store.getActiveFileContent()).toBe("");
  });

  test("addFile adds a file and ignores duplicate names", () => {
    const store = useVerilogFilesStore();

    store.addFile("helper.v", "module helper; endmodule");

    expect(store.files).toHaveLength(2);
    expect(store.files[1]?.name).toBe("helper.v");
    expect(store.files[1]?.content).toBe("module helper; endmodule");

    store.addFile("helper.v", "module other; endmodule");

    expect(store.files).toHaveLength(2);
    expect(store.files[1]?.content).toBe("module helper; endmodule");
  });

  test("setActiveFile switches the active content", () => {
    const store = useVerilogFilesStore();

    store.addFile("helper.v", "module helper; endmodule");
    store.setActiveFile("helper.v");

    expect(store.activeFileName).toBe("helper.v");
    expect(store.activeContent).toBe("module helper; endmodule");
    expect(store.getActiveFileContent()).toBe("module helper; endmodule");

    store.setFileContent("helper.v", "module helper2; endmodule");

    expect(store.activeContent).toBe("module helper2; endmodule");

    store.setActiveFile("missing.v");

    expect(store.activeFileName).toBe("helper.v");
  });

  test("renameFile updates the active and entry pointers", () => {
    const store = useVerilogFilesStore();

    store.addFile("helper.v", "module helper; endmodule");
    store.setActiveFile("helper.v");
    store.setEntryFile("helper.v");
    store.renameFile("helper.v", "renamed.v");

    expect(store.files.map((file) => file.name)).toEqual([
      "main.v",
      "renamed.v",
    ]);
    expect(store.activeFileName).toBe("renamed.v");
    expect(store.entryFileName).toBe("renamed.v");

    store.renameFile("renamed.v", "main.v");

    expect(store.files.map((file) => file.name)).toEqual([
      "main.v",
      "renamed.v",
    ]);
  });

  test("deleteFile refuses the last file and moves active/entry", () => {
    const store = useVerilogFilesStore();

    store.deleteFile("main.v");

    expect(store.files).toHaveLength(1);
    expect(store.files[0]?.name).toBe("main.v");

    store.addFile("helper.v", "module helper; endmodule");
    store.setActiveFile("helper.v");
    store.setEntryFile("helper.v");
    store.deleteFile("helper.v");

    expect(store.files).toHaveLength(1);
    expect(store.activeFileName).toBe("main.v");
    expect(store.entryFileName).toBe("main.v");
  });

  test("setEntryFile marks the synthesis entry file", () => {
    const store = useVerilogFilesStore();

    store.addFile("helper.v", "module helper; endmodule");
    store.setEntryFile("helper.v");

    expect(store.entryFileName).toBe("helper.v");
    expect(store.activeFileName).toBe("main.v");

    store.setEntryFile("missing.v");

    expect(store.entryFileName).toBe("helper.v");
  });

  test("initializeFromSingleFile loads old single-file code as main.v", () => {
    const store = useVerilogFilesStore();

    store.addFile("helper.v", "module helper; endmodule");
    store.initializeFromSingleFile("module top; endmodule");

    expect(store.files).toHaveLength(1);
    expect(store.files[0]?.name).toBe("main.v");
    expect(store.files[0]?.content).toBe("module top; endmodule");
    expect(store.activeFileName).toBe("main.v");
    expect(store.entryFileName).toBe("main.v");
    expect(store.activeContent).toBe("module top; endmodule");

    store.initializeFromSingleFile("module top; endmodule", "top.v");

    expect(store.files[0]?.name).toBe("top.v");
    expect(store.activeFileName).toBe("top.v");
    expect(store.entryFileName).toBe("top.v");
  });

  test("reset restores the defaults", () => {
    const store = useVerilogFilesStore();

    store.addFile("helper.v", "module helper; endmodule");
    store.setActiveFile("helper.v");
    store.setEntryFile("helper.v");
    store.reset();

    expect(store.files).toHaveLength(1);
    expect(store.files[0]?.name).toBe("main.v");
    expect(store.files[0]?.content).toBe("");
    expect(store.activeFileName).toBe("main.v");
    expect(store.entryFileName).toBe("main.v");
    expect(store.activeContent).toBe("");
  });
});
