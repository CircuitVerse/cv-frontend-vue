import {simulationArea} from './simulation_area';
import {converters} from './utils';

const DPR = window.devicePixelRatio || 1;

/**
 * Helper function to scale to display
 * @param {number} x - value to scale.
 * @return {number} scaled dimension.
 */
function sh(x) {
  return x * DPR;
}

/**
 * Spec Constants
 * Size Spec Diagram - https://app.diagrams.net/#G1HFoesRvNyDap95sNJswTy3nH09emDriC
 * NOTE: DPR is set on page load, changing screen at runtime will not work well
 * @TODO
 *  - Support for color themes
 *  - Replace constants with functions? - Can support Zoom in/out of canvas then
 */
const frameInterval = 100; // Refresh rate
const timeLineHeight = sh(20);
const padding = sh(2);
let plotHeight = sh(20);
const waveFormPadding = sh(5);
let waveFormHeight = plotHeight - 2 * waveFormPadding;
const flagLabelWidth = sh(75);
let cycleWidth = sh(30);
const backgroundColor = 'black';
const foregroundColor = '#eee';
const textColor = 'black';
const waveFormColor = 'cyan';
const timeLineStartX = flagLabelWidth + padding;

// Helper functions for canvas

function getFullHeight(flagCount) {
  return timeLineHeight + (plotHeight + padding) * flagCount;
}

function getFlagStartY(flagIndex) {
  return getFullHeight(flagIndex) + padding;
}

function getCycleStartX(cycleNumber) {
  return timeLineStartX + (cycleNumber - plotArea.cycleOffset) * cycleWidth;
}

/**
 * @type {Object} plotArea
 * @category plotArea
 */
export const plotArea = {
  cycleOffset: 0, // Determines timeline offset
  DPR: window.devicePixelRatio || 1,
  canvas: document.getElementById('plotArea'),
  cycleCount: 0, // Number of clock cycles passed
  cycleTime: 0, // Time of last clock tick (in ms)
  executionStartTime: 0, // Last time play() function ran in engine.js (in ms)
  autoScroll: true, // will timeline scroll to keep current time in display
  width: 0, // canvas width
  height: 0, // canvas height
  unitUsed: 0, // Number of simulation units used by the engine
  cycleUnit: 1000, // Number of simulation units per cycle
  mouseDown: false,
  mouseX: 0, // Current mouse position
  mouseDownX: 0, // position of mouse when clicked
  mouseDownTime: 0, // time when mouse clicked (in ms)
  // Reset timeline to 0 and resume auto-scroll
  reset() {
    this.cycleCount = 0;
    this.cycleTime = new Date().getTime();
    for (let i = 0; i < globalScope.Flag.length; i++) {
      globalScope.Flag[i].plotValues = [
        [0, globalScope.Flag[i].inp1.value],
      ];
      globalScope.Flag[i].cachedIndex = 0;
    }
    this.unitUsed = 0;
    this.resume();
    this.resize();
  },
  // Resume auto-scroll
  resume() {
    this.autoScroll = true;
  },
  // pause auto-scroll
  pause() {
    this.autoScroll = false;
    plotArea.scrollAcc = 0;
  },
  // Called every time clock is ticked
  nextCycle() {
    this.cycleCount++;
    this.cycleTime = new Date().getTime();
  },
  // Called every time play() function is execute in engine.js
  setExecutionTime() {
    this.executionStartTime = new Date().getTime();
  },
  // Scale timeline up
  zoomIn() {
    cycleWidth += sh(2);
  },
  // Scale timeline down
  zoomOut() {
    cycleWidth -= sh(2);
  },
  // download as image
  download() {
    const img = this.canvas.toDataURL(`image/png`);
    const anchor = document.createElement('a');
    anchor.href = img;
    anchor.download = `waveform.png`;
    anchor.click();
  },
  // update canvas size to use full screen
  resize() {
    const oldHeight = this.height;
    const oldWidth = this.width;
    this.width = document.getElementById('plot').clientWidth * this.DPR;
    this.height = getFullHeight(globalScope.Flag.length);
    if (oldHeight == this.height && oldWidth == this.width) {
      return;
    }
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.plot();
  },
  // Setup function, called on page load
  setup() {
    this.canvas = document.getElementById('plotArea');
    if (!embed) {
      this.ctx = this.canvas.getContext('2d');
    }
    this.timeOutPlot = setInterval(() => {
      plotArea.plot();
    }, frameInterval);
    this.reset();
  },
  // Used to resolve analytical time in clock cycles
  getPlotTime(timeUnit) {
    let time = this.cycleCount; // Current cycle count
    time += timeUnit / this.cycleUnit; // Add propagation delay
    // For user interactions like buttons - calculate time since clock tick
    const timePeriod = simulationArea.timePeriod;
    const executionDelay = this.executionStartTime - this.cycleTime;
    const delayFraction = executionDelay / timePeriod;
    // Add time since clock tick
    time += delayFraction;
    return time;
  },
  // Auto calibrate clock simulation units based on usage
  calibrate() {
    const recommendedUnit = Math.max(20, Math.round(this.unitUsed * 3));
    this.cycleUnit = recommendedUnit;
    $('#timing-diagram-units').val(recommendedUnit);
    this.reset();
  },
  // Get current time in clock cycles
  getCurrentTime() {
    let time = this.cycleCount;
    const timePeriod = simulationArea.timePeriod;
    const delay = new Date().getTime() - this.cycleTime;
    const delayFraction = delay / timePeriod;
    time += delayFraction;
    return time;
  },
  update() {
    this.resize();
    const dangerColor = '#dc5656';
    const normalColor = '#42b983';
    this.unitUsed = Math.max(
        this.unitUsed,
        simulationArea.simulationQueue.time,
    );
    const unitUsed = this.unitUsed;
    const units = this.cycleUnit;
    const utilization = Math.round((unitUsed * 10000) / units) / 100;
    $('#timing-diagram-log').html(
        `Utilization: ${Math.round(unitUsed)} Units (${utilization}%)`,
    );
    if (utilization >= 90 || utilization <= 10) {
      const recommendedUnit = Math.max(20, Math.round(unitUsed * 3));
      $('#timing-diagram-log').append(
          ` Recommended Units: ${recommendedUnit}`,
      );
      $('#timing-diagram-log').css('background-color', dangerColor);
      if (utilization >= 100) {
        this.clear();
        return;
      }
    } else {
      $('#timing-diagram-log').css('background-color', normalColor);
    }

    const width = this.width;
    const endTime = this.getCurrentTime();

    if (this.autoScroll) {
      // Formula used:
      // (endTime - x) * cycleWidth = width - timeLineStartX;
      // x = endTime - (width - timeLineStartX) / cycleWidth
      this.cycleOffset = Math.max(
          0,
          endTime - (width - timeLineStartX) / cycleWidth,
      );
    } else if (!plotArea.mouseDown) {
      // Scroll
      this.cycleOffset -= plotArea.scrollAcc;
      // Friction
      plotArea.scrollAcc *= 0.95;
      // No negative numbers allowed, so negative scroll to 0
      if (this.cycleOffset < 0) {
        plotArea.scrollAcc = this.cycleOffset / 5;
      }
      // Set position to 0, to avoid infinite scrolling
      if (Math.abs(this.cycleOffset) < 0.01) {
        this.cycleOffset = 0;
      }
    }
  },
  render() {
    const {width, height} = this;
    this.canvas.height = height;
    this.canvas.width = width;
    const endTime = this.getCurrentTime();
    // Reset canvas
    this.clear();
    const ctx = this.ctx;

    // Background Color
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = sh(1);
    ctx.font = `${sh(15)}px Raleway`;
    ctx.textAlign = 'left';

    // Timeline
    ctx.fillStyle = foregroundColor;
    ctx.fillRect(timeLineStartX, 0, this.canvas.width, timeLineHeight);
    ctx.fillRect(0, 0, flagLabelWidth, timeLineHeight);
    ctx.fillStyle = textColor;
    ctx.fillText('Time', sh(5), timeLineHeight * 0.7);

    // Timeline numbers
    ctx.font = `${sh(9)}px Times New Roman`;
    ctx.strokeStyle = textColor;
    ctx.textAlign = 'center';
    for (
      let i = Math.floor(plotArea.cycleOffset);
      getCycleStartX(i) <= width;
      i++
    ) {
      const x = getCycleStartX(i);
      // Large ticks + number
      // @TODO - collapse number if it doesn't fit
      if (x >= timeLineStartX) {
        ctx.fillText(`${i}`, x, timeLineHeight - sh(15) / 2);
        ctx.beginPath();
        ctx.moveTo(x, timeLineHeight - sh(5));
        ctx.lineTo(x, timeLineHeight);
        ctx.stroke();
      }
      // Small ticks
      for (let j = 1; j < 5; j++) {
        const x1 = x + Math.round((j * cycleWidth) / 5);
        if (x1 >= timeLineStartX) {
          ctx.beginPath();
          ctx.moveTo(x1, timeLineHeight - sh(2));
          ctx.lineTo(x1, timeLineHeight);
          ctx.stroke();
        }
      }
    }

    // Flag Labels
    ctx.textAlign = 'left';
    for (let i = 0; i < globalScope.Flag.length; i++) {
      const startHeight = getFlagStartY(i);
      ctx.fillStyle = foregroundColor;
      ctx.fillRect(0, startHeight, flagLabelWidth, plotHeight);
      ctx.fillStyle = textColor;
      ctx.fillText(
          globalScope.Flag[i].identifier,
          sh(5),
          startHeight + plotHeight * 0.7,
      );
    }

    // Waveform Status Flags
    const WAVEFORM_NOT_STARTED = 0;
    const WAVEFORM_STARTED = 1;
    const WAVEFORM_OVER = 3;

    // Waveform
    ctx.strokeStyle = waveFormColor;
    ctx.textAlign = 'center';
    let endX = Math.min(getCycleStartX(endTime), width);

    for (let i = 0; i < globalScope.Flag.length; i++) {
      const plotValues = globalScope.Flag[i].plotValues;
      const startHeight = getFlagStartY(i) + waveFormPadding;
      const yTop = startHeight;
      const yMid = startHeight + waveFormHeight / 2;
      const yBottom = startHeight + waveFormHeight;
      let state = WAVEFORM_NOT_STARTED;
      let prevY;

      // Find correct index to start plotting from
      let j = 0;
      // Using caching for optimal performance
      if (globalScope.Flag[i].cachedIndex) {
        j = globalScope.Flag[i].cachedIndex;
      }
      // Move to beyond timeLineStartX
      while (
        j + 1 < plotValues.length &&
                getCycleStartX(plotValues[j][0]) < timeLineStartX
      ) {
        j++;
      }
      // Move to just before timeLineStartX
      while (j > 0 && getCycleStartX(plotValues[j][0]) > timeLineStartX) {
        j--;
      }
      // Cache index
      globalScope.Flag[i].cachedIndex = j;

      // Plot
      for (; j < plotValues.length; j++) {
        let x = getCycleStartX(plotValues[j][0]);

        // Handle out of bound
        if (x < timeLineStartX) {
          if (j + 1 != plotValues.length) {
            // Next one also is out of bound, so skip this one completely
            const x1 = getCycleStartX(plotValues[j + 1][0]);
            if (x1 < timeLineStartX) {
              continue;
            }
          }
          x = timeLineStartX;
        }

        const value = plotValues[j][1];
        if (value === undefined) {
          if (state == WAVEFORM_STARTED) {
            ctx.stroke();
          }
          state = WAVEFORM_NOT_STARTED;
          continue;
        }
        if (globalScope.Flag[i].bitWidth == 1) {
          if (x > endX) {
            break;
          }
          const y = value == 1 ? yTop : yBottom;
          if (state == WAVEFORM_NOT_STARTED) {
            // Start new plot
            state = WAVEFORM_STARTED;
            ctx.beginPath();
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, prevY);
            ctx.lineTo(x, y);
          }
          prevY = y;
        } else {
          if (j + 1 == plotValues.length) {
            endX = getCycleStartX(endTime);
          } else {
            endX = getCycleStartX(plotValues[j + 1][0]);
          }
          const smallOffset = waveFormHeight / 2;
          ctx.beginPath();
          ctx.moveTo(endX, yMid);
          ctx.lineTo(endX - smallOffset, yTop);
          ctx.lineTo(x + smallOffset, yTop);
          ctx.lineTo(x, yMid);
          ctx.lineTo(x + smallOffset, yBottom);
          ctx.lineTo(endX - smallOffset, yBottom);
          ctx.closePath();
          ctx.stroke();

          // Text position
          // Clamp start and end are within the screen
          const x1 = Math.max(x, timeLineStartX);
          const x2 = Math.min(endX, width);
          const textPositionX = (x1 + x2) / 2;

          ctx.font = `${sh(9)}px Times New Roman`;
          ctx.fillStyle = 'white';
          ctx.fillText(
              converters.dec2hex(value),
              textPositionX,
              yMid + sh(3),
          );
        }
        if (x > width) {
          state = WAVEFORM_OVER;
          ctx.stroke();
          break;
        }
      }
      if (state == WAVEFORM_STARTED) {
        if (globalScope.Flag[i].bitWidth == 1) {
          ctx.lineTo(endX, prevY);
        }
        ctx.stroke();
      }
    }
  },
  // Driver function to render and update
  plot() {
    if (embed) {
      return;
    }
    if (globalScope.Flag.length === 0) {
      this.canvas.width = 0;
      this.canvas.height = 0;
      return;
    }

    this.update();
    this.render();
  },
  clear() {
    this.ctx.clearRect(0, 0, plotArea.canvas.width, plotArea.canvas.height);
  },
};

/**
 * type {Object} timingDiagramButtonActions
 * @category plotArea
 * @description Actions for buttons in timing diagram
 * @property {function} smallHeight - Decrease waveform height
 * @property {function} largeHeight - Increase waveform height
 */
const timingDiagramButtonActions = {
  smallHeight() {
    if (plotHeight >= sh(20)) {
      plotHeight -= sh(5);
      waveFormHeight = plotHeight - 2 * waveFormPadding;
    }
  },
  largeHeight() {
    if (plotHeight < sh(50)) {
      plotHeight += sh(5);
      waveFormHeight = plotHeight - 2 * waveFormPadding;
    }
  },
};

export {timingDiagramButtonActions};

/**
 *
 */
export function setupTimingListeners() {
  document.getElementById('plotArea').addEventListener('mousedown', (e) => {
    const rect = plotArea.canvas.getBoundingClientRect();
    const x = sh(e.clientX - rect.left);
    plotArea.scrollAcc = 0;
    plotArea.autoScroll = false;
    plotArea.mouseDown = true;
    plotArea.mouseX = x;
    plotArea.mouseDownX = x;
    plotArea.mouseDownTime = new Date().getTime();
  });
  document.getElementById('plotArea').addEventListener('mouseup', (e) => {
    plotArea.mouseDown = false;
    const time = new Date().getTime() - plotArea.mouseDownTime;
    const offset = (plotArea.mouseX - plotArea.mouseDownX) / cycleWidth;
    plotArea.scrollAcc = (offset * frameInterval) / time;
  });

  document.getElementById('plotArea').addEventListener('mousemove', (e) => {
    const rect = plotArea.canvas.getBoundingClientRect();
    const x = sh(e.clientX - rect.left);
    if (plotArea.mouseDown) {
      plotArea.cycleOffset -= (x - plotArea.mouseX) / cycleWidth;
      plotArea.mouseX = x;
    } else {
      plotArea.mouseDown = false;
    }
  });
}