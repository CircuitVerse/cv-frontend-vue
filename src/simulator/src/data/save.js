import {scopeList} from '../circuit';
import {resetup} from '../setup';
import {update} from '../engine';
import {stripTags} from '../utils';
import {showMessage} from '../utils_clock';
import {backUp} from './backup_circuit';
import {simulationArea} from '../simulation_area';
import {findDimensions} from '../canvas_api';
import {projectSavedSet} from './project';
import {colors} from '../themer/themer';
import {layoutModeGet, toggleLayoutMode} from '../layout_mode';
import {verilogModeGet} from '../verilog_to_cv';
import domtoimage from 'dom-to-image';
import '../../vendor/canvas2svg';
import {useProjectStore} from '#/store/projectStore';
import {provideProjectName} from '#/components/helpers/promptComponent/PromptComponent.vue';
import {UpdateProjectDetail} from '#/components/helpers/createNewProject/UpdateProjectDetail.vue';
import {confirmOption} from '#/components/helpers/confirmComponent/ConfirmComponent.vue';
import {getToken} from '#/pages/simulatorHandler.vue';

/**
 * Function to set the name of project.
 * @param {string} name - name for project
 * @category data
 */
export function setProjectName(name) {
  const projectStore = useProjectStore();
  if (name == undefined) {
    return;
  }
  name = stripTags(name);
  projectStore.setProjectName(name);
}

/**
 * Function to set the name of project.
 * @param {string} name - name for project
 * @category data
 */
export function getProjectName() {
  const projectStore = useProjectStore();
  if (projectStore.getProjectNameDefined) {
    return projectStore.getProjectName.trim();
  } else {
    return undefined;
  }
}
/**
 * Helper function to save canvas as image based on image type
 * @param {string} name -name of the circuit
 * @param {string} imgType - image type ex: png,jpg etc.
 * @category data
 */
function downloadAsImg(name, imgType) {
  const gh = simulationArea.canvas.toDataURL(`image/${imgType}`);
  const anchor = document.createElement('a');
  anchor.href = gh;
  anchor.download = `${name}.${imgType}`;
  anchor.click();
}

/**
 * Returns the order of tabs in the project
 * @return {number[]} IDs in order.
 */
export function getTabsOrder() {
  const tabs = document.getElementById('tabsBar').firstChild.children;
  const order = [];
  for (let i = 0; i < tabs.length; i++) {
    order.push(tabs[i].id);
  }
  return order;
}

/**
 * Generates JSON of the entire project
 * @param {string} name - the name of project
 * @param {bool?} setName - should the project name be set.
 * @return {JSON}
 * @category data
 */
export async function generateSaveData(name, setName = true) {
  let data = {};

  // Prompts for name, defaults to Untitled
  name = getProjectName() || name || (await provideProjectName());
  if (name instanceof Error) {
    return new Error('cancel');
    // throw 'save has been canceled'
  } else if (name == '') {
    name = 'Untitled';
  }
  data.name = stripTags(name);
  if (setName) {
    setProjectName(data.name);
  }

  // Save project details
  data.timePeriod = simulationArea.timePeriod;
  data.clockEnabled = simulationArea.clockEnabled;
  data.projectId = projectId;
  data.focussedCircuit = globalScope.id;
  data.orderedTabs = getTabsOrder();

  // Project Circuits, each scope is one circuit
  data.scopes = [];
  const dependencyList = {};
  const completed = {};
  // Getting list of dependencies for each circuit
  for (id in scopeList) {
    dependencyList[id] = scopeList[id].getDependencies();
  }

  /**
   * Recursively saves inner subcircuits first, before saving parent circuits
   * @param {*} id
   * @return {string} JSON representation of scope.
   */
  function saveScope(id) {
    if (completed[id]) {
      return '';
    }

    for (let i = 0; i < dependencyList[id].length; i++) {
      // Save inner subcircuits
      saveScope(dependencyList[id][i]);
    }

    completed[id] = true;
    // For any pending integrity checks on subcircuits
    update(scopeList[id], true);
    data.scopes.push(backUp(scopeList[id]));
  }

  // Save all circuits
  for (const id in scopeList) {
    saveScope(id);
  }

  // convert to text
  data = JSON.stringify(data);
  return data;
}

/**
 * Helper function to download text
 * @param {*} filename
 * @param {*} text
 */
function download(filename, text) {
  const pom = document.createElement('a');
  pom.setAttribute(
      'href',
      'data:text/plain;charset=utf-8,' + encodeURIComponent(text),
  );
  pom.setAttribute('download', filename);

  if (document.createEvent) {
    const event = document.createEvent('MouseEvents');
    event.initEvent('click', true, true);
    pom.dispatchEvent(event);
  } else {
    pom.click();
  }
}

/**
 * Generate image for the circuit.
 * @param {string} imgType - ex: png,jpg etc.
 * @param {string} view - view type ex: full.
 * @param {boolean} transparent - background is transparent.
 * @param {number} resolution - resolution of the image.
 * @param {boolean=} down - will download if true.
 * @return {string} toDataURL
 * @category data
 */
export function generateImage(
    imgType,
    view,
    transparent,
    resolution,
    down = true,
) {
  // Backup all data
  const backUpOx = globalScope.ox;
  const backUpOy = globalScope.oy;
  const backUpWidth = width;
  const backUpHeight = height;
  const backUpScale = globalScope.scale;
  const backUpContextSimulation = simulationArea.context;


  globalScope.ox *= 1 / backUpScale;
  globalScope.oy *= 1 / backUpScale;

  // If SVG, create SVG context - using canvas2svg here
  if (imgType === 'svg') {
    simulationArea.context = new C2S(width, height);
    resolution = 1;
  } else if (imgType !== 'png') {
    transparent = false;
  }

  globalScope.scale = resolution;

  const scope = globalScope;

  // Focus circuit
  const flag = 1;
  if (flag) {
    if (view === 'full') {
      findDimensions();
      const minX = simulationArea.minWidth;
      const minY = simulationArea.minHeight;
      const maxX = simulationArea.maxWidth;
      const maxY = simulationArea.maxHeight;
      width = (maxX - minX + 100) * resolution;
      height = (maxY - minY + 100) * resolution;

      globalScope.ox = (-minX + 50) * resolution;
      globalScope.oy = (-minY + 50) * resolution;
    } else {
      globalScope.ox *= resolution;
      globalScope.oy *= resolution;
      width = (width * resolution) / backUpScale;
      height = (height * resolution) / backUpScale;
    }
  }

  globalScope.ox = Math.round(globalScope.ox);
  globalScope.oy = Math.round(globalScope.oy);

  simulationArea.canvas.width = width;
  simulationArea.canvas.height = height;

  simulationArea.clear();

  // Background
  if (!transparent) {
    simulationArea.context.fillStyle = colors['canvas_fill'];
    simulationArea.context.rect(0, 0, width, height);
    simulationArea.context.fill();
  }

  // Draw circuits, why is it updateOrder and not renderOrder?
  for (let i = 0; i < renderOrder.length; i++) {
    for (let j = 0; j < scope[renderOrder[i]].length; j++) {
      scope[renderOrder[i]][j].draw();
    }
  }

  let returnData;
  // If circuit is to be downloaded, download, other wise return dataURL
  if (down) {
    if (imgType === 'svg') {
      // true here, if you need to convert named to numbered entities.
      const mySerializedSVG = simulationArea.context.getSerializedSvg();
      download(`${globalScope.name}.svg`, mySerializedSVG);
    } else {
      downloadAsImg(globalScope.name, imgType);
    }
  } else {
    returnData = simulationArea.canvas.toDataURL(`image/${imgType}`);
  }

  // Restore everything
  width = backUpWidth;
  height = backUpHeight;
  simulationArea.canvas.width = width;
  simulationArea.canvas.height = height;
  globalScope.scale = backUpScale;
  simulationArea.context = backUpContextSimulation;
  globalScope.ox = backUpOx;
  globalScope.oy = backUpOy;

  resetup();

  if (!down) {
    return returnData;
  }
}

/**
 * Crop an image supplied in dataURL format.
 * @param {*} dataURL - image in data URL format.
 * @param {*} w - width/
 * @param {*} h - height.
 * @return {string} cropped image in dataURL format.
 */
async function crop(dataURL, w, h) {
  // get empty second canvas
  const myCanvas = document.createElement('CANVAS');
  myCanvas.width = w;
  myCanvas.height = h;
  const myContext = myCanvas.getContext('2d');
  let myImage;
  const img = new Image();
  return new Promise(function(resolved, rejected) {
    img.src = dataURL;
    img.onload = () => {
      myContext.drawImage(img, 0, 0, w, h, 0, 0, w, h);
      myContext.save();

      // create a new data URL
      myImage = myCanvas.toDataURL('image/jpeg');
      resolved(myImage);
    };
  });
}

/**
 * Function that is used to save image for display in the website
 * @return {JSON}
 * @category data
 */
async function generateImageForOnline() {
  // Verilog Mode -> Different logic
  // Fix aspect ratio to 1.6
  // Ensure image is approximately 700 x 440
  const ratio = 1.6;
  if (verilogModeGet()) {
    const node = document.getElementsByClassName('CodeMirror')[0];
    const prevHeight = $(node).css('height');
    const prevWidth = $(node).css('width');
    const baseWidth = 500;
    const baseHeight = Math.round(baseWidth / ratio);
    $(node).css('height', baseHeight);
    $(node).css('width', baseWidth);

    let data = await domtoimage.toJpeg(node);
    $(node).css('width', prevWidth);
    $(node).css('height', prevHeight);
    data = await crop(data, baseWidth, baseHeight);
    return data;
  }

  simulationArea.lastSelected = undefined; // Unselect any selections

  // Fix aspect ratio to 1.6
  if (width > height * ratio) {
    height = width / ratio;
  } else {
    width = height * 1.6;
  }

  // Center circuits
  globalScope.centerFocus();

  // Ensure image is approximately 700 x 440
  const resolution = Math.min(
      700 / (simulationArea.maxWidth - simulationArea.minWidth),
      440 / (simulationArea.maxHeight - simulationArea.minHeight),
  );

  data = generateImage('jpeg', 'current', false, resolution, false);

  // Restores Focus
  globalScope.centerFocus(false);
  return data;
}
/**
 * Function called when you save a circuit online
 * @category data
 * @exports save
 */
export async function save() {
  if (layoutModeGet()) {
    toggleLayoutMode();
  }

  projectSavedSet(true);

  const data = await generateSaveData();
  if (data instanceof Error) {
    return;
  }
  $('.loadingIcon').fadeIn();

  const projectName = getProjectName();
  const imageData = await generateImageForOnline();

  const headers = {
    'Content-Type': 'application/json',
    'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content'),
    'Authorization': `Token ${getToken('cvt')}`,
  };

  if (!window.isUserLoggedIn) {
    // user not signed in, save locally temporarily and force user to sign in
    localStorage.setItem('recover_login', data);
    // Asking user whether they want to login.
    if (
      await confirmOption('You have to login to save the project, ' +
       'you will be redirected to the login page.',
      )
    ) {
      window.location.href = '/users/sign_in';
    } else {
      $('.loadingIcon').fadeOut();
    }
  } else if ([0, undefined, null, '', '0'].includes(window.logixProjectId)) {
    fetch('/api/v1/projects', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        data,
        image: imageData,
        name: projectName,
      }),
    })
        .then((response) => {
          if (response.ok) {
            showMessage(
                `We have Created a new project: ${projectName} in our servers.`,
            );
            $('.loadingIcon').fadeOut();
            localStorage.removeItem('recover');
            const responseJson = response.json();
            responseJson.then((data) => {
              UpdateProjectDetail(data);
            });
          }
        })
        .catch((error) => {
          console.error('Error:', error);
        });
  } else {
    fetch('/api/v1/projects/update_circuit', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        data,
        id: window.logixProjectId,
        image: imageData,
        name: projectName,
      }),
    })
        .then((response) => {
          if (response.ok) {
            showMessage(
                `We have saved your project: ${projectName} in our servers.`,
            );
            localStorage.removeItem('recover');
          } else {
            showMessage(
                'There was an error, we couldn\'t save to our servers',
            );
          }
          $('.loadingIcon').fadeOut();
        })
        .catch((error) => {
          console.error('Error:', error);
        });
  }

  // Restore everything
  resetup();
}
