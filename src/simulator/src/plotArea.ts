import simulationArea from './simulationArea'
import { convertors } from './utils'
import { useTimingDiagramStore } from '#/store/timingDiagramStore';

var DPR = window.devicePixelRatio || 1

export interface PlotArea {
    cycleOffset: number;
    DPR: number;
    canvas: HTMLCanvasElement | null;
    cycleCount: number;
    cycleTime: number;
    executionStartTime: number;
    autoScroll: boolean;
    width: number;
    height: number;
    unitUsed: number;
    cycleUnit: number;
    mouseDown: boolean;
    mouseX: number;
    mouseDownX: number;
    mouseDownTime: number;
    scrollAcc?: number;
    ctx?: CanvasRenderingContext2D | null;
    timeOutPlot?: NodeJS.Timeout;
    reset: () => void;
    resume: () => void;
    pause: () => void;
    nextCycle: () => void;
    setExecutionTime: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
    download: () => void;
    resize: () => void;
    setup: () => void;
    getPlotTime: (timeUnit: number) => number;
    calibrate: () => void;
    getCurrentTime: () => number;
    update: () => void;
    render: () => void;
    plot: () => void;
    clear: () => void;
}

// Helper function to scale to display
function sh(x: number) {
    return x * DPR
}

/**
 * Spec Constants
 * Size Spec Diagram - https://app.diagrams.net/#G1HFoesRvNyDap95sNJswTy3nH09emDriC
 * NOTE: Since DPR is set on page load, changing of screen in runtime will not work well
 * @TODO
 *  - Support for color themes
 *  - Replace constants with functions? - Can support Zoom in and Zoom out of canvas then
 */
var frameInterval = 100 // Refresh rate
var timeLineHeight = sh(20)
var padding = sh(2)
var plotHeight = sh(20)
var waveFormPadding = sh(5)
var waveFormHeight = plotHeight - 2 * waveFormPadding
var flagLabelWidth = sh(75)
var cycleWidth = sh(30)
var backgroundColor = 'black'
var foregroundColor = '#eee'
var textColor = 'black'
var waveFormColor = 'cyan'
var timeLineStartX = flagLabelWidth + padding

// Helper functions for canvas

function getFullHeight(flagCount: number) {
    return timeLineHeight + (plotHeight + padding) * flagCount
}

function getFlagStartY(flagIndex: number) {
    return getFullHeight(flagIndex) + padding
}

function getCycleStartX(cycleNumber: number) {
    return timeLineStartX + (cycleNumber - plotArea.cycleOffset) * cycleWidth
}

/**
 * @type {Object} plotArea
 * @category plotArea
 */
const plotArea: PlotArea = {
    cycleOffset: 0, // Determines timeline offset
    DPR: window.devicePixelRatio || 1,
    canvas: document.getElementById('plotArea') as HTMLCanvasElement,
    cycleCount: 0, // Number of clock cycles passed
    cycleTime: 0, // Time of last clock tick (in ms)
    executionStartTime: 0, // Last time play() function ran in engine.js (in ms)
    autoScroll: true, // if true, timeline will scroll to keep current time in display
    width: 0, // canvas width
    height: 0, // canvas height
    unitUsed: 0, // Number of simulation units used by the engine
    cycleUnit: 1000, // Number of simulation units per cycle
    mouseDown: false,
    mouseX: 0, // Current mouse position
    mouseDownX: 0, // position of mouse when clicked
    mouseDownTime: 0, // time when mouse clicked (in ms)
    // Reset timeline to 0 and resume autoscroll
    reset() {
        this.cycleCount = 0
        this.cycleTime = new Date().getTime()
        for (var i = 0; i < globalScope.Flag.length; i++) {
            globalScope.Flag[i].plotValues = [
                [0, globalScope.Flag[i].inp1.value],
            ]
            globalScope.Flag[i].cachedIndex = 0
        }
        this.unitUsed = 0
        this.resume()
        this.resize()
    },
    // Resume autoscroll
    resume() {
        this.autoScroll = true
    },
    // pause autoscroll
    pause() {
        this.autoScroll = false
        plotArea.scrollAcc = 0
    },
    // Called every time clock is ticked
    nextCycle() {
        this.cycleCount++
        this.cycleTime = new Date().getTime()
    },
    // Called everytime play() function is execute in engine.js
    setExecutionTime() {
        this.executionStartTime = new Date().getTime()
    },
    // Scale timeline up
    zoomIn() {
        cycleWidth += sh(2)
    },
    // Scale timeline down
    zoomOut() {
        cycleWidth -= sh(2)
    },
    // download as image
    download() {
        var img = this.canvas?.toDataURL(`image/png`)
        const anchor = document.createElement('a')
        if (img) {
            anchor.href = img
        }
        anchor.download = `waveform.png`
        anchor.click()
    },
    // update canvas size to use full screen
    resize() {
        var oldHeight = this.height
        var oldWidth = this.width
        this.width = document.getElementById('plot')?.clientWidth ?? 0 * this.DPR
        this.height = getFullHeight(globalScope.Flag.length)
        if (oldHeight == this.height && oldWidth == this.width) return
        if (this.canvas && this.canvas.width && this.canvas.height) {
            this.canvas.width = this.width
            this.canvas.height = this.height
        }
        this.plot()
    },
    // Setup function, called on page load
    setup() {
        this.canvas = document.getElementById('plotArea') as HTMLCanvasElement
        if (!embed) {
            this.ctx = this.canvas?.getContext('2d')
        }
        this.timeOutPlot = setInterval(() => {
            plotArea.plot()
        }, frameInterval)
        this.reset()
    },
    // Used to resolve analytical time in clock cycles
    getPlotTime(timeUnit) {
        var time = this.cycleCount // Current cycle count
        time += timeUnit / this.cycleUnit // Add propagation delay
        // For user interactions like buttons - calculate time since clock tick
        var timePeriod = simulationArea.timePeriod
        var executionDelay = this.executionStartTime - this.cycleTime
        var delayFraction = executionDelay / timePeriod
        // Add time since clock tick
        time += delayFraction
        return time
    },
    // Auto calibrate clock simulation units based on usage
    calibrate() {
        var recommendedUnit = Math.max(20, Math.round(this.unitUsed * 3))
        this.cycleUnit = recommendedUnit
        this.reset()
    },
    // Get current time in clock cycles
    getCurrentTime() {
        var time = this.cycleCount
        var timePeriod = simulationArea.timePeriod
        var delay = new Date().getTime() - this.cycleTime
        var delayFraction = delay / timePeriod
        time += delayFraction
        return time
    },
    update() {

        this.resize()
        this.unitUsed = Math.max(
            this.unitUsed,
            simulationArea.simulationQueue.time
        )

        useTimingDiagramStore().showUtilization = true;

        var width = this.width
        var endTime = this.getCurrentTime()

        if (this.autoScroll) {
            // Formula used:
            // (endTime - x) * cycleWidth = width - timeLineStartX;
            // x = endTime - (width - timeLineStartX) / cycleWidth
            this.cycleOffset = Math.max(
                0,
                endTime - (width - timeLineStartX) / cycleWidth
            )
        } else if (!plotArea.mouseDown) {
            // Scroll
            this.cycleOffset -= plotArea.scrollAcc ?? 0
            // Friction
            if (plotArea.scrollAcc) {
                plotArea.scrollAcc *= 0.95
            }
            // No negative numbers allowed, so negative scroll to 0
            if (this.cycleOffset < 0) plotArea.scrollAcc = this.cycleOffset / 5
            // Set position to 0, to avoid infinite scrolling
            if (Math.abs(this.cycleOffset) < 0.01) this.cycleOffset = 0
        }
    },
    render() {
        var { width, height } = this
        if (this.canvas) {
            this.canvas.height = height
            this.canvas.width = width
        }
        var endTime = this.getCurrentTime()
        // Reset canvas
        this.clear()
        var ctx = this.ctx

        // Background Color
        if (ctx) {
            ctx.fillStyle = backgroundColor
            ctx.fillRect(0, 0, width, height)

            ctx.lineWidth = sh(1)
            ctx.font = `${sh(15)}px Raleway`
            ctx.textAlign = 'left'

            // Timeline
            ctx.fillStyle = foregroundColor
            ctx.fillRect(timeLineStartX, 0, this.canvas?.width ?? 0, timeLineHeight)
            ctx.fillRect(0, 0, flagLabelWidth, timeLineHeight)
            ctx.fillStyle = textColor
            ctx.fillText('Time', sh(5), timeLineHeight * 0.7)

            // Timeline numbers
            ctx.font = `${sh(9)}px Times New Roman`
            ctx.strokeStyle = textColor
            ctx.textAlign = 'center'
        }
        for (
            var i = Math.floor(plotArea.cycleOffset);
            getCycleStartX(i) <= width;
            i++
        ) {
            var x = getCycleStartX(i)
            // Large ticks + number
            // @TODO - collapse number if it doesn't fit
            if (x >= timeLineStartX && ctx) {
                ctx.fillText(`${i}`, x, timeLineHeight - sh(15) / 2)
                ctx.beginPath()
                ctx.moveTo(x, timeLineHeight - sh(5))
                ctx.lineTo(x, timeLineHeight)
                ctx.stroke()
            }
            // Small ticks
            for (var j = 1; j < 5; j++) {
                var x1 = x + Math.round((j * cycleWidth) / 5)
                if (x1 >= timeLineStartX && ctx) {
                    ctx.beginPath()
                    ctx.moveTo(x1, timeLineHeight - sh(2))
                    ctx.lineTo(x1, timeLineHeight)
                    ctx.stroke()
                }
            }
        }

        // Flag Labels
        if (ctx) {
            ctx.textAlign = 'left'
        }
        for (var i = 0; i < globalScope.Flag.length; i++) {
            var startHeight = getFlagStartY(i)
            if (ctx) {
                ctx.fillStyle = foregroundColor
                ctx.fillStyle = textColor
            }
            ctx?.fillRect(0, startHeight, flagLabelWidth, plotHeight)
            ctx?.fillText(
                globalScope.Flag[i].identifier,
                sh(5),
                startHeight + plotHeight * 0.7
            )

        }

        // Waveform Status Flags
        const WAVEFORM_NOT_STARTED = 0
        const WAVEFORM_STARTED = 1
        const WAVEFORM_OVER = 3

        // Waveform
        if (ctx) {
            ctx.strokeStyle = waveFormColor
            ctx.textAlign = 'center'
        }
        var endX = Math.min(getCycleStartX(endTime), width)

        for (var i = 0; i < globalScope.Flag.length; i++) {
            var plotValues = globalScope.Flag[i].plotValues
            var startHeight = getFlagStartY(i) + waveFormPadding
            var yTop = startHeight
            var yMid = startHeight + waveFormHeight / 2
            var yBottom = startHeight + waveFormHeight
            var state = WAVEFORM_NOT_STARTED
            var prevY

            // Find correct index to start plotting from
            var j = 0
            // Using caching for optimal performance
            if (globalScope.Flag[i].cachedIndex) {
                j = globalScope.Flag[i].cachedIndex
            }
            // Move to beyond timeLineStartX
            while (
                j + 1 < plotValues.length &&
                getCycleStartX(plotValues[j][0]) < timeLineStartX
            ) {
                j++
            }
            // Move to just before timeLineStartX
            while (j > 0 && getCycleStartX(plotValues[j][0]) > timeLineStartX) {
                j--
            }
            // Cache index
            globalScope.Flag[i].cachedIndex = j

            // Plot
            for (; j < plotValues.length; j++) {
                var x = getCycleStartX(plotValues[j][0])

                // Handle out of bound
                if (x < timeLineStartX) {
                    if (j + 1 != plotValues.length) {
                        // Next one also is out of bound, so skip this one completely
                        var x1 = getCycleStartX(plotValues[j + 1][0])
                        if (x1 < timeLineStartX) continue
                    }
                    x = timeLineStartX
                }

                var value = plotValues[j][1]
                if (value === undefined) {
                    if (state == WAVEFORM_STARTED) {
                        ctx?.stroke()
                    }
                    state = WAVEFORM_NOT_STARTED
                    continue
                }
                if (globalScope.Flag[i].bitWidth == 1) {
                    if (x > endX) break
                    var y = value == 1 ? yTop : yBottom
                    if (state == WAVEFORM_NOT_STARTED) {
                        // Start new plot
                        state = WAVEFORM_STARTED
                        ctx?.beginPath()
                        ctx?.moveTo(x, y)
                    } else {
                        if (prevY) {
                            ctx?.lineTo(x, prevY)
                        }
                        ctx?.lineTo(x, y)
                    }
                    prevY = y
                } else {
                    var endX: number
                    if (j + 1 == plotValues.length) {
                        endX = getCycleStartX(endTime)
                    } else {
                        endX = getCycleStartX(plotValues[j + 1][0])
                    }
                    var smallOffset = waveFormHeight / 2
                    ctx?.beginPath()
                    ctx?.moveTo(endX, yMid)
                    ctx?.lineTo(endX - smallOffset, yTop)
                    ctx?.lineTo(x + smallOffset, yTop)
                    ctx?.lineTo(x, yMid)
                    ctx?.lineTo(x + smallOffset, yBottom)
                    ctx?.lineTo(endX - smallOffset, yBottom)
                    ctx?.closePath()
                    ctx?.stroke()

                    // Text position
                    // Clamp start and end are within the screen
                    var x1 = Math.max(x, timeLineStartX)
                    var x2 = Math.min(endX, width)
                    var textPositionX = (x1 + x2) / 2

                    if (ctx) {
                        ctx.font = `${sh(9)}px Times New Roman`
                        ctx.fillStyle = 'white'
                    }
                    ctx?.fillText(
                        convertors.dec2hex(value),
                        textPositionX,
                        yMid + sh(3)
                    )
                }
                if (x > width) {
                    state = WAVEFORM_OVER
                    ctx?.stroke()
                    break
                }
            }
            if (state == WAVEFORM_STARTED) {
                if (globalScope.Flag[i].bitWidth == 1 && prevY) {
                    ctx?.lineTo(endX, prevY)
                }
                ctx?.stroke()
            }
        }
    },
    // Driver function to render and update
    plot() {
        if (embed) return
        if (globalScope.Flag.length === 0 && this.canvas) {
            this.canvas.width = 0
            this.canvas.height = 0
            return
        }

        this.update()
        this.render()
    },
    clear() {
        this.ctx?.clearRect(0, 0, plotArea.canvas?.width ?? 0, plotArea.canvas?.height ?? 0)
    },
}
export default plotArea

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
            plotHeight -= sh(5)
            waveFormHeight = plotHeight - 2 * waveFormPadding
        }
    },
    largeHeight() {
        if (plotHeight < sh(50)) {
            plotHeight += sh(5)
            waveFormHeight = plotHeight - 2 * waveFormPadding
        }
    },
}

export { timingDiagramButtonActions }

export const setupTimingListeners =  {
    plotAreaMouseDown: (e: MouseEvent) => {
        const rect = plotArea.canvas?.getBoundingClientRect()
        const x = sh(e.clientX - (rect?.left ?? 0))
        plotArea.scrollAcc = 0
        plotArea.autoScroll = false
        plotArea.mouseDown = true
        plotArea.mouseX = x
        plotArea.mouseDownX = x
        plotArea.mouseDownTime = new Date().getTime()
    },

    plotAreaMouseUp: () => {
        plotArea.mouseDown = false
        const time = new Date().getTime() - plotArea.mouseDownTime
        const offset = (plotArea.mouseX - plotArea.mouseDownX) / cycleWidth
        plotArea.scrollAcc = (offset * frameInterval) / time
    },

    plotAreaMouseMove: (e: MouseEvent) => {
        const rect = plotArea.canvas?.getBoundingClientRect()
        const x = sh(e.clientX - (rect?.left ?? 0))
        if (plotArea.mouseDown) {
            plotArea.cycleOffset -= (x - plotArea.mouseX) / cycleWidth
            plotArea.mouseX = x
        } else {
            plotArea.mouseDown = false
        }
    }
}
