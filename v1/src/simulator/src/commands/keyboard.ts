/**
 * Keyboard commands for the simulator: modifier tracking, undo/redo, zoom,
 * per-element key handling, multi-select, save, select-all, deselect,
 * bit-width / clock prompts and delete.
 *
 * Bound to `window` by `composables/useSimulatorShortcuts.ts`.
 */
import { simulationArea } from "../simulationArea";
import {
  scheduleUpdate,
  wireToBeCheckedSet,
  updatePositionSet,
  updateSimulationSet,
  updateCanvasSet,
  errorDetectedSet,
} from "../engine";
import { hideProperties, showProperties, deleteSelected, exitFullView } from "../ux";
import { saveOffline } from "../data/project";
import undo from "../data/undo";
import redo from "../data/redo";
import { selectAll } from "../events";
import { ZoomIn, ZoomOut } from "./zoom";

type SelectedLike = {
  keyDown?: (key: string) => void;
  keyDown2?: (key: string) => void;
  keyDown3?: (key: string) => void;
  objectType?: string;
  bitWidth?: number;
  newBitWidth?: (width: number) => void;
};

function isTypingTarget(): boolean {
  const el = document.activeElement;
  return !!el && (el.tagName == "INPUT" || el != document.body);
}

function isPointerOutsideCanvas(): boolean {
  return (
    simulationArea.mouseRawX < 0 ||
    simulationArea.mouseRawY < 0 ||
    simulationArea.mouseRawX > width ||
    simulationArea.mouseRawY > height
  );
}

/**
 * Handles `keyup` on the window: releases the shift / control modifier
 * flags and closes full view on Escape.
 * @param e - keyboard event
 */
export function handleSimulatorKeyUp(e: KeyboardEvent): void {
  if (e.key === "Escape") exitFullView();

  scheduleUpdate(1);
  simulationArea.shiftDown = e.shiftKey;
  if (e.keyCode == 16) {
    simulationArea.shiftDown = false;
  }
  if (e.key == "Meta" || e.key == "Control") {
    simulationArea.controlDown = false;
  }
}

/**
 * Handles `keydown` on the window (capture phase). Ignored while an input
 * or any element other than `<body>` has focus.
 * @param e - keyboard event
 */
export function handleSimulatorKeyDown(e: KeyboardEvent): void {
  if (isTypingTarget()) return;

  simulationArea.shiftDown = e.shiftKey;
  if (e.key == "Meta" || e.key == "Control") {
    simulationArea.controlDown = true;
  }

  if (simulationArea.controlDown && e.key.charCodeAt(0) == 122 && !simulationArea.shiftDown) {
    // detect the special CTRL-Z code
    undo();
  }
  if (simulationArea.controlDown && e.key.charCodeAt(0) == 122 && simulationArea.shiftDown) {
    // detect the special Cmd + shift + z code (macOs)
    redo();
  }
  if (simulationArea.controlDown && e.key.charCodeAt(0) == 121 && !simulationArea.shiftDown) {
    // detect the special ctrl + Y code (windows)
    redo();
  }

  // If mouse is focusing on input element, then override any action
  if (isPointerOutsideCanvas()) {
    return;
  }
  // HACK TO REMOVE FOCUS ON PROPERTIES
  if ((document.activeElement as HTMLInputElement | null)?.type == "number") {
    hideProperties();
    showProperties(simulationArea.lastSelected);
  }

  errorDetectedSet(false);
  updateSimulationSet(true);
  updatePositionSet(true);
  simulationArea.shiftDown = e.shiftKey;

  if (e.key == "Meta" || e.key == "Control") {
    simulationArea.controlDown = true;
  }

  // zoom in (+)
  if ((simulationArea.controlDown && (e.keyCode == 187 || e.keyCode == 171)) || e.keyCode == 107) {
    e.preventDefault();
    ZoomIn();
  }
  // zoom out (-)
  if ((simulationArea.controlDown && (e.keyCode == 189 || e.keyCode == 173)) || e.keyCode == 109) {
    e.preventDefault();
    ZoomOut();
  }

  if (isPointerOutsideCanvas()) return;

  scheduleUpdate(1);
  updateCanvasSet(true);
  wireToBeCheckedSet(1);

  const lastSelected = simulationArea.lastSelected as SelectedLike | null | undefined;

  if (lastSelected && lastSelected.keyDown) {
    if (
      e.key.toString().length == 1 ||
      e.key.toString() == "Backspace" ||
      e.key.toString() == "Enter"
    ) {
      lastSelected.keyDown(e.key.toString());
      e.cancelBubble = true;
      e.returnValue = false;

      //e.stopPropagation works in Firefox.
      if (e.stopPropagation) {
        e.stopPropagation();
        e.preventDefault();
      }
      return;
    }
  }

  if (lastSelected && lastSelected.keyDown2) {
    if (e.key.toString().length == 1) {
      lastSelected.keyDown2(e.key.toString());
      return;
    }
  }

  if (lastSelected && lastSelected.keyDown3) {
    if (e.key.toString() != "Backspace" && e.key.toString() != "Delete") {
      lastSelected.keyDown3(e.key.toString());
      return;
    }
  }

  if (e.keyCode == 16) {
    simulationArea.shiftDown = true;
    if (
      lastSelected &&
      !lastSelected.keyDown &&
      lastSelected.objectType != "Wire" &&
      lastSelected.objectType != "CircuitElement" &&
      !simulationArea.multipleObjectSelections.includes(simulationArea.lastSelected!)
    ) {
      simulationArea.multipleObjectSelections.push(simulationArea.lastSelected!);
    }
  }

  // Detect offline save shortcut (CTRL+SHIFT+S)
  if (simulationArea.controlDown && e.keyCode == 83 && simulationArea.shiftDown) {
    saveOffline();
    e.preventDefault();
  }

  // Detect Select all Shortcut
  if (simulationArea.controlDown && (e.keyCode == 65 || e.keyCode == 97)) {
    selectAll();
    e.preventDefault();
  }

  // deselect all Shortcut
  if (e.keyCode == 27) {
    simulationArea.multipleObjectSelections = [];
    simulationArea.lastSelected = undefined;
    e.preventDefault();
  }

  if ((e.keyCode == 113 || e.keyCode == 81) && lastSelected != undefined) {
    if (lastSelected.bitWidth !== undefined) {
      lastSelected.newBitWidth?.(parseInt(prompt("Enter new bitWidth") ?? "", 10));
    }
  }

  if (simulationArea.controlDown && (e.key == "T" || e.key == "t")) {
    // e.preventDefault(); //browsers normally open a new tab
    simulationArea.changeClockTime(Number(prompt("Enter Time:")));
  }

  if (e.keyCode == 8 || e.key == "Delete") {
    deleteSelected();
  }
}
