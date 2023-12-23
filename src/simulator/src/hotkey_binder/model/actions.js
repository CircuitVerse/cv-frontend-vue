import {defaultKeys} from '../defaultKeys';
import {addShortcut} from './addShortcut';
import {updateHTML} from '../view/panel.ui';

import {
  scheduleUpdate,
  wireToBeCheckedSet,
  updateCanvasSet,
} from '../../engine';

import {getOS} from './utils.js';
import {shortcut} from './shortcuts.plugin.js';
/**
 * Function used to add or change keys user or default
 * grabs the key combo from localstorage &
 * calls the addShortcut function in a loop to bind them
 * @param {string} mode - user custom keys or default keys
 */
export const addKeys = (mode) => {
  shortcut.removeAll();
  if (mode === 'user') {
    localStorage.removeItem('defaultKeys');
    const userKeys = localStorage.get('userKeys');
    for (let i = 0; i < userKeys.length; i++) {
      const pref = userKeys[i];
      let key = userKeys[pref];
      key = key.split(' ').join('');
      addShortcut(key, pref);
    }
    updateHTML('user');
  } else if (mode == 'default') {
    if (localStorage.userKeys) {
      localStorage.removeItem('userKeys');
    }
    const defaultKeys = localStorage.get('defaultKeys');
    for (let i = 0; i < defaultKeys.length; i++) {
      const pref = defaultKeys[i];
      let key = defaultKeys[pref];
      key = key.split(' ').join('');
      addShortcut(key, pref);
    }
    updateHTML('default');
  }
};
/**
 * Function used to check if new keys are added, adds missing keys if added
 */
export const checkUpdate = () => {
  const userK = localStorage.get('userKeys');
  if (Object.size(userK) !== Object.size(defaultKeys)) {
    for (const [key, value] of Object.entries(defaultKeys)) {
      if (!Object.keys(userK).includes(key)) {
        userK[key] = value;
      }
    }
    localStorage.set('userKeys', userK);
  } else {
    return;
  }
};
/**
 * Function used to set userKeys, grabs the keycombo from the panel UI
 * sets it to the localStorage & calls addKeys
 * removes the defaultkeys from localStorage
 */
export const setUserKeys = () => {
  if (localStorage.defaultKeys) {
    localStorage.removeItem('defaultKeys');
  }
  const userKeys = {};
  let x = 0;
  while ($('#preference').children()[x]) {
    userKeys[
        $('#preference').children()[x].children[1].children[0].innerText
    ] = $('#preference').children()[x].children[1].children[1].innerText;
    x++;
  }
  localStorage.set('userKeys', userKeys);
  addKeys('user');
};
/**
 * Function used to set defaultKeys, grabs the keycombo from the defaultkeys
 * metadata sets it to the localStorage & calls addKeys
 * removes the userKeys from localStorage if present
 * also checks for OS type
 */
export const setDefault = () => {
  if (localStorage.userKeys) {
    localStorage.removeItem('userKeys');
  }
  if (getOS() === 'MacOS') {
    const macDefaultKeys = {};
    for (const [key, value] of Object.entries(defaultKeys)) {
      if (value.split(' + ')[0] == 'Ctrl') {

      }
      macDefaultKeys[key] =
                value.split(' + ')[0] == 'Ctrl' ?
                    value.replace('Ctrl', 'Meta') :
                    value;
      localStorage.set('defaultKeys', macDefaultKeys);
    }
  } else {
    localStorage.set('defaultKeys', defaultKeys); // TODO add a confirmation alert
  }
  addKeys('default');
};
/**
 * function to check if user entered keys are already assigned to other key
 * gives a warning message if keys already assigned
 * @param {string} combo the key combo
 * @param {string} target the target option of the panel.
 * @param {string} warning warning text.
 */
export const warnOverride = (combo, target, warning) => {
  let x = 0;
  while ($('#preference').children()[x]) {
    if (
      $('#preference').children()[x].children[1].children[1].innerText ===
                combo &&
            $('#preference').children()[x].children[1].children[0].innerText !==
                target.previousElementSibling.innerText
    ) {
      const assignee =
                $('#preference').children()[x].children[1].children[0].innerText;
      warning.value = `This key(s) is already assigned to: ${assignee}, press Enter to override.`;
      $('#edit').css('border', '1.5px solid #dc5656');
      return;
    } else {
      $('#edit').css('border', 'none');
    }
    x++;
  }
};

export const elementDirection = (direct) => () => {
  if (globalScope.simulationArea.lastSelected) {
    globalScope.simulationArea.lastSelected.newDirection(direct.toUpperCase());
    $('select[name |= \'newDirection\']').val(direct.toUpperCase());
    updateSystem();
  }
};

export const labelDirection = (direct) => () => {
  if (
    globalScope.simulationArea.lastSelected &&
        !globalScope.simulationArea.lastSelected.labelDirectionFixed
  ) {
    globalScope.simulationArea.lastSelected.labelDirection = direct.toUpperCase();
    $('select[name |= \'newLabelDirection\']').val(direct.toUpperCase());
    updateSystem();
  }
};

export const insertLabel = () => {
  if (globalScope.simulationArea.lastSelected) {
    $('input[name |= \'setLabel\']').focus();
        $('input[name |= \'setLabel\']').val().length ?
            null :
            $('input[name |= \'setLabel\']').val('Untitled');
        $('input[name |= \'setLabel\']').select();
        updateSystem();
  }
};

export const moveElement = (direct) => () => {
  if (globalScope.simulationArea.lastSelected) {
    switch (direct) {
      case 'up':
        globalScope.simulationArea.lastSelected.y -= 10;
        break;
      case 'down':
        globalScope.simulationArea.lastSelected.y += 10;
        break;
      case 'left':
        globalScope.simulationArea.lastSelected.x -= 10;
        break;
      case 'right':
        globalScope.simulationArea.lastSelected.x += 10;
        break;
    }
    updateSystem();
  }
};

export const openHotkey = () => $('#customShortcut').trigger('click');

export const createNewCircuitScopeCall = () =>
  $('#createNewCircuitScope').trigger('click'); // TODO: remove later

export const openDocumentation = () => {
  if (
    globalScope.simulationArea.lastSelected == undefined ||
        globalScope.simulationArea.lastSelected.helplink == undefined
  ) {
    // didn't select any element or documentation not found
    window.open('https://docs.circuitverse.org/', '_blank');
  } else {
    window.open(globalScope.simulationArea.lastSelected.helplink, '_blank');
  }
};

function updateSystem() {
  updateCanvasSet(true);
  wireToBeCheckedSet(1);
  scheduleUpdate(1);
}
