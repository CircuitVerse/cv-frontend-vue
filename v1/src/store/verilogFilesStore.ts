import { defineStore } from "pinia";
import { computed, readonly, ref } from "vue";

export interface VerilogFile {
  name: string;
  content: string;
}

export const DEFAULT_VERILOG_FILE_NAME = "main.v";

function createDefaultFiles(): VerilogFile[] {
  return [{ name: DEFAULT_VERILOG_FILE_NAME, content: "" }];
}

/**
 * Central reactive state for the multi-file Verilog editor (issue #1213).
 *
 * This is the foundational store only: it holds the files, which file is
 * active in the editor and which file is the synthesis entry point. It is
 * not wired into the editor UI, the synthesis pipeline or the circuit
 * data model yet; those follow in sub-issues 2-5 of #1037.
 */
export const useVerilogFilesStore = defineStore("verilogFilesStore", () => {
  const files = ref<VerilogFile[]>(createDefaultFiles());
  const activeFileName = ref<string | null>(DEFAULT_VERILOG_FILE_NAME);
  const entryFileName = ref<string | null>(DEFAULT_VERILOG_FILE_NAME);

  const activeFile = computed<Readonly<VerilogFile> | null>(() => {
    const file = files.value.find(
      (candidate) => candidate.name === activeFileName.value,
    );
    return file ? readonly(file) : null;
  });

  const entryFile = computed<Readonly<VerilogFile> | null>(() => {
    const file = files.value.find(
      (candidate) => candidate.name === entryFileName.value,
    );
    return file ? readonly(file) : null;
  });

  const activeContent = computed(() => activeFile.value?.content ?? "");

  function addFile(name: string, content = ""): void {
    if (!name || files.value.some((file) => file.name === name)) {
      return;
    }
    files.value.push({ name, content });
  }

  function renameFile(oldName: string, newName: string): void {
    if (!oldName || !newName || oldName === newName) {
      return;
    }
    const file = files.value.find((candidate) => candidate.name === oldName);
    if (!file || files.value.some((candidate) => candidate.name === newName)) {
      return;
    }
    file.name = newName;
    if (activeFileName.value === oldName) {
      activeFileName.value = newName;
    }
    if (entryFileName.value === oldName) {
      entryFileName.value = newName;
    }
  }

  function deleteFile(name: string): void {
    if (files.value.length <= 1) {
      return;
    }
    if (entryFileName.value === name) {
      return;
    }
    const index = files.value.findIndex((file) => file.name === name);
    if (index === -1) {
      return;
    }
    files.value.splice(index, 1);
    if (activeFileName.value === name) {
      activeFileName.value = files.value[0]?.name ?? null;
    }
  }

  function setActiveFile(name: string): void {
    if (files.value.some((file) => file.name === name)) {
      activeFileName.value = name;
    }
  }

  function setEntryFile(name: string): void {
    if (files.value.some((file) => file.name === name)) {
      entryFileName.value = name;
    }
  }

  function setFileContent(name: string, content: string): void {
    const file = files.value.find((candidate) => candidate.name === name);
    if (file) {
      file.content = content;
    }
  }

  function getActiveFileContent(): string {
    return activeContent.value;
  }

  function initializeFromSingleFile(
    code: string,
    name: string = DEFAULT_VERILOG_FILE_NAME,
  ): void {
    files.value = [{ name, content: code }];
    activeFileName.value = name;
    entryFileName.value = name;
  }

  function initializeFromFiles(
    filesMap: Record<string, string>,
    entryName?: string,
  ): void {
    const entries = Object.entries(filesMap);
    if (entries.length === 0) {
      return;
    }
    files.value = entries.map(([name, content]) => ({ name, content }));
    activeFileName.value = entries[0]?.[0] ?? null;
    entryFileName.value =
      entryName && files.value.some((file) => file.name === entryName)
        ? entryName
        : activeFileName.value;
  }

  function reset(): void {
    files.value = createDefaultFiles();
    activeFileName.value = DEFAULT_VERILOG_FILE_NAME;
    entryFileName.value = DEFAULT_VERILOG_FILE_NAME;
  }

  // NOTE: these three refs are returned writable on purpose. Pinia registers
  // every ref returned by a setup store as state, and $patch / hydration
  // writes through them (Pinia 3.0.4). Wrapping them in readonly() silently
  // drops those writes, so state restoration breaks. Consumers must use the
  // actions below; activeFile / entryFile stay readonly views.
  return {
    files,
    activeFileName,
    entryFileName,
    activeFile,
    entryFile,
    activeContent,
    addFile,
    renameFile,
    deleteFile,
    setActiveFile,
    setEntryFile,
    setFileContent,
    getActiveFileContent,
    initializeFromSingleFile,
    initializeFromFiles,
    reset,
  };
});
