import {resetScopeList, scopeList, newCircuit} from '../circuit';
import {generateId} from '../utils';
import {showMessage, showError} from '../utils_clock';
import {checkIfBackup} from './backup_circuit';
import {generateSaveData, getProjectName, setProjectName} from './save';
import {load} from './load';
import {SimulatorStore} from '#/store/SimulatorStore/SimulatorStore';
import {confirmOption} from '#/components/helpers/confirmComponent/ConfirmComponent.vue';

/**
 * Helper function to recover unsaved data
 * @category data
 */
export async function recoverProject() {
  if (localStorage.getItem('recover')) {
    const data = JSON.parse(localStorage.getItem('recover'));
    if (await confirmOption(`Would you like to recover: ${data.name}`)) {
      load(data);
    }
    localStorage.removeItem('recover');
  } else {
    showError('No recover project found');
  }
}

/**
 * Prompt to restore from localStorage
 * @category data
 */
export function openOffline() {
  const simulatorStore = SimulatorStore();
  simulatorStore.dialogBox.open_project_dialog = true;
}
/**
 * Flag for project saved or not
 * @type {boolean}
 * @category data
 */
let projectSaved = true;
export function projectSavedSet(param) {
  projectSaved = param;
}

/**
 * Helper function to store to localStorage -- needs to be deprecated/removed
 * @category data
 */
export async function saveOffline() {
  const data = await generateSaveData();
  if (data instanceof Error) {
    return;
  }
  localStorage.setItem(projectId, data);
  const temp = JSON.parse(localStorage.getItem('projectList')) || {};
  temp[projectId] = getProjectName();
  localStorage.setItem('projectList', JSON.stringify(temp));
  showMessage(
      `We have saved your project: ${getProjectName()} in your browser's localStorage`,
  );
}

/**
 * Checks if any circuit has unsaved data
 * @category data
 */
function checkToSave() {
  let saveFlag = false;
  for (id in scopeList) {
    saveFlag |= checkIfBackup(scopeList[id]);
  }
  return saveFlag;
}

/**
 * Prompt user to save data if unsaved
 * @category data
 */
window.onbeforeunload = async function() {
  if (projectSaved || embed) {
    return;
  }
  if (!checkToSave()) {
    return;
  }
  alert('You have unsaved changes on this page. Do you want to leave this ' +
    'page and discard your changes or stay on this page?');
  const data = await generateSaveData('Untitled');
  localStorage.setItem('recover', await data);
  return 'Are you sure you want to leave? Any unsaved ' +
    'changes may not be recoverable';
};

/**
 * Function to clear project
 * @category data
 */
export async function clearProject() {
  if (await confirmOption('Would you like to clear the project?')) {
    globalScope = undefined;
    resetScopeList();
    newCircuit('main');
    showMessage('Your project is as good as new!');
  }
}

/**
 Function used to start a new project while prompting confirmation from the user
 * @param {boolean} verify - flag to verify a new project
 * @category data
 */
export async function newProject(verify) {
  if (
    verify ||
    projectSaved ||
    !checkToSave() ||
    (await confirmOption(
        'Would you like to start a new project? ' +
        'Any unsaved changes will be lost.',
    ))
  ) {
    clearProject();
    localStorage.removeItem('recover');
    window.location = '/simulator';

    setProjectName(undefined);
    projectId = generateId();
    showMessage('New Project has been created!');
  }
}
