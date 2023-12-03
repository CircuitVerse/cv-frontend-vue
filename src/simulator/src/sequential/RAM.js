import CircuitElement from '../circuitElement';
import Node, {findNode} from '../node';
import simulationArea from '../simulationArea';
import {correctWidth, fillText2, fillText4, drawCircle2} from '../canvasApi';
import {parseNumber, showMessage} from '../utils';
import {showError} from '../utils';
/**
 * RAM Component.
 * @extends CircuitElement
 * @param {number} x - x coord of element
 * @param {number} y - y coord of element
 * @param {Scope} scope - the circuit in which we want the Element
 * @param {string} dir - direction in which element has to drawn
 *
 * Two settings are available:
 * - addressWidth: 1 to 20, default=10. Controls the width of the address input.
 * - bitWidth: 1 to 32, default=8. Controls the width of data pins.
 *
 * Amount of memory in the element is 2^addressWidth x bitWidth bits.
 * Minimum RAM size is: 2^1  x  1 = 2 bits.
 * Maximum RAM size is: 2^20 x 32 = 1M x 32 bits => 32 Mbits => 4MB.
 * Maximum 8-bits size: 2^20 x  8 = 1M x 8 bits => 1MB.
 * Default RAM size is: 2^10 x  8 = 1024 bytes => 1KB.
 *
 * RAMs are volatile therefore this component does not persist the memory
 * contents.
 *
 * Changes to addressWidth and bitWidth also cause data to be lost.
 * Think of these operations as being equivalent to taking a piece of RAM out
 * of a circuit board and replacing it with another RAM of different size.
 *
 * The contents of the RAM can be reset to zero by setting the RESET pin 1 or
 * or by selecting the component and pressing the "Reset" button in the
 * properties window.
 *
 * The contents of the RAM can be dumped to the console by transitioning CORE
 * DUMP pin to 1 or by selecting the component and pressing the "Core Dump"
 * button in the properties window.
 * Address spaces that have not been written will show up as `undefined` in
 * the core dump.
 *
 * NOTE: The maximum address width of 20 is arbitrary.
 * Larger values are possible, but in practice circuits won't need this much
 * memory and keeping the value small helps avoid allocating too much memory
 * on the browser.
 * Internally we use a sparse array, so only the addresses that are written
 * are actually allocated. Nevertheless, it is better to prevent large
 * allocations from happening by keeping the max addressWidth small. If
 * needed, we can increase the max.
 * @category sequential
 */
export default class RAM extends CircuitElement {
  /**
   * @param {number} x - x coord of element
   * @param {number} y - y coord of element
   * @param {Scope} scope - the circuit in which we want the Element
   * @param {string} dir - direction in which element has to drawn
   * @param {*} bitWidth - bitwidth of the RAM.
   * @param {*} addressWidth - address width.
   */
  constructor(
      x,
      y,
      scope = globalScope,
      dir = 'RIGHT',
      bitWidth = 8,
      addressWidth = 10,
  ) {
    super(x, y, scope, dir, Math.min(Math.max(1, bitWidth), 32));
    this.setDimensions(60, 40);

    this.directionFixed = true;
    this.labelDirection = 'UP';

    this.addressWidth = Math.min(
        Math.max(1, addressWidth),
        this.maxAddressWidth,
    );
    this.address = new Node(
        -this.leftDimensionX,
        -20,
        0,
        this,
        this.addressWidth,
        'ADDRESS',
    );
    this.dataIn = new Node(
        -this.leftDimensionX,
        0,
        0,
        this,
        this.bitWidth,
        'DATA IN',
    );
    this.write = new Node(-this.leftDimensionX, 20, 0, this, 1, 'WRITE');
    this.reset = new Node(0, this.downDimensionY, 0, this, 1, 'RESET');
    this.coreDump = new Node(
        -20,
        this.downDimensionY,
        0,
        this,
        1,
        'CORE DUMP',
    );
    this.dataOut = new Node(
        this.rightDimensionX,
        0,
        1,
        this,
        this.bitWidth,
        'DATA OUT',
    );
    this.prevCoreDumpValue = undefined;

    this.clearData();
  }

  /**
   * @memberof Ram
   * Create save JSON data of object.
   * @return {JSON}
   */
  customSave() {
    return {
      // NOTE: data is not persisted since RAMs are volatile.
      constructorParamaters: [
        this.direction,
        this.bitWidth,
        this.addressWidth,
      ],
      nodes: {
        address: findNode(this.address),
        dataIn: findNode(this.dataIn),
        write: findNode(this.write),
        reset: findNode(this.reset),
        coreDump: findNode(this.coreDump),
        dataOut: findNode(this.dataOut),
      },
    };
  }

  newBitWidth(value) {
    value = parseInt(value);
    if (
      !isNaN(value) &&
      this.bitWidth != value &&
      value >= 1 &&
      value <= 32
    ) {
      this.bitWidth = value;
      this.dataIn.bitWidth = value;
      this.dataOut.bitWidth = value;
      this.clearData();
    }
  }
  /**
   *
   * @param {*} value
   */
  changeAddressWidth(value) {
    value = parseInt(value);
    if (
      !isNaN(value) &&
      this.addressWidth != value &&
      value >= 1 &&
      value <= this.maxAddressWidth
    ) {
      this.addressWidth = value;
      this.address.bitWidth = value;
      this.clearData();
    }
  }

  clearData() {
    this.data = new Array(Math.pow(2, this.addressWidth));
    this.tooltipText = `${this.memSizeString()} ${this.shortName}`;
  }

  isResolvable() {
    return (
      this.address.value !== undefined ||
      this.reset.value !== undefined ||
      this.coreDump.value !== undefined
    );
  }

  resolve() {
    if (this.write.value == 1) {
      this.data[this.address.value] = this.dataIn.value;
    }

    if (this.reset.value == 1) {
      this.clearData();
    }

    if (
      this.coreDump.value &&
      this.prevCoreDumpValue != this.coreDump.value
    ) {
      this.dump();
    }
    this.prevCoreDumpValue = this.coreDump.value;

    this.dataOut.value = this.data[this.address.value] || 0;
    simulationArea.simulationQueue.add(this.dataOut);
  }

  /**
   *
   */
  customDraw() {
    const ctx = simulationArea.context;
    //
    const xx = this.x;
    const yy = this.y;

    ctx.beginPath();
    ctx.strokeStyle = 'gray';
    ctx.fillStyle = this.write.value ? 'red' : 'lightgreen';
    ctx.lineWidth = correctWidth(1);
    drawCircle2(ctx, 50, -30, 3, xx, yy, this.direction);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.textAlign = 'center';
    ctx.fillStyle = 'black';
    fillText4(ctx, this.memSizeString(), 0, -10, xx, yy, this.direction, 12);
    fillText4(ctx, this.shortName, 0, 10, xx, yy, this.direction, 12);
    fillText2(
        ctx,
        'A',
        this.address.x + 12,
        this.address.y,
        xx,
        yy,
        this.direction,
    );
    fillText2(
        ctx,
        'DI',
        this.dataIn.x + 12,
        this.dataIn.y,
        xx,
        yy,
        this.direction,
    );
    fillText2(
        ctx,
        'W',
        this.write.x + 12,
        this.write.y,
        xx,
        yy,
        this.direction,
    );
    fillText2(
        ctx,
        'DO',
        this.dataOut.x - 15,
        this.dataOut.y,
        xx,
        yy,
        this.direction,
    );
    ctx.fill();
  }

  memSizeString() {
    const mag = ['', 'K', 'M'];
    const unit =
      this.bitWidth == 8 ?
        'B' :
        this.bitWidth == 1 ?
          'b' :
          ` x ${this.bitWidth}b`;
    let v = Math.pow(2, this.addressWidth);
    let m = 0;
    while (v >= 1024 && m < mag.length - 1) {
      v /= 1024;
      m++;
    }
    return v + mag[m] + unit;
  }

  dump() {
    const logLabel = console.group && this.label;
    if (logLabel) {
      console.group(this.label);
    }

    showMessage('Data dumped to developer Console');
    if (logLabel) {
      console.groupEnd();
    }
  }

  dblclick() {
    this.promptData();
  }

  promptData() {
    let data = prompt(
        'Enter Data (separated by space, comma, tab or newline) (data can be in hex, binary, octal or decimal)',
    );
    if (!data) {
      showError('No data entered.');
      return;
    }
    const oldData = this.data;
    try {
      const ramSize = 1 << this.addressWidth;
      const maxNumber = 1 << this.bitWidth;
      this.clearData();

      data = data.split(/[, \n\t]/);
      data = data.filter((x) => x.length);
      if (data.length > ramSize) {
        throw new Error(`Capacity: ${ramSize}. But ${data.length} data cells found`);
      }

      for (let i = 0; i < data.length; i++) {
        const dataCell = parseNumber(data[i]);
        if (isNaN(dataCell)) {
          throw new Error(`Address ${i}: ${data[i]} is not a number`);
        }
        if (dataCell < 0) throw new Error(`Address ${i}: ${data[i]} is negative`);
        if (dataCell >= maxNumber) {
          throw new Error(`Address ${i}: ${data[i]} is too large`);
        }
        this.data[i] = dataCell;
      }
      showMessage(`${data.length} data cells loaded`);
    } catch (e) {
      this.data = oldData;
      showError(e);
    }
  }

  /**
   * This is a RAM without a clock - not normal
   * reset is not supported
   * @return {string} representing the Verilog.
   */
  static moduleVerilog() {
    return `
    module RAM(dout, addr, din, we, dmp, rst);
        parameter WIDTH = 8;
        parameter ADDR = 10;
        output [WIDTH-1:0] dout;
        input [ADDR-1:0] addr;
        input [WIDTH-1:0] din;
        input we;
        input dmp;
        input rst;
        reg [WIDTH-1:0] mem [2**ADDR-1:0];
    
        assign dout = mem[addr];
    
        always @ (*) begin
        if (!we)
            mem[addr] = din;
        end
    endmodule
    `;
  }
}

RAM.prototype.tooltipText = 'Random Access Memory';
RAM.prototype.shortName = 'RAM';
RAM.prototype.maxAddressWidth = 20;
RAM.prototype.mutableProperties = {
  addressWidth: {
    name: 'Address Width',
    type: 'number',
    max: '20',
    min: '1',
    func: 'changeAddressWidth',
  },
  dump: {
    name: 'Core Dump',
    type: 'button',
    func: 'dump',
  },
  load: {
    name: 'Load Data',
    type: 'button',
    func: 'promptData',
  },
  reset: {
    name: 'Reset',
    type: 'button',
    func: 'clearData',
  },
};
RAM.prototype.objectType = 'RAM';
