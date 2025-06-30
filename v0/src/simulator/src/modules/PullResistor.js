import { correctWidth, lineTo, moveTo } from '../canvasApi'
import CircuitElement from '../circuitElement'
import Node, { findNode } from '../node'
import simulationArea from '../simulationArea'
import { colors } from '../themer/themer'

export default class PullResistor extends CircuitElement {
    constructor(x, y, scope = globalScope, dir = 'RIGHT', pullDirection = "Down") {
        super(x, y, scope, dir, 1)

        this.rectangleObject = false;
        this.fixedBitWidth = true;
        this.setDimensions(10, 30)
        this.pullDirection = pullDirection ?? "Down";
        this.inp = new Node(0, -10, 0, this, 1, 'inp')
    }

    customSave() {
        const data = {
            constructorParamaters: [this.direction, this.bitWidth],
            nodes: {
                inp: findNode(this.inp)
            },
        }
        return data
    }

    isResolvable() {
        return true
    }

    resolve() {
        if (this.inp.value == undefined) {
            this.inp.value = this.pullDirection == "Up" ? 1 : 0;
            simulationArea.simulationQueue.add(this.inp)
        }
    }

    customDraw() {
        const ctx = simulationArea.context;
        ctx.fillStyle = colors['fill']
        ctx.strokeStyle = colors['stroke']
        ctx.beginPath()
        var xx = this.x
        var yy = this.y
        ctx.lineWidth = correctWidth(3)

        // Start line from top (Vcc or Input)// Top wire
        moveTo(ctx, 0, 0, xx, yy, this.direction)
        lineTo(ctx, 0, 10, xx, yy, this.direction);

        // Zigzag shape for resistor
        const segmentLength = 5;
        const amplitude = 5;
        let currentY = 10
        let toggle = true;

        for (let i = 0; i < 9; i++) {
            const dx = toggle ? amplitude : -amplitude;
            currentY += segmentLength;
            lineTo(ctx, dx, currentY, xx, yy, this.direction);
            toggle = !toggle;
        }


        ctx.stroke();
    }

    changePullDirection(pullDirection) {
        if (pullDirection !== undefined && this.pullDirection !== pullDirection) {
            this.pullDirection = pullDirection;
            var obj = new PullResistor(this.x, this.y, this.scope, this.dir, this.pullDirection)
            this.delete()
            simulationArea.lastSelected = obj
            return obj
        }

    }

}

PullResistor.prototype.mutableProperties = {
    pullDirection: {
        name: 'Pull Direction: ',
        type: 'dropdown',
        func: 'changePullDirection',
        dropdownArray: ['Down', 'Up']
    }
}

PullResistor.prototype.tooltipText =
    'PullResistor'
PullResistor.prototype.helplink =
    'https://docs.circuitverse.org/#/chapter4/<to be updated>'
PullResistor.prototype.objectType = 'PullResistor'
PullResistor.prototype.objectType = 'PullResistor'
