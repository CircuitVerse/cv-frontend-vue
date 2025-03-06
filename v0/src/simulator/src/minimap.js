import simulationArea from './simulationArea'
import { colors } from './themer/themer'
import { layoutModeGet } from './layoutMode'

// Ensure lightMode is defined somewhere. Adding a placeholder here.
const lightMode = false // Replace this with actual logic from your app.

var miniMapArea

/**
 * @type {Object} miniMapArea
 * This object is used to draw the miniMap.
 * @property {number} pageY
 * @property {number} pageX
 * @property {HTMLCanvasElement} canvas - the canvas object
 * @property {function} setup - used to setup the parameters and dimensions
 * @property {function} play - used to draw outline of minimap and call resolve
 * @property {function} resolve - used to resolve all objects and draw them on minimap
 * @property {function} clear - used to clear minimap
 * @category minimap
 */
miniMapArea = {
    canvas: document.getElementById('miniMapArea'),

    setup() {
        if (lightMode) return

        this.canvas = document.getElementById('miniMapArea')
        if (!this.canvas) {
            console.warn('miniMapArea canvas element not found')
            return
        }

        this.pageHeight = window.height // Make sure you define `height` correctly in your environment.
        this.pageWidth = window.width // Make sure you define `width` correctly in your environment.
        this.pageY = this.pageHeight - globalScope.oy
        this.pageX = this.pageWidth - globalScope.ox

        this.minY = (simulationArea.minHeight !== undefined) 
            ? Math.min(simulationArea.minHeight, -globalScope.oy / globalScope.scale)
            : -globalScope.oy / globalScope.scale

        this.maxY = (simulationArea.maxHeight !== undefined) 
            ? Math.max(simulationArea.maxHeight, this.pageY / globalScope.scale)
            : this.pageY / globalScope.scale

        this.minX = (simulationArea.minWidth !== undefined) 
            ? Math.min(simulationArea.minWidth, -globalScope.ox / globalScope.scale)
            : -globalScope.ox / globalScope.scale

        this.maxX = (simulationArea.maxWidth !== undefined) 
            ? Math.max(simulationArea.maxWidth, this.pageX / globalScope.scale)
            : this.pageX / globalScope.scale

        const h = this.maxY - this.minY
        const w = this.maxX - this.minX

        const ratio = Math.min(250 / h, 250 / w)

        if (h > w) {
            this.canvas.height = 250
            this.canvas.width = (250 * w) / h
        } else {
            this.canvas.width = 250
            this.canvas.height = (250 * h) / w
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

    play(ratio) {
        if (lightMode || layoutModeGet()) return

        this.ctx.fillStyle = '#bbb'
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        this.resolve(ratio)
    },

    resolve(ratio) {
        if (lightMode) return

        this.ctx.fillStyle = '#ddd'
        this.ctx.beginPath()
        this.ctx.lineWidth = 2  // Thicker lines for better visibility

        this.ctx.rect(
            2.5 + ((this.pageX - this.pageWidth) / globalScope.scale - this.minX) * ratio,
            2.5 + ((this.pageY - this.pageHeight) / globalScope.scale - this.minY) * ratio,
            (this.pageWidth * ratio) / globalScope.scale,
            (this.pageHeight * ratio) / globalScope.scale
        )
        this.ctx.fill()

        const miniFill = colors['mini_fill']
        const miniStroke = colors['mini_stroke']

        this.ctx.strokeStyle = miniStroke
        this.ctx.fillStyle = miniFill

        const lst = updateOrder
        for (let i = 0; i < lst.length; i++) {
            if (lst[i] === 'wires') {
                for (let wire of globalScope[lst[i]]) {
                    this.ctx.beginPath()
                    this.ctx.moveTo(
                        2.5 + (wire.node1.absX() - this.minX) * ratio,
                        2.5 + (wire.node1.absY() - this.minY) * ratio
                    )
                    this.ctx.lineTo(
                        2.5 + (wire.node2.absX() - this.minX) * ratio,
                        2.5 + (wire.node2.absY() - this.minY) * ratio
                    )
                    this.ctx.stroke()
                }
            } else if (lst[i] !== 'nodes') {
                let ledY = 0
                if (['DigitalLed', 'VariableLed', 'RGBLed'].includes(lst[i])) {
                    ledY = 20
                }

                for (let obj of globalScope[lst[i]]) {
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
        const canvas = document.getElementById('miniMapArea')
        if (canvas) {
            $('#miniMapArea').css('z-index', '-1')
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        }
    }
}

var lastMiniMapShown = 0

export function updatelastMinimapShown() {
    lastMiniMapShown = Date.now()
}

export function removeMiniMap() {
    if (lightMode) return

    if (simulationArea.lastSelected === globalScope.root && simulationArea.mouseDown) {
        return
    }

    if (lastMiniMapShown + 2000 >= Date.now()) {
        setTimeout(removeMiniMap, lastMiniMapShown + 2000 - Date.now())
        return
    }

    $('#miniMap').fadeOut('fast')
}

export default miniMapArea
