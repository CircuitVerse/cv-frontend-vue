import AndGate from './modules/AndGate'
import NandGate from './modules/NandGate'
import Multiplexer from './modules/Multiplexer'
import XorGate from './modules/XorGate'
import XnorGate from './modules/XnorGate'
import OrGate from './modules/OrGate'
import NotGate from './modules/NotGate'
import Buffer from './modules/Buffer'
import Adder from './modules/Adder'
import verilogMultiplier from './modules/verilogMultiplier'
import verilogDivider from './modules/verilogDivider'
import verilogPower from './modules/verilogPower'
import verilogShiftLeft from './modules/verilogShiftLeft'
import verilogShiftRight from './modules/verilogShiftRight'
import Splitter from './modules/Splitter'
import Input from './modules/Input'
import Output from './modules/Output'
import ConstantVal from './modules/ConstantVal'
import NorGate from './modules/NorGate'
import DigitalLed from './modules/DigitalLed'
import Button from './modules/Button'
import LSB from './modules/LSB'
import ALU from './modules/ALU'
import DflipFlop from './sequential/DflipFlop'
import Clock from './sequential/Clock'
import verilogRAM from './sequential/verilogRAM'

function getXY(deviceJSON) {
    const pos = deviceJSON && deviceJSON.position
    return {
        x: (pos && typeof pos.x === 'number') ? pos.x : 0,
        y: (pos && typeof pos.y === 'number') ? pos.y : 0,
    }
}

function getBitWidth(bitsJSON) {
    if (Number.isInteger(bitsJSON)) {
        return bitsJSON
    } else {
        var ans = 1
        for (var i in bitsJSON) {
            ans = Math.max(ans, bitsJSON[i])
        }
        return ans
    }
}

class verilogUnaryGate {
    constructor(deviceJSON) {
        this.bitWidth = 1
        if (deviceJSON['bits']) {
            this.bitWidth = getBitWidth(deviceJSON['bits'])
        }
    }

    // ── FIXED: explicit undefined + warning instead of silent undefined ──
    getPort(portName) {
        if (portName == 'in')  return this.input
        if (portName == 'out') return this.output
        console.warn('[VerilogClasses] UnaryGate: unknown port "' + portName + '"')
        return undefined
    }
}

class verilogInput extends verilogUnaryGate {
    constructor(deviceJSON) {
        super(deviceJSON)
        const { x, y } = getXY(deviceJSON)
        if (deviceJSON['net'] == 'clk' || deviceJSON['net'] == 'clock') {
            this.element = new Clock(x, y)
        } else {
            this.element = new Input(x, y, undefined, undefined, this.bitWidth)
        }
        this.output = this.element.output1
        this.element.label = deviceJSON['net']
    }
}

class verilogOutput extends verilogUnaryGate {
    constructor(deviceJSON) {
        super(deviceJSON)
        const { x, y } = getXY(deviceJSON)
        this.element = new Output(x, y, undefined, undefined, this.bitWidth)
        this.input = this.element.inp1
        this.element.label = deviceJSON['net']
    }
}

class verilogClock extends verilogUnaryGate {
    constructor(deviceJSON) {
        super(deviceJSON)
        const { x, y } = getXY(deviceJSON)
        this.element = new Clock(x, y)
        this.output = this.element.output1
    }
}

class verilogButton extends verilogUnaryGate {
    constructor(deviceJSON) {
        super(deviceJSON)
        const { x, y } = getXY(deviceJSON)
        this.element = new Button(x, y)
        this.output = this.element.output1
    }
}

class verilogLamp extends verilogUnaryGate {
    constructor(deviceJSON) {
        super(deviceJSON)
        const { x, y } = getXY(deviceJSON)
        this.element = new DigitalLed(x, y)
        this.input = this.element.inp1
    }
}

class verilogNotGate extends verilogUnaryGate {
    constructor(deviceJSON) {
        super(deviceJSON)
        const { x, y } = getXY(deviceJSON)
        this.element = new NotGate(x, y, undefined, undefined, this.bitWidth)
        this.input = this.element.inp1
        this.output = this.element.output1
    }
}

class verilogRepeaterGate extends verilogUnaryGate {
    constructor(deviceJSON) {
        super(deviceJSON)
        const { x, y } = getXY(deviceJSON)
        this.element = new Buffer(x, y, undefined, undefined, this.bitWidth)
        this.input = this.element.inp1
        this.output = this.element.output1
    }
}

class verilogConstantVal extends verilogUnaryGate {
    constructor(deviceJSON) {
        super(deviceJSON)
        const { x, y } = getXY(deviceJSON)
        this.bitWidth = deviceJSON['constant'].length
        this.state = deviceJSON['constant']
        if (this.state[0] == 'x') {
            this.state = undefined
        }
        this.element = new ConstantVal(
            x, y,
            undefined, undefined,
            this.bitWidth,
            this.state
        )
        this.input = this.element.inp1
        this.output = this.element.output1
    }
}

class verilogReduceAndGate extends verilogUnaryGate {
    constructor(deviceJSON) {
        super(deviceJSON)
        const { x, y } = getXY(deviceJSON)
        this.bitWidthSplit = []
        for (var i = 0; i < this.bitWidth; i++) this.bitWidthSplit.push(1)
        this.splitter = new Splitter(x, y, undefined, undefined, this.bitWidth, this.bitWidthSplit)
        this.andGate  = new AndGate(x + 50, y, undefined, undefined, this.bitWidth, 1)
        for (var i = 0; i < this.bitWidth; i++) this.splitter.outputs[i].connect(this.andGate.inp[i])
        this.input  = this.splitter.inp1
        this.output = this.andGate.output1
    }
}

class verilogReduceNandGate extends verilogUnaryGate {
    constructor(deviceJSON) {
        super(deviceJSON)
        const { x, y } = getXY(deviceJSON)
        this.bitWidthSplit = []
        for (var i = 0; i < this.bitWidth; i++) this.bitWidthSplit.push(1)
        this.splitter  = new Splitter(x, y, undefined, undefined, this.bitWidth, this.bitWidthSplit)
        this.nandGate  = new NandGate(x + 50, y, undefined, undefined, this.bitWidth, 1)
        for (var i = 0; i < this.bitWidth; i++) this.splitter.outputs[i].connect(this.nandGate.inp[i])
        this.input  = this.splitter.inp1
        this.output = this.nandGate.output1
    }
}

class verilogReduceOrGate extends verilogUnaryGate {
    constructor(deviceJSON) {
        super(deviceJSON)
        const { x, y } = getXY(deviceJSON)
        this.bitWidthSplit = []
        for (var i = 0; i < this.bitWidth; i++) this.bitWidthSplit.push(1)
        this.splitter = new Splitter(x, y, undefined, undefined, this.bitWidth, this.bitWidthSplit)
        this.orGate   = new OrGate(x + 50, y, undefined, undefined, this.bitWidth, 1)
        for (var i = 0; i < this.bitWidth; i++) this.splitter.outputs[i].connect(this.orGate.inp[i])
        this.input  = this.splitter.inp1
        this.output = this.orGate.output1
    }
}

class verilogReduceNorGate extends verilogUnaryGate {
    constructor(deviceJSON) {
        super(deviceJSON)
        const { x, y } = getXY(deviceJSON)
        this.bitWidthSplit = []
        for (var i = 0; i < this.bitWidth; i++) this.bitWidthSplit.push(1)
        this.splitter = new Splitter(x, y, undefined, undefined, this.bitWidth, this.bitWidthSplit)
        this.norGate  = new NorGate(x + 50, y, undefined, undefined, this.bitWidth, 1)
        for (var i = 0; i < this.bitWidth; i++) this.splitter.outputs[i].connect(this.norGate.inp[i])
        this.input  = this.splitter.inp1
        this.output = this.norGate.output1
    }
}

class verilogReduceXorGate extends verilogUnaryGate {
    constructor(deviceJSON) {
        super(deviceJSON)
        const { x, y } = getXY(deviceJSON)
        this.bitWidthSplit = []
        for (var i = 0; i < this.bitWidth; i++) this.bitWidthSplit.push(1)
        this.splitter = new Splitter(x, y, undefined, undefined, this.bitWidth, this.bitWidthSplit)
        this.xorGate  = new XorGate(x + 50, y, undefined, undefined, this.bitWidth, 1)
        for (var i = 0; i < this.bitWidth; i++) this.splitter.outputs[i].connect(this.xorGate.inp[i])
        this.input  = this.splitter.inp1
        this.output = this.xorGate.output1
    }
}

class verilogReduceXnorGate extends verilogUnaryGate {
    constructor(deviceJSON) {
        super(deviceJSON)
        const { x, y } = getXY(deviceJSON)
        this.bitWidthSplit = []
        for (var i = 0; i < this.bitWidth; i++) this.bitWidthSplit.push(1)
        this.splitter  = new Splitter(x, y, undefined, undefined, this.bitWidth, this.bitWidthSplit)
        this.xnorGate  = new XnorGate(x + 50, y, undefined, undefined, this.bitWidth, 1)
        for (var i = 0; i < this.bitWidth; i++) this.splitter.outputs[i].connect(this.xnorGate.inp[i])
        this.input  = this.splitter.inp1
        this.output = this.xnorGate.output1
    }
}

class verilogBusSlice extends verilogUnaryGate {
    constructor(deviceJSON) {
        super(deviceJSON)
        const { x, y } = getXY(deviceJSON)
        this.bitWidth = deviceJSON['slice']['total']
        this.start = deviceJSON['slice']['first']
        this.count = deviceJSON['slice']['count']
        if (this.start == 0) {
            if (this.count == this.bitWidth) {
                this.splitter = new Splitter(x, y, undefined, undefined, this.bitWidth, [this.bitWidth])
            } else {
                this.splitter = new Splitter(x, y, undefined, undefined, this.bitWidth, [this.count, this.bitWidth - this.count])
            }
            this.input  = this.splitter.inp1
            this.output = this.splitter.outputs[0]
        } else {
            if (this.start + this.count == this.bitWidth) {
                this.splitter = new Splitter(x, y, undefined, undefined, this.bitWidth, [this.start, this.count])
            } else {
                this.splitter = new Splitter(x, y, undefined, undefined, this.bitWidth, [this.start, this.count, this.bitWidth - this.start - this.count])
            }
            this.input  = this.splitter.inp1
            this.output = this.splitter.outputs[1]
        }
    }
}

class verilogZeroExtend extends verilogUnaryGate {
    constructor(deviceJSON) {
        super(deviceJSON)
        const { x, y } = getXY(deviceJSON)
        this.inputBitWidth  = deviceJSON['extend']['input']
        this.outputBitWidth = deviceJSON['extend']['output']
        var extraBits = this.outputBitWidth - this.inputBitWidth
        var zeroState = ''
        for (var i = 0; i < extraBits; i++) zeroState += '0'
        this.zeroConstant = new ConstantVal(x, y - 30, undefined, undefined, extraBits, zeroState)
        this.splitter = new Splitter(x, y, undefined, undefined, this.outputBitWidth, [this.inputBitWidth, extraBits])
        this.zeroConstant.output1.connect(this.splitter.outputs[1])
        this.input  = this.splitter.outputs[0]
        this.output = this.splitter.inp1
    }
}

class verilogNegationGate extends verilogUnaryGate {
    constructor(deviceJSON) {
        super(deviceJSON)
        const { x, y } = getXY(deviceJSON)
        this.inputBitWidth = deviceJSON['bits']['in']
        this.notGate = new NotGate(x, y, undefined, undefined, this.bitWidth)
        this.adder   = new Adder(x + 60, y, undefined, undefined, this.bitWidth)
        if (this.inputBitWidth != this.bitWidth) {
            var extraBits = this.bitWidth - this.inputBitWidth
            this.splitter = new Splitter(x, y + 60, undefined, undefined, this.bitWidth, [this.inputBitWidth, extraBits])
            var zeroState = ''
            for (var i = 0; i < extraBits; i++) zeroState += '0'
            this.zeroConstant = new ConstantVal(x + 30, y + 60, undefined, undefined, extraBits, zeroState)
            this.zeroConstant.output1.connect(this.splitter.outputs[1])
            this.splitter.inp1.connect(this.notGate.inp1)
            this.input = this.splitter.outputs[0]
        } else {
            this.input = this.notGate.inp1
        }
        var oneVal = ''
        for (var i = 0; i < this.bitWidth - 1; i++) oneVal += '0'
        oneVal += '1'
        this.oneConstant = new ConstantVal(x, y + 30, undefined, undefined, this.bitWidth, oneVal)
        this.notGate.output1.connect(this.adder.inpA)
        this.oneConstant.output1.connect(this.adder.inpB)
        this.output = this.adder.sum
    }
}

class verilogBinaryGate {
    constructor(deviceJSON) {
        this.bitWidth = 1
        if (deviceJSON['bits']) {
            this.bitWidth = getBitWidth(deviceJSON['bits'])
        }
    }

    // ── FIXED: explicit undefined + warning instead of silent undefined ──
    getPort(portName) {
        if (portName == 'in1') return this.input[0]
        if (portName == 'in2') return this.input[1]
        if (portName == 'out') return this.output
        console.warn('[VerilogClasses] BinaryGate: unknown port "' + portName + '"')
        return undefined
    }
}

class verilogAndGate extends verilogBinaryGate {
    constructor(deviceJSON) {
        super(deviceJSON)
        const { x, y } = getXY(deviceJSON)
        this.element = new AndGate(x, y, undefined, undefined, undefined, this.bitWidth)
        this.input  = [this.element.inp[0], this.element.inp[1]]
        this.output = this.element.output1
    }
}

class verilogNandGate extends verilogBinaryGate {
    constructor(deviceJSON) {
        super(deviceJSON)
        const { x, y } = getXY(deviceJSON)
        this.element = new NandGate(x, y, undefined, undefined, undefined, this.bitWidth)
        this.input  = [this.element.inp[0], this.element.inp[1]]
        this.output = this.element.output1
    }
}

class verilogOrGate extends verilogBinaryGate {
    constructor(deviceJSON) {
        super(deviceJSON)
        const { x, y } = getXY(deviceJSON)
        this.element = new OrGate(x, y, undefined, undefined, undefined, this.bitWidth)
        this.input  = [this.element.inp[0], this.element.inp[1]]
        this.output = this.element.output1
    }
}

class verilogNorGate extends verilogBinaryGate {
    constructor(deviceJSON) {
        super(deviceJSON)
        const { x, y } = getXY(deviceJSON)
        this.element = new NorGate(x, y, undefined, undefined, undefined, this.bitWidth)
        this.input  = [this.element.inp[0], this.element.inp[1]]
        this.output = this.element.output1
    }
}

class verilogXorGate extends verilogBinaryGate {
    constructor(deviceJSON) {
        super(deviceJSON)
        const { x, y } = getXY(deviceJSON)
        this.element = new XorGate(x, y, undefined, undefined, undefined, this.bitWidth)
        this.input  = [this.element.inp[0], this.element.inp[1]]
        this.output = this.element.output1
    }
}

class verilogXnorGate extends verilogBinaryGate {
    constructor(deviceJSON) {
        super(deviceJSON)
        const { x, y } = getXY(deviceJSON)
        this.element = new XnorGate(x, y, undefined, undefined, undefined, this.bitWidth)
        this.input  = [this.element.inp[0], this.element.inp[1]]
        this.output = this.element.output1
    }
}

class verilogMathGate extends verilogBinaryGate {
    constructor(deviceJSON, includeOutBitWidth) {
        super(deviceJSON)
        this.bitWidth = Math.max(deviceJSON['bits']['in1'], deviceJSON['bits']['in2'])
        if (includeOutBitWidth) {
            this.bitWidth = Math.max(deviceJSON['bits']['out'], this.bitWidth)
        }
        if (!Number.isInteger(deviceJSON['bits'])) {
            this.in1BitWidth = deviceJSON['bits']['in1']
            this.in2BitWidth = deviceJSON['bits']['in2']
        }
        const { x, y } = getXY(deviceJSON)
        this._layoutX = x
        this._layoutY = y
        this.input = []
        var extraBits = this.bitWidth - this.in1BitWidth
        if (extraBits != 0) {
            this.in1Splitter = new Splitter(x, y, undefined, undefined, this.bitWidth, [this.in1BitWidth, extraBits])
            var zeroState = ''
            for (var i = 0; i < extraBits; i++) zeroState += '0'
            this.in1ZeroConstant = new ConstantVal(x, y - 30, undefined, undefined, extraBits, zeroState)
            this.in1ZeroConstant.output1.connect(this.in1Splitter.outputs[1])
        } else {
            this.in1Splitter = new Splitter(x, y, undefined, undefined, this.bitWidth, [this.bitWidth])
        }
        var extraBits2 = this.bitWidth - this.in2BitWidth
        if (extraBits2 != 0) {
            this.in2Splitter = new Splitter(x, y + 30, undefined, undefined, this.bitWidth, [this.in2BitWidth, extraBits2])
            var zeroState2 = ''
            for (var i = 0; i < extraBits2; i++) zeroState2 += '0'
            this.in2ZeroConstant = new ConstantVal(x, y + 60, undefined, undefined, extraBits2, zeroState2)
            this.in2ZeroConstant.output1.connect(this.in2Splitter.outputs[1])
        } else {
            this.in2Splitter = new Splitter(x, y + 30, undefined, undefined, this.bitWidth, [this.bitWidth])
        }
        this.input = [this.in1Splitter.outputs[0], this.in2Splitter.outputs[0]]
    }
}

class verilogEqGate extends verilogMathGate {
    constructor(deviceJSON) {
        super(deviceJSON, false)
        const { x, y } = getXY(deviceJSON)
        var bitWidthSplit = []
        for (var i = 0; i < this.bitWidth; i++) bitWidthSplit.push(1)
        this.xnorGate = new XnorGate(x + 60, y, undefined, undefined, undefined, this.bitWidth)
        this.splitter  = new Splitter(x + 120, y, undefined, undefined, this.bitWidth, bitWidthSplit)
        this.andGate   = new AndGate(x + 180, y, undefined, undefined, this.bitWidth)
        this.in1Splitter.inp1.connect(this.xnorGate.inp[0])
        this.in2Splitter.inp1.connect(this.xnorGate.inp[1])
        this.xnorGate.output1.connect(this.splitter.inp1)
        for (var i = 0; i < this.bitWidth; i++) this.splitter.outputs[i].connect(this.andGate.inp[i])
        this.output = this.andGate.output1
    }
}

class verilogNeGate extends verilogMathGate {
    constructor(deviceJSON) {
        super(deviceJSON, false)
        const { x, y } = getXY(deviceJSON)
        var bitWidthSplit = []
        for (var i = 0; i < this.bitWidth; i++) bitWidthSplit.push(1)
        this.xnorGate = new XnorGate(x + 60, y, undefined, undefined, undefined, this.bitWidth)
        this.splitter  = new Splitter(x + 120, y, undefined, undefined, this.bitWidth, bitWidthSplit)
        this.nandGate  = new NandGate(x + 180, y, undefined, undefined, this.bitWidth)
        this.in1Splitter.inp1.connect(this.xnorGate.inp[0])
        this.in2Splitter.inp1.connect(this.xnorGate.inp[1])
        this.xnorGate.output1.connect(this.splitter.inp1)
        for (var i = 0; i < this.bitWidth; i++) this.splitter.outputs[i].connect(this.nandGate.inp[i])
        this.output = this.nandGate.output1
    }
}

class verilogLtGate extends verilogMathGate {
    constructor(deviceJSON) {
        super(deviceJSON, false)
        const { x, y } = getXY(deviceJSON)
        this.constant7 = new ConstantVal(x, y - 30, undefined, undefined, 3, '111')
        this.alu       = new ALU(x + 60, y, undefined, undefined, this.bitWidth)
        this.splitter  = new Splitter(x + 120, y, undefined, undefined, this.bitWidth, [1])
        this.in1Splitter.inp1.connect(this.alu.inp1)
        this.in2Splitter.inp1.connect(this.alu.inp2)
        this.constant7.output1.connect(this.alu.controlSignalInput)
        this.alu.output.connect(this.splitter.inp1)
        this.output = this.splitter.outputs[0]
    }
}

class verilogGtGate extends verilogMathGate {
    constructor(deviceJSON) {
        super(deviceJSON, false)
        const { x, y } = getXY(deviceJSON)
        this.constant7 = new ConstantVal(x, y - 30, undefined, undefined, 3, '111')
        this.alu       = new ALU(x + 60, y, undefined, undefined, this.bitWidth)
        this.splitter  = new Splitter(x + 120, y, undefined, undefined, this.bitWidth, [1])
        this.in1Splitter.inp1.connect(this.alu.inp1)
        this.in2Splitter.inp1.connect(this.alu.inp2)
        this.constant7.output1.connect(this.alu.controlSignalInput)
        this.alu.output.connect(this.splitter.inp1)
        this.output = this.splitter.outputs[0]
    }
}

class verilogGeGate extends verilogMathGate {
    constructor(deviceJSON) {
        super(deviceJSON, false)
        const { x, y } = getXY(deviceJSON)
        this.constant7 = new ConstantVal(x, y - 30, undefined, undefined, 3, '111')
        this.alu       = new ALU(x + 60, y, undefined, undefined, this.bitWidth)
        this.splitter  = new Splitter(x + 120, y, undefined, undefined, this.bitWidth, [1])
        this.notGate   = new NotGate(x + 180, y)
        this.in1Splitter.inp1.connect(this.alu.inp1)
        this.in2Splitter.inp1.connect(this.alu.inp2)
        this.constant7.output1.connect(this.alu.controlSignalInput)
        this.alu.output.connect(this.splitter.inp1)
        this.splitter.outputs[0].connect(this.notGate.inp1)
        this.output = this.notGate.output1
    }
}

class verilogLeGate extends verilogMathGate {
    constructor(deviceJSON) {
        super(deviceJSON, false)
        const { x, y } = getXY(deviceJSON)
        this.constant7 = new ConstantVal(x, y - 30, undefined, undefined, 3, '111')
        this.alu       = new ALU(x + 60, y, undefined, undefined, this.bitWidth)
        this.splitter  = new Splitter(x + 120, y, undefined, undefined, this.bitWidth, [1])
        this.notGate   = new NotGate(x + 180, y)
        this.in1Splitter.inp1.connect(this.alu.inp1)
        this.in2Splitter.inp1.connect(this.alu.inp2)
        this.constant7.output1.connect(this.alu.controlSignalInput)
        this.alu.output.connect(this.splitter.inp1)
        this.splitter.outputs[0].connect(this.notGate.inp1)
        this.output = this.notGate.output1
    }
}

class verilogAdditionGate extends verilogMathGate {
    constructor(deviceJSON) {
        super(deviceJSON, false)
        const { x, y } = getXY(deviceJSON)
        this.outBitWidth = deviceJSON['bits']['out']
        this.adder = new Adder(x + 60, y, undefined, undefined, this.bitWidth)
        this.in1Splitter.inp1.connect(this.adder.inpA)
        this.in2Splitter.inp1.connect(this.adder.inpB)
        if (this.outBitWidth == this.bitWidth) {
            this.output = this.adder.sum
        } else if (this.outBitWidth == this.bitWidth + 1) {
            this.outputSplitter = new Splitter(x + 120, y, undefined, undefined, this.outBitWidth, [this.bitWidth, 1])
            this.adder.sum.connect(this.outputSplitter.outputs[0])
            this.adder.carryOut.connect(this.outputSplitter.outputs[1])
            this.output = this.outputSplitter.inp1
        }
    }
}

class verilogMultiplicationGate extends verilogMathGate {
    constructor(deviceJSON) {
        super(deviceJSON)
        const { x, y } = getXY(deviceJSON)
        this.outBitWidth = deviceJSON['bits']['out']
        this.verilogMultiplier = new verilogMultiplier(x + 60, y, undefined, undefined, this.bitWidth, this.outBitWidth)
        this.in1Splitter.inp1.connect(this.verilogMultiplier.inpA)
        this.in2Splitter.inp1.connect(this.verilogMultiplier.inpB)
        this.output = this.verilogMultiplier.product
    }
}

class verilogDivisionGate extends verilogMathGate {
    constructor(deviceJSON) {
        super(deviceJSON)
        const { x, y } = getXY(deviceJSON)
        this.outBitWidth = deviceJSON['bits']['out']
        this.verilogDivider = new verilogDivider(x + 60, y, undefined, undefined, this.bitWidth, this.outBitWidth)
        this.in1Splitter.inp1.connect(this.verilogDivider.inpA)
        this.in2Splitter.inp1.connect(this.verilogDivider.inpB)
        this.output = this.verilogDivider.quotient
    }
}

class verilogPowerGate extends verilogMathGate {
    constructor(deviceJSON) {
        super(deviceJSON)
        const { x, y } = getXY(deviceJSON)
        this.outBitWidth = deviceJSON['bits']['out']
        this.verilogPower = new verilogPower(x + 60, y, undefined, undefined, this.bitWidth, this.outBitWidth)
        this.in1Splitter.inp1.connect(this.verilogPower.inpA)
        this.in2Splitter.inp1.connect(this.verilogPower.inpB)
        this.output = this.verilogPower.answer
    }
}

class verilogModuloGate extends verilogMathGate {
    constructor(deviceJSON) {
        super(deviceJSON)
        const { x, y } = getXY(deviceJSON)
        this.outBitWidth = deviceJSON['bits']['out']
        this.verilogDivider = new verilogDivider(x + 60, y, undefined, undefined, this.bitWidth, this.outBitWidth)
        this.in1Splitter.inp1.connect(this.verilogDivider.inpA)
        this.in2Splitter.inp1.connect(this.verilogDivider.inpB)
        this.output = this.verilogDivider.remainder
    }
}

class verilogShiftLeftGate extends verilogMathGate {
    constructor(deviceJSON) {
        super(deviceJSON)
        const { x, y } = getXY(deviceJSON)
        this.outBitWidth = deviceJSON['bits']['out']
        this.verilogShiftLeft = new verilogShiftLeft(x + 60, y, undefined, undefined, this.bitWidth, this.outBitWidth)
        this.in1Splitter.inp1.connect(this.verilogShiftLeft.inp1)
        this.in2Splitter.inp1.connect(this.verilogShiftLeft.shiftInp)
        this.output = this.verilogShiftLeft.output1
    }
}

class verilogShiftRightGate extends verilogMathGate {
    constructor(deviceJSON) {
        super(deviceJSON)
        const { x, y } = getXY(deviceJSON)
        this.outBitWidth = deviceJSON['bits']['out']
        this.verilogShiftRight = new verilogShiftRight(x + 60, y, undefined, undefined, this.bitWidth, this.outBitWidth)
        this.in1Splitter.inp1.connect(this.verilogShiftRight.inp1)
        this.in2Splitter.inp1.connect(this.verilogShiftRight.shiftInp)
        this.output = this.verilogShiftRight.output1
    }
}

class verilogSubtractionGate extends verilogMathGate {
    constructor(deviceJSON) {
        super(deviceJSON, true)
        const { x, y } = getXY(deviceJSON)
        this.alu = new ALU(x + 60, y, undefined, undefined, this.bitWidth)
        this.controlConstant = new ConstantVal(x, y - 30, undefined, undefined, 3, '110')
        this.alu.controlSignalInput.connect(this.controlConstant.output1)
        this.in1Splitter.inp1.connect(this.alu.inp1)
        this.in2Splitter.inp1.connect(this.alu.inp2)
        this.output = this.alu.output
    }
}

class verilogDff {
    constructor(deviceJSON) {
        const { x, y } = getXY(deviceJSON)

        this.bitWidth = 1
        if (deviceJSON['bits']) {
            this.bitWidth = getBitWidth(deviceJSON['bits'])
        }

        this.dff = new DflipFlop(x, y, undefined, undefined, this.bitWidth)
        this.clockInput  = this.dff.clockInp
        this.arstInput   = this.dff.reset
        this.enableInput = this.dff.en

        this.clockPolarity  = true
        this.arstPolarity   = true
        this.enablePolarity = true

        // ── FIXED: polarity field may be missing entirely ──────────────
        const polarity = deviceJSON['polarity'] || {}

        if (polarity['clock'] != undefined) {
            this.clockPolarity = polarity['clock']
        }
        if (this.clockPolarity == false) {
            this.notGateClock = new NotGate(x - 40, y)
            this.notGateClock.output1.connect(this.dff.clockInp)
            this.clockInput = this.notGateClock.inp1
        }

        if (polarity['enable'] != undefined) {
            this.enablePolarity = polarity['enable']
        }
        if (this.enablePolarity == false) {
            this.notGateEnable = new NotGate(x - 40, y + 20)
            this.notGateEnable.output1.connect(this.dff.en)
            this.enableInput = this.notGateEnable.inp1
        }

        if (polarity['arst'] != undefined) {
            this.arstPolarity = polarity['arst']
        }
        if (this.arstPolarity == false) {
            this.notGateArst = new NotGate(x - 40, y + 40)
            this.notGateArst.output1.connect(this.dff.reset)
            this.arstInput = this.notGateArst.inp1
        }
        if (deviceJSON['arst_value'] != undefined) {
            this.arst_value_constant = new ConstantVal(
                x, y - 30, undefined, undefined,
                this.bitWidth, deviceJSON['arst_value']
            )
            this.arst_value_constant.output1.connect(this.dff.preset)
        }

        this.dInput  = this.dff.dInp
        this.qOutput = this.dff.qOutput
    }

    getPort(portName) {
        if (portName == 'clk')  return this.clockInput
        if (portName == 'in')   return this.dInput
        if (portName == 'arst') return this.arstInput
        if (portName == 'en')   return this.enableInput
        if (portName == 'out')  return this.qOutput
        console.warn('[VerilogClasses] Dff: unknown port "' + portName + '"')
        return undefined
    }
}

class verilogMultiplexer {
    constructor(deviceJSON) {
        const { x, y } = getXY(deviceJSON)
        this.bitWidth = 1
        this.selectBitWidth = undefined
        if (deviceJSON['bits']['in'] != undefined) this.bitWidth = deviceJSON['bits']['in']
        if (deviceJSON['bits']['sel'] != undefined) this.selectBitWidth = deviceJSON['bits']['sel']
        this.multiplexer = new Multiplexer(x, y, undefined, undefined, this.bitWidth, this.selectBitWidth)
        this.input       = this.multiplexer.inp
        this.selectInput = this.multiplexer.controlSignalInput
        this.output      = this.multiplexer.output1
    }

    getPort(portName) {
        if (portName == 'sel') return this.selectInput
        if (portName == 'out') return this.output
        var index = parseInt(portName.substring(2))
        if (!isNaN(index)) return this.input[index]
        console.warn('[VerilogClasses] Mux: unknown port "' + portName + '"')
        return undefined
    }
}

class verilogMultiplexer1Hot {
    constructor(deviceJSON) {
        const { x, y } = getXY(deviceJSON)
        this.bitWidth = 1
        this.selectBitWidth = undefined
        if (deviceJSON['bits']['in'] != undefined) this.bitWidth = deviceJSON['bits']['in']
        if (deviceJSON['bits']['sel'] != undefined) this.selectBitWidth = deviceJSON['bits']['sel']
        this.multiplexer = new Multiplexer(x, y, undefined, undefined, this.bitWidth, this.selectBitWidth)
        this.lsb   = new LSB(x - 60, y, undefined, undefined, this.selectBitWidth)
        this.adder = new Adder(x - 30, y, undefined, undefined, this.selectBitWidth)
        var zeroState = ''
        for (var i = 0; i < this.selectBitWidth - 1; i++) zeroState += '0'
        this.zeroPadEnable  = new ConstantVal(x - 60, y - 30, undefined, undefined, this.selectBitWidth - 1, zeroState)
        this.enbaleSplitter = new Splitter(x - 60, y + 30, undefined, undefined, this.selectBitWidth, [1, this.selectBitWidth - 1])
        this.lsb.enable.connect(this.enbaleSplitter.outputs[0])
        this.zeroPadEnable.output1.connect(this.enbaleSplitter.outputs[1])
        this.adder.inpA.connect(this.lsb.output1)
        this.adder.inpB.connect(this.enbaleSplitter.inp1)
        this.adder.sum.connect(this.multiplexer.controlSignalInput)
        this.input       = this.multiplexer.inp
        this.selectInput = this.lsb.inp1
        this.output      = this.multiplexer.output1
    }

    getPort(portName) {
        if (portName == 'sel') return this.selectInput
        if (portName == 'out') return this.output
        var index = parseInt(portName.substring(2))
        if (!isNaN(index)) return this.input[index]
        console.warn('[VerilogClasses] Mux1Hot: unknown port "' + portName + '"')
        return undefined
    }
}

class verilogBusGroup {
    constructor(deviceJSON) {
        const { x, y } = getXY(deviceJSON)
        this.bitWidth      = 0
        this.bitWidthSplit = deviceJSON['groups']
        for (var i = 0; i < this.bitWidthSplit.length; i++) this.bitWidth += this.bitWidthSplit[i]
        this.splitter = new Splitter(x, y, undefined, undefined, this.bitWidth, this.bitWidthSplit)
        this.input  = this.splitter.outputs
        this.output = this.splitter.inp1
    }

    getPort(portName) {
        if (portName == 'out') return this.output
        var index = parseInt(portName.substring(2))
        if (!isNaN(index)) return this.input[index]
        console.warn('[VerilogClasses] BusGroup: unknown port "' + portName + '"')
        return undefined
    }
}

class verilogBusUngroup {
    constructor(deviceJSON) {
        const { x, y } = getXY(deviceJSON)
        this.bitWidth      = 0
        this.bitWidthSplit = deviceJSON['groups']
        for (var i = 0; i < this.bitWidthSplit.length; i++) this.bitWidth += this.bitWidthSplit[i]
        this.splitter = new Splitter(x, y, undefined, undefined, this.bitWidth, this.bitWidthSplit)
        this.input  = this.splitter.inp1
        this.output = this.splitter.outputs
    }

    getPort(portName) {
        if (portName == 'in') return this.input
        var index = parseInt(portName.substring(3))
        if (!isNaN(index)) return this.output[index]
        console.warn('[VerilogClasses] BusUngroup: unknown port "' + portName + '"')
        return undefined
    }
}

class verilogMemory {
    constructor(deviceJSON) {
        const { x, y } = getXY(deviceJSON)
        this.memData         = deviceJSON['memdata']
        this.dataBitWidth    = deviceJSON['bits']
        this.addressBitWidth = deviceJSON['abits']
        this.words           = deviceJSON['words']
        this.numRead         = deviceJSON['rdports'].length
        this.numWrite        = deviceJSON['wrports'].length
        this.verilogRAM = new verilogRAM(
            x, y, undefined, undefined,
            this.dataBitWidth, this.addressBitWidth,
            this.memData, this.words,
            this.numRead, this.numWrite,
            deviceJSON['rdports'], deviceJSON['wrports']
        )
        this.writeAddressInput = this.verilogRAM.writeAddress
        this.readAddressInput  = this.verilogRAM.readAddress
        this.writeDataInput    = this.verilogRAM.writeDataIn
        this.writeEnableInput  = this.verilogRAM.writeEnable
        this.readDataOutput    = this.verilogRAM.dataOut
        this.readDffOut        = this.verilogRAM.readDff
        for (var i = 0; i < this.numWrite; i++) {
            var writeEnInput = new Input(x, y + 30 * (i + 1), undefined, undefined, 1, undefined)
            writeEnInput.label = 'en' + i.toString()
            writeEnInput.output1.connect(this.verilogRAM.writeEnable[i])
        }
    }

    getPort(portName) {
        var len        = portName.length
        var isPortAddr = portName.slice(len - 4, len) == 'addr'
        var isPortData = portName.slice(len - 4, len) == 'data'
        var isPortClk  = portName.slice(len - 3, len) == 'clk'
        var isPortEn   = portName.slice(len - 2, len) == 'en'
        if (portName.startsWith('rd')) {
            if (isPortAddr) return this.readAddressInput[parseInt(portName.slice(2, len - 4))]
            if (isPortData) return this.verilogRAM.readDffQOutput[parseInt(portName.slice(2, len - 4))]
            if (isPortClk)  return this.verilogRAM.readDffClock[parseInt(portName.slice(2, len - 3))]
            if (isPortEn)   return this.verilogRAM.readDffEn[parseInt(portName.slice(2, len - 2))]
        } else {
            if (isPortAddr) return this.writeAddressInput[parseInt(portName.slice(2, len - 4))]
            if (isPortData) return this.writeDataInput[parseInt(portName.slice(2, len - 4))]
            if (isPortClk)  return this.verilogRAM.writeDffClock[parseInt(portName.slice(2, len - 3))]
            if (isPortEn)   return this.verilogRAM.writeDffEn[parseInt(portName.slice(2, len - 2))]
        }
        console.warn('[VerilogClasses] Memory: unknown port "' + portName + '"')
        return undefined
    }
}

// ─── Type map ─────────────────────────────────────────────────────────────────

let yosysTypeMap = {}

yosysTypeMap['Not']            = verilogNotGate
yosysTypeMap['Repeater']       = verilogRepeaterGate
yosysTypeMap['And']            = verilogAndGate
yosysTypeMap['Nand']           = verilogNandGate
yosysTypeMap['Or']             = verilogOrGate
yosysTypeMap['Nor']            = verilogNorGate
yosysTypeMap['Xor']            = verilogXorGate
yosysTypeMap['Xnor']           = verilogXnorGate
yosysTypeMap['Constant']       = verilogConstantVal
yosysTypeMap['Input']          = verilogInput
yosysTypeMap['Output']         = verilogOutput
yosysTypeMap['AndReduce']      = verilogReduceAndGate
yosysTypeMap['NandReduce']     = verilogReduceNandGate
yosysTypeMap['OrReduce']       = verilogReduceOrGate
yosysTypeMap['NorReduce']      = verilogReduceNorGate
yosysTypeMap['XorReduce']      = verilogReduceXorGate
yosysTypeMap['XnorReduce']     = verilogReduceXnorGate
yosysTypeMap['Eq']             = verilogEqGate
yosysTypeMap['Ne']             = verilogNeGate
yosysTypeMap['Lt']             = verilogLtGate
yosysTypeMap['Le']             = verilogLeGate
yosysTypeMap['Ge']             = verilogGeGate
yosysTypeMap['Gt']             = verilogGtGate
yosysTypeMap['ZeroExtend']     = verilogZeroExtend
yosysTypeMap['Negation']       = verilogNegationGate
yosysTypeMap['Dff']            = verilogDff
yosysTypeMap['Mux']            = verilogMultiplexer
yosysTypeMap['Mux1Hot']        = verilogMultiplexer1Hot
yosysTypeMap['BusSlice']       = verilogBusSlice
yosysTypeMap['BusGroup']       = verilogBusGroup
yosysTypeMap['BusUngroup']     = verilogBusUngroup
yosysTypeMap['Addition']       = verilogAdditionGate
yosysTypeMap['Subtraction']    = verilogSubtractionGate
yosysTypeMap['Multiplication'] = verilogMultiplicationGate
yosysTypeMap['Division']       = verilogDivisionGate
yosysTypeMap['Modulo']         = verilogModuloGate
yosysTypeMap['Power']          = verilogPowerGate
yosysTypeMap['ShiftLeft']      = verilogShiftLeftGate
yosysTypeMap['ShiftRight']     = verilogShiftRightGate
yosysTypeMap['Clock']          = verilogClock
yosysTypeMap['Lamp']           = verilogLamp
yosysTypeMap['Button']         = verilogButton
yosysTypeMap['Memory']         = verilogMemory

export default yosysTypeMap