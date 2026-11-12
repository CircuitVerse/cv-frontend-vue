import { simulationArea } from "../simulationArea";
import { copy, paste, selectAll } from "../events";
import { deleteSelected } from "../ux";
import { verilogModeGet } from "../Verilog2CV";
import { updateRestrictedElementsInScope } from "../restrictedElementDiv";

export { copy, paste, selectAll, deleteSelected };

const isIe =
  navigator.userAgent.toLowerCase().indexOf("msie") != -1 ||
  navigator.userAgent.toLowerCase().indexOf("trident") != -1;

type LegacyClipboardWindow = Window & {
  clipboardData?: { setData(format: string, data: string): void; getData(format: string): string };
};

/** Clipboard events are only handled while the page body itself has focus. */
function isClipboardTargetBody(): boolean {
  const el = document.activeElement;
  return !!el && el.tagName != "INPUT" && el.tagName == "BODY";
}

function selectionToCopy() {
  simulationArea.copyList = simulationArea.multipleObjectSelections.slice();
  const lastSelected = simulationArea.lastSelected;
  if (
    lastSelected &&
    lastSelected !== (simulationArea as unknown as { root?: unknown }).root &&
    !simulationArea.copyList.includes(lastSelected)
  ) {
    simulationArea.copyList.push(lastSelected);
  }
  return simulationArea.copyList;
}

function writeClipboard(e: ClipboardEvent, text: string | undefined): void {
  localStorage.setItem("clipboardData", text as string);
  e.preventDefault();
  if (text == undefined) return;
  if (isIe) {
    (window as LegacyClipboardWindow).clipboardData?.setData("Text", text);
  } else {
    e.clipboardData?.setData("text/plain", text);
  }
}

/**
 * `cut` handler: serialises the current selection to the clipboard and
 * removes it from the circuit.
 * @param e - clipboard event
 */
export function cutSelection(e: ClipboardEvent): void {
  if (verilogModeGet()) return;
  if (!isClipboardTargetBody()) return;

  const textToPutOnClipboard = copy(selectionToCopy(), true);
  // Updated restricted elements
  updateRestrictedElementsInScope();
  writeClipboard(e, textToPutOnClipboard);
}

/**
 * `copy` handler: serialises the current selection to the clipboard.
 * @param e - clipboard event
 */
export function copySelection(e: ClipboardEvent): void {
  if (verilogModeGet()) return;
  if (!isClipboardTargetBody()) return;

  const textToPutOnClipboard = copy(selectionToCopy());
  // Updated restricted elements
  updateRestrictedElementsInScope();
  writeClipboard(e, textToPutOnClipboard);
}

/**
 * `paste` handler: reads circuit data from the clipboard and pastes it.
 * @param e - clipboard event
 */
export function pasteFromClipboard(e: ClipboardEvent): void {
  if (!isClipboardTargetBody()) return;

  let data: string | undefined;
  if (isIe) {
    data = (window as LegacyClipboardWindow).clipboardData?.getData("Text");
  } else {
    data = e.clipboardData?.getData("text/plain");
  }

  if (data == null) return;
  paste(data);

  // Updated restricted elements
  updateRestrictedElementsInScope();

  e.preventDefault();
}
