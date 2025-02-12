import { simulationArea } from './simulationArea'
import { globalScope } from './globalScope'
import { convertors } from './utils'
import { useSimulatorMobileStore } from '#/store/simulatorMobileStore'
import { toRefs } from 'vue'

const DPR = window.devicePixelRatio || 1

// Helper function to scale to display
function sh(x: number): number {
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
const frameInterval = 100 // Refresh rate
let timeLineHeight = sh(20)
let padding = sh(2)
let plotHeight = sh(20)
let waveFormPadding = sh(5)
let waveFormHeight = plotHeight - 2 * waveFormPadding
let flagLabelWidth = sh(75)
let cycleWidth = sh(30)
const backgroundColor = 'black'
const foregroundColor = '#eee'
const textColor = 'black'
const waveFormColor = 'cyan'
const timeLineStartX = flagLabelWidth + padding

// Helper functions for canvas

function getFullHeight(flagCount: number): number {
    return timeLineHeight + (plotHeight + padding) * flagCount
}

function getFlagStartY(flagIndex: number): number {
    return getFullHeight(flagIndex) + padding
}

function getCycleStartX(cycleNumber: number): number {
    return timeLineStartX + (cycleNumber - plotArea.cycleOffset) * cycleWidth
}

interface PlotArea {
    cycleOffset: number
    DPR: number
    canvas: HTMLCanvasElement | null
    cycleCount: number
    cycleTime: number
    executionStartTime: number
    autoScroll: boolean
    width: number
    height: number
    unitUsed: number
    cycleUnit: number
    mouseDown: boolean
    mouseX: number
    mouseDownX: number
    mouseDownTime: number
    ctx?: CanvasRenderingContext2D | null
    timeOutPlot?: ReturnType<typeof setInterval>
    scrollAcc?: number
    reset(): void
    resume(): void
    pause(): void
    nextCycle(): void
    setExecutionTime(): void
    zoomIn(): void
    zoomOut(): void
    download(): void
    resize(): void
    setup(): void
    getPlotTime(timeUnit: number): number
    calibrate(): void
    getCurrentTime(): number
    update(): void
    render(): void
    plot(): void
    clear(): void
}

const embed = false; // Define the embed variable

const plotArea: PlotArea = {
    cycleOffset: 0,
    DPR: window.devicePixelRatio || 1,
    canvas: document.getElementById('plotArea') as HTMLCanvasElement,
    cycleCount: 0,
    cycleTime: 0,
    executionStartTime: 0,
    autoScroll: true,
    width: 0,
    height: 0,
    unitUsed: 0,
    cycleUnit: 1000,
    mouseDown: false,
    mouseX: 0,
    mouseDownX: 0,
    mouseDownTime: 0,
    reset() {
        this.cycleCount = 0
        this.cycleTime = new Date().getTime()
        for (let i = 0; i < globalScope.Flag.length; i++) {
            globalScope.Flag[i].plotValues = [
                [0, globalScope.Flag[i].inp1.value],
            ]
            globalScope.Flag[i].cachedIndex = 0
        }
        this.unitUsed = 0
        this.resume()
        this.resize()
    },
    resume() {
        this.autoScroll = true
    },
    pause() {
        this.autoScroll = false
        plotArea.scrollAcc = 0
    },
    nextCycle() {
        this.cycleCount++
        this.cycleTime = new Date().getTime()
    },
    setExecutionTime() {
        this.executionStartTime = new Date().getTime()
    },
    zoomIn() {
        cycleWidth += sh(2)
    },
    zoomOut() {
        cycleWidth -= sh(2)
    },
    download() {
        if (!this.canvas) return
        const img = this.canvas.toDataURL('image/png')
        const anchor = document.createElement('a')
        anchor.href = img
        anchor.download = 'waveform.png'
        anchor.click()
    },
    resize() {
        if (!this.canvas) return
        const oldHeight = this.height
        const oldWidth = this.width
        this.width = document.getElementById('plot')!.clientWidth * this.DPR
        this.height = getFullHeight(globalScope.Flag.length)
        if (oldHeight === this.height && oldWidth === this.width) return
        this.canvas.width = this.width
        this.canvas.height = this.height
        this.plot()
    },
    setup() {
        this.canvas = document.getElementById('plotArea') as HTMLCanvasElement
        if (!embed) {
            this.ctx = this.canvas.getContext('2d')
        }
        this.timeOutPlot = setInterval(() => {
            plotArea.plot()
        }, frameInterval)
        this.reset()
    },
    getPlotTime(timeUnit: number): number {
        let time = this.cycleCount
        time += timeUnit / this.cycleUnit
        const timePeriod = simulationArea.timePeriod
        const executionDelay = this.executionStartTime - this.cycleTime
        const delayFraction = executionDelay / timePeriod
        time += delayFraction
        return time
    },
    calibrate() {
        const recommendedUnit = Math.max(20, Math.round(this.unitUsed * 3))
        this.cycleUnit = recommendedUnit
        $('#timing-diagram-units').val(recommendedUnit)
        this.reset()
    },
    getCurrentTime(): number {
        let time = this.cycleCount
        const timePeriod = simulationArea.timePeriod
        const delay = new Date().getTime() - this.cycleTime
        const delayFraction = delay / timePeriod
        time += delayFraction
        return time
    },
    update() {
        this.resize()
        const dangerColor = '#dc5656'
        const normalColor = '#42b983'
        this.unitUsed = Math.max(
            this.unitUsed,
            simulationArea.simulationQueue.time
        )
        const unitUsed = this.unitUsed
        const units = this.cycleUnit
        const utilization = Math.round((unitUsed * 10000) / units) / 100
        $('#timing-diagram-log').html(
            `Utilization: ${Math.round(unitUsed)} Units (${utilization}%)`
        )
        if (utilization >= 90 || utilization <= 10) {
            const recommendedUnit = Math.max(20, Math.round(unitUsed * 3))
            $('#timing-diagram-log').append(
                ` Recommended Units: ${recommendedUnit}`
            )
            $('#timing-diagram-log').css('background-color', dangerColor)
            if (utilization >= 100) {
                this.clear()
                return
            }
        } else {
            $('#timing-diagram-log').css('background-color', normalColor)
        }

        const width = this.width
        const endTime = this.getCurrentTime()

        if (this.autoScroll) {
            this.cycleOffset = Math.max(
                0,
                endTime - (width - timeLineStartX) / cycleWidth
            )
        } else if (!plotArea.mouseDown) {
            this.cycleOffset -= plotArea.scrollAcc!
            plotArea.scrollAcc! *= 0.95
            if (this.cycleOffset < 0) plotArea.scrollAcc! = this.cycleOffset / 5
            if (Math.abs(this.cycleOffset) < 0.01) this.cycleOffset = 0
        }
    },
    render() {
        if (!this.canvas || !this.ctx) return
        const { width, height } = this
        this.canvas.height = height
        this.canvas.width = width
        const endTime = this.getCurrentTime()
        this.clear()
        const ctx = this.ctx

        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, width, height)

        ctx.lineWidth = sh(1)
        ctx.font = `${sh(15)}px Raleway`
        ctx.textAlign = 'left'

        ctx.fillStyle = foregroundColor
        ctx.fillRect(timeLineStartX, 0, this.canvas.width, timeLineHeight)
        ctx.fillRect(0, 0, flagLabelWidth, timeLineHeight)
        ctx.fillStyle = textColor
        ctx.fillText('Time', sh(5), timeLineHeight * 0.7)

        ctx.font = `${sh(9)}px Times New Roman`
        ctx.strokeStyle = textColor
        ctx.textAlign = 'center'
        for (
            let i = Math.floor(plotArea.cycleOffset);
            getCycleStartX(i) <= width;
            i++
        ) {
            const x = getCycleStartX(i)
            if (x >= timeLineStartX) {
                ctx.fillText(`${i}`, x, timeLineHeight - sh(15) / 2)
                ctx.beginPath()
                ctx.moveTo(x, timeLineHeight - sh(5))
                ctx.lineTo(x, timeLineHeight)
                ctx.stroke()
            }
            for (let j = 1; j < 5; j++) {
                const x1 = x + Math.round((j * cycleWidth) / 5)
                if (x1 >= timeLineStartX) {
                    ctx.beginPath()
                    ctx.moveTo(x1, timeLineHeight - sh(2))
                    ctx.lineTo(x1, timeLineHeight)
                    ctx.stroke()
                }
            }
        }

        ctx.textAlign = 'left'
        for (let i = 0; i < globalScope.Flag.length; i++) {
            const startHeight = getFlagStartY(i)
            ctx.fillStyle = foregroundColor
            ctx.fillRect(0, startHeight, flagLabelWidth, plotHeight)
            ctx.fillStyle = textColor
            ctx.fillText(
                globalScope.Flag[i].identifier,
                sh(5),
                startHeight + plotHeight * 0.7
            )
        }

        const WAVEFORM_NOT_STARTED = 0
        const WAVEFORM_STARTED = 1
        const WAVEFORM_OVER = 3

        ctx.strokeStyle = waveFormColor
        ctx.textAlign = 'center'
        const endX = Math.min(getCycleStartX(endTime), width)

        for (let i = 0; i < globalScope.Flag.length; i++) {
            const plotValues = globalScope.Flag[i].plotValues
            const startHeight = getFlagStartY(i) + waveFormPadding
            const yTop = startHeight
            const yMid = startHeight + waveFormHeight / 2
            const yBottom = startHeight + waveFormHeight
            let state = WAVEFORM_NOT_STARTED
            let prevY: number = yMid

            let j = 0
            if (globalScope.Flag[i].cachedIndex) {
                j = globalScope.Flag[i].cachedIndex
            }
            while (
                j + 1 < plotValues.length &&
                getCycleStartX(plotValues[j][0]) < timeLineStartX
            ) {
                j++
            }
            while (j > 0 && getCycleStartX(plotValues[j][0]) > timeLineStartX) {
                j--
            }
            globalScope.Flag[i].cachedIndex = j

            for (; j < plotValues.length; j++) {
                let x = getCycleStartX(plotValues[j][0])

                if (x < timeLineStartX) {
                    if (j + 1 !== plotValues.length) {
                        const x1 = getCycleStartX(plotValues[j + 1][0])
                        if (x1 < timeLineStartX) continue
                    }
                    x = timeLineStartX
                }

                const value = plotValues[j][1]
                if (value === undefined) {
                    if (state === WAVEFORM_STARTED) {
                        ctx.stroke()
                    }
                    state = WAVEFORM_NOT_STARTED
                    continue
                }
                if (globalScope.Flag[i].bitWidth === 1) {
                    if (x > endX) break
                    const y = value === 1 ? yTop : yBottom
                    if (state === WAVEFORM_NOT_STARTED) {
                        state = WAVEFORM_STARTED
                        ctx.beginPath()
                        ctx.moveTo(x, y)
                    } else {
                        ctx.lineTo(x, prevY)
                        ctx.lineTo(x, y)
                    }
                    prevY = y
                } else {
                    let endX
                    if (j + 1 === plotValues.length) {
                        endX = getCycleStartX(endTime)
                    } else {
                        endX = getCycleStartX(plotValues[j + 1][0])
                    }
                    const smallOffset = waveFormHeight / 2
                    ctx.beginPath()
                    ctx.moveTo(endX, yMid)
                    ctx.lineTo(endX - smallOffset, yTop)
                    ctx.lineTo(x + smallOffset, yTop)
                    ctx.lineTo(x, yMid)
                    ctx.lineTo(x + smallOffset, yBottom)
                    ctx.lineTo(endX - smallOffset, yBottom)
                    ctx.closePath()
                    ctx.stroke()

                    const x1 = Math.max(x, timeLineStartX)
                    const x2 = Math.min(endX, width)
                    const textPositionX = (x1 + x2) / 2

                    ctx.font = `${sh(9)}px Times New Roman`
                    ctx.fillStyle = 'white'
                    ctx.fillText(
                        convertors.dec2hex(value),
                        textPositionX,
                        yMid + sh(3)
                    )
                }
                if (x > width) {
                    state = WAVEFORM_OVER
                    ctx.stroke()
                    break
                }
            }
            if (state === WAVEFORM_STARTED) {
                if (globalScope.Flag[i].bitWidth === 1) {
                    ctx.lineTo(endX, prevY)
                }
                ctx.stroke()
            }
        }
    },
    plot() {
        const simulatorMobileStore = useSimulatorMobileStore()
        const { showCanvas } = toRefs(simulatorMobileStore)
        if (embed) return
        if (globalScope.Flag.length === 0) {
            if (this.canvas) {
                this.canvas.width = 0
                this.canvas.height = 0
            }
            showCanvas.value = false
            return
        }
        showCanvas.value = true

        this.update()
        this.render()
    },
    clear() {
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        }
    },
}

export default plotArea

interface TimingDiagramButtonActions {
    smallHeight(): void
    largeHeight(): void
}

const timingDiagramButtonActions: TimingDiagramButtonActions = {
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

export function setupTimingListeners() {
    document.getElementById('plotArea')!.addEventListener('mousedown', (e) => {
        const rect = plotArea.canvas!.getBoundingClientRect()
        const x = sh(e.clientX - rect.left)
        plotArea.scrollAcc = 0
        plotArea.autoScroll = false
        plotArea.mouseDown = true
        plotArea.mouseX = x
        plotArea.mouseDownX = x
        plotArea.mouseDownTime = new Date().getTime()
    })
    document.getElementById('plotArea')!.addEventListener('mouseup', (e) => {
        plotArea.mouseDown = false
        const time = new Date().getTime() - plotArea.mouseDownTime
        const offset = (plotArea.mouseX - plotArea.mouseDownX) / cycleWidth
        plotArea.scrollAcc = (offset * frameInterval) / time
    })

    document.getElementById('plotArea')!.addEventListener('mousemove', (e) => {
        const rect = plotArea.canvas!.getBoundingClientRect()
        const x = sh(e.clientX - rect.left)
        if (plotArea.mouseDown) {
            plotArea.cycleOffset -= (x - plotArea.mouseX) / cycleWidth
            plotArea.mouseX = x
        } else {
            plotArea.mouseDown = false
        }
    })
}
