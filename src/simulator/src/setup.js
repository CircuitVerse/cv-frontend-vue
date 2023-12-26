import {metadata} from './metadata';
import {generateId} from './utils';
import {showMessage} from './utils_clock';
import {plotArea} from './plot_area';

import {dots} from './canvas_api';
import {update, updateSimulationSet, updateCanvasSet} from './engine';
import {setupUI} from './ux';
import {startMainListeners} from './listeners';
import {newCircuit} from './circuit';
import {load} from './data/load';
import {save} from './data/save';
import {showTourGuide} from './tutorials';
import {setupModules} from './module_setup';
// verilog.js from codemirror is not working because array prototype is changed.
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/hint/anyword-hint';
import 'codemirror/addon/hint/show-hint';
import {setupCodeMirrorEnvironment} from './verilog_to_cv';
import '../vendor/jquery-ui.min';
import {confirmSingleOption}
  from '#/components/helpers/confirmComponent/ConfirmComponent.vue';
import {getToken} from '#/pages/simulatorHandler.vue';
import {SimulationArea} from './simulation_area';

/**
 * to resize window and setup things it
 * sets up new width for the canvas variables.
 * Also redraws the grid.
 * @category setup
 */
export function resetup() {
  DPR = window.devicePixelRatio || 1;
  if (lightMode) {
    DPR = 1;
  }
  const canvasArea = document.getElementById('canvasArea');
  width = canvasArea.clientWidth * DPR;
  if (!embed) {
    height =
      (document.body.clientHeight -
        document.getElementById('toolbar').clientHeight) *
      DPR;
  } else {
    height = canvasArea.clientHeight * DPR;
  }
  // redraw grid
  dots(globalScope);
  globalScope.backgroundArea.canvas.style.height =
    height / DPR + 100 + 'px';
  globalScope.backgroundArea.canvas.style.width =
    width / DPR + 100 + 'px';
  document.getElementById('canvasArea').style.height = height / DPR + 'px';
  globalScope.simulationArea.canvas.width = width;
  globalScope.simulationArea.canvas.height = height;
  globalScope.backgroundArea.canvas.width = width + 100 * DPR;
  globalScope.backgroundArea.canvas.height = height + 100 * DPR;
  if (!embed) {
    plotArea.setup();
  }
  updateCanvasSet(true);
  update(); // INEFFICIENT, needs to be deprecated
  globalScope.simulationArea.prevScale = 0;
  dots(globalScope);
}

window.onresize = resetup; // listener
window.onorientationchange = resetup; // listener
screen.orientation.addEventListener('change', resetup);
// for mobiles
window.addEventListener('orientationchange', resetup); // listener

/**
 * function to setup environment variables like projectId and DPR
 * @category setup
 */
function setupEnvironment() {
  setupModules();
  const projectId = generateId();
  window.projectId = projectId;
  updateSimulationSet(true);
  newCircuit('Main');
  window.data = {};
  resetup();
  setupCodeMirrorEnvironment();
}

/**
 * It initializes some useful array which are helpful
 * while simulating, saving and loading project.
 * It also draws icons in the sidebar
 * @category setup
 */
function setupElementLists(applicationMetadata) {
  window.circuitElementList = applicationMetadata.circuitElementList;
  window.annotationList = applicationMetadata.annotationList;
  window.inputList = applicationMetadata.inputList;
  window.subCircuitInputList = applicationMetadata.subCircuitInputList;
  window.moduleList = [...circuitElementList, ...annotationList];
  window.updateOrder = [
    'wires',
    ...circuitElementList,
    'nodes',
    ...annotationList,
  ]; // Order of update
  window.renderOrder = [...moduleList.slice().reverse(), 'wires', 'allNodes']; // Order of render
}

/**
 * Fetches project data from API and loads it into the simulator.
 * @param {number} projectId The ID of the project to fetch data for
 * @category setup
 */
async function fetchProjectData(projectId) {
  try {
    const response = await fetch(
        `/api/v1/projects/${projectId}/circuit_data`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Token ${getToken('cvt')}`,
          },
        },
    );
    if (response.ok) {
      const data = await response.json();
      await load(data);
      await globalScope.simulationArea.changeClockTime(data.timePeriod || 500);
      $('.loadingIcon').fadeOut();
    } else {
      throw new Error('API call failed');
    }
  } catch (error) {
    console.error(error);
    confirmSingleOption('Error: Could not load.');
    $('.loadingIcon').fadeOut();
  }
}

/**
 * Load project data immediately when available.
 * @category setup
 */
async function loadProjectData() {
  window.logixProjectId = window.logixProjectId ?? 0;
  if (window.logixProjectId !== 0) {
    $('.loadingIcon').fadeIn();
    await fetchProjectData(window.logixProjectId);
  } else if (localStorage.getItem('recover_login') && window.isUserLoggedIn) {
    // Restore unsaved data and save
    const data = JSON.parse(localStorage.getItem('recover_login'));
    await load(data);
    localStorage.removeItem('recover');
    localStorage.removeItem('recover_login');
    await save();
  } else if (localStorage.getItem('recover')) {
    // Restore unsaved data which didn't get saved due to error
    showMessage(
        'We have detected that you did not save your last work. Don\'t worry ' +
        'we have recovered them. Access them using Project->Recover',
    );
  }
}

/**
 * Show tour guide if it hasn't been completed yet.
 * The tour is shown after a delay of 2 seconds.
 * @category setup
 */
function showTour() {
  if (!localStorage.tutorials_tour_done && !embed) {
    setTimeout(() => {
      showTourGuide();
    }, 2000);
  }
}

/**
 * The first function to be called to setup the whole simulator.
 * This function sets up the simulator environment, the UI, the listeners,
 * loads the project data, and shows the tour guide.
 * @category setup
 */
export function setup() {
  setupElementLists(metadata);
  setupEnvironment();
  if (!embed) {
    setupUI();
    startMainListeners();
  }
  loadProjectData();
  showTour();
}
