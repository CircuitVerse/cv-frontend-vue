import {
  scheduleUpdate,
  play,
  updateCanvasSet,
  errorDetectedSet,
  errorDetectedGet,
} from './engine';
import {layoutModeGet} from './layoutMode';
import plotArea from './plotArea';
import simulationArea from './simulationArea';

let prevErrorMessage; // Global variable for error messages
let prevShowMessage; // Global variable for error messages
/**
 * Move the simulation clock forward one tick.
 * @param {SimulationArea} simulationAreaInstance
 */
export function clockTick() {
  if (!simulationArea.clockEnabled) {
    return;
  }
  if (errorDetectedGet()) {
    return;
  }
  if (layoutModeGet()) {
    return;
  }
  updateCanvasSet(true);
  globalScope.clockTick();
  plotArea.nextCycle();
  play();
  scheduleUpdate(0, 20);
}

/**
 * Helper function to show error
 * @param {string} error -The error to be shown
 * @category utils
 */
export function showError(error) {
  errorDetectedSet(true);
  // if error ha been shown return
  if (error === prevErrorMessage) {
    return;
  }
  prevErrorMessage = error;
  const id = Math.floor(Math.random() * 10000);
  $('#MessageDiv').append(
      `<div class='alert alert-danger' role='alert' id='${id}'> ${error}</div>`,
  );
  setTimeout(() => {
    prevErrorMessage = undefined;
    $(`#${id}`).fadeOut();
  }, 1500);
}

// Helper function to show message
export function showMessage(mes) {
  if (mes === prevShowMessage) {
    return;
  }
  prevShowMessage = mes;
  const id = Math.floor(Math.random() * 10000);
  $('#MessageDiv').append(
      `<div class='alert alert-success' role='alert' id='${id}'> ${mes}</div>`,
  );
  setTimeout(() => {
    prevShowMessage = undefined;
    $(`#${id}`).fadeOut();
  }, 2500);
}
