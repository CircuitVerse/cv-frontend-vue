import { simulationArea } from './simulationArea'
import { colors } from './themer/themer'
import { layoutModeGet } from './layoutMode'
import { updateOrder } from './metadata'
import { MiniMapAreaType } from './types/minimap.types'

// jQuery is available globally in this project
declare const $: JQueryStatic

// Global variables are already declared in app.types.ts

/**
 * This object is used to draw the miniMap.
 */
const miniMapArea: MiniMapAreaType = {
    canvas: null,
    ctx: null,
    pageHeight: 0,
    pageWidth: 0,
    pageY: 0,
    pageX: 0,
    minX: 0,
    maxX: 0,
    minY: 0,
    maxY: 0,

    setup() {
        if (lightMode) return
        this.canvas = document.getElementById(
            'miniMapArea'
        ) as HTMLCanvasElement
        this.pageHeight = height // Math.round(((parseInt($("#simulationArea").height())))/ratio)*ratio-50; // -50 for tool bar? Check again
        this.pageWidth = width // Math.round(((parseInt($("#simulationArea").width())))/ratio)*ratio;
        this.pageY = this.pageHeight - globalScope.oy
        this.pageX = this.pageWidth - globalScope.ox

        if (simulationArea.minHeight != undefined) {
            this.minY = Math.min(
                simulationArea.minHeight,
                -globalScope.oy / globalScope.scale
            )
        } else {
            this.minY = -globalScope.oy / globalScope.scale
        }
        if (simulationArea.maxHeight != undefined) {
            this.maxY = Math.max(
                simulationArea.maxHeight,
                this.pageY / globalScope.scale
            )
        } else {
            this.maxY = this.pageY / globalScope.scale
        }
        if (simulationArea.minWidth != undefined) {
            this.minX = Math.min(
                simulationArea.minWidth,
                -globalScope.ox / globalScope.scale
            )
        } else {
            this.minX = -globalScope.ox / globalScope.scale
        }
        if (simulationArea.maxWidth != undefined) {
            this.maxX = Math.max(
                simulationArea.maxWidth,
                this.pageX / globalScope.scale
            )
        } else {
            this.maxX = this.pageX / globalScope.scale
        }

        const h = this.maxY - this.minY
        const w = this.maxX - this.minX

        const ratio = Math.min(250 / h, 250 / w)
        if (h > w) {
            this.canvas.height = 250.0
            this.canvas.width = (250.0 * w) / h
        } else {
            this.canvas.width = 250.0
            this.canvas.height = (250.0 * h) / w
        }

        this.canvas.height += 5
        this.canvas.width += 5

        const miniMapElement = document.getElementById('miniMap')
        if (miniMapElement) {
            miniMapElement.style.height = `${this.canvas.height}px`
            miniMapElement.style.width = `${this.canvas.width}px`
        }

        this.ctx = this.canvas.getContext('2d')
        this.play(ratio)
    },

    play(ratio: number) {
        if (lightMode || layoutModeGet()) return
        if (!this.ctx) return

        this.ctx.fillStyle = '#bbb'
        this.ctx.rect(0, 0, this.canvas!.width, this.canvas!.height)
        this.ctx.fill()
        this.resolve(ratio)
    },

    resolve(ratio: number) {
        if (lightMode || !this.ctx) return

        this.ctx.fillStyle = '#ddd'
        this.ctx.beginPath()
        this.ctx.rect(
            2.5 +
                ((this.pageX - this.pageWidth) / globalScope.scale -
                    this.minX) *
                    ratio,
            2.5 +
                ((this.pageY - this.pageHeight) / globalScope.scale -
                    this.minY) *
                    ratio,
            (this.pageWidth * ratio) / globalScope.scale,
            (this.pageHeight * ratio) / globalScope.scale
        )
        this.ctx.fill()

        //  to show the area of current canvas
        const lst = updateOrder
        const miniFill = colors['mini_fill']
        const miniStroke = colors['mini_stroke']

        this.ctx.strokeStyle = miniStroke
        this.ctx.fillStyle = miniFill
        for (let i = 0; i < lst.length; i++) {
            if (lst[i] === 'wires') {
                for (let j = 0; j < globalScope[lst[i]].length; j++) {
                    this.ctx.beginPath()
                    this.ctx.moveTo(
                        2.5 +
                            (globalScope[lst[i]][j].node1.absX() - this.minX) *
                                ratio,
                        2.5 +
                            (globalScope[lst[i]][j].node1.absY() - this.minY) *
                                ratio
                    )
                    this.ctx.lineTo(
                        2.5 +
                            (globalScope[lst[i]][j].node2.absX() - this.minX) *
                                ratio,
                        2.5 +
                            (globalScope[lst[i]][j].node2.absY() - this.minY) *
                                ratio
                    )
                    this.ctx.stroke()
                }
            } else if (lst[i] != 'nodes') {
                // Don't include SquareRGBLed here; it has correct size.
                let ledY = 0
                if (
                    lst[i] == 'DigitalLed' ||
                    lst[i] == 'VariableLed' ||
                    lst[i] == 'RGBLed'
                ) {
                    ledY = 20
                }

                for (let j = 0; j < globalScope[lst[i]].length; j++) {
                    const obj = globalScope[lst[i]][j]
                    this.ctx.beginPath()
                    this.ctx.rect(
                        2.5 + (obj.x - obj.leftDimensionX - this.minX) * ratio,
                        2.5 + (obj.y - obj.upDimensionY - this.minY) * ratio,
                        (obj.rightDimensionX + obj.leftDimensionX) * ratio,
                        (obj.downDimensionY + obj.upDimensionY + ledY) * ratio
                    )

                    this.ctx.fill()
                    this.ctx.stroke()
                }
            }
        }
    },

    clear() {
        if (lightMode) return
        $('#miniMapArea').css('z-index', '-1')
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        }
    },
}

let lastMiniMapShown: number | undefined

/**
 * Update the timestamp of when the minimap was last shown
 */
export function updatelastMinimapShown(): void {
    lastMiniMapShown = new Date().getTime()
}

/**
 * Remove the minimap after a certain time period
 */
export function removeMiniMap(): void {
    if (lightMode) return

    if (
        simulationArea.lastSelected == globalScope.root &&
        simulationArea.mouseDown
    )
        return

    if (lastMiniMapShown && lastMiniMapShown + 2000 >= new Date().getTime()) {
        setTimeout(
            removeMiniMap,
            lastMiniMapShown + 2000 - new Date().getTime()
        )
        return
    }

    // Using jQuery for the fade out effect
    $('#miniMap').fadeOut('fast')
}

export default miniMapArea
