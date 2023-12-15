import {CircuitElement} from '../circuit_element';
import {Node, findNode} from '../node';
import {simulationArea} from '../simulation_area';
import {correctWidth, fillText2, fillText4, drawCircle2} from '../canvasApi';

function customResolve(
    clockInp,
    dInp,
    qOutput,
    en,
    masterState,
    slaveState,
    prevClockState,
    clock_polarity,
    enable_polarity,
    numIterations,
) {
  for (let i = 0; i < numIterations; i++) {
    if (clock_polarity[i] != undefined) {
      clock_polarity[i] == true ? 1 : 0;
    }

    if (enable_polarity[i] != undefined) {
      enable_polarity[i] == true ? 1 : 0;
    }

    if (clock_polarity[i] == undefined && enable_polarity[i] == undefined) {
      if (dInp[i].value != undefined) {
        qOutput[i].value = dInp[i].value;
        simulationArea.simulationQueue.add(qOutput[i]);
      }
    } else if (
      clock_polarity[i] == undefined &&
      enable_polarity[i] != undefined
    ) {
      if (
        (en_value[i] == undefined ||
          en[i].value == enable_polarity[i]) &&
        dInp[i].value != undefined
      ) {
        qOutput[i].value = dInp[i].value;
        simulationArea.simulationQueue.add(qOutput[i]);
      }
    } else if (
      clock_polarity[i] != undefined &&
      enable_polarity[i] == undefined
    ) {
      if (clockInp[i].value == prevClockState[i]) {
        if (clockInp[i].value == 0 && dInp[i].value != undefined) {
          masterState[i] = dInp[i].value;
        }
      } else if (clockInp[i].value != undefined) {
        if (clockInp[i].value == 1) {
          slaveState[i] = masterState[i];
        } else if (
          clockInp[i].value == 0 &&
          dInp[i].value != undefined
        ) {
          masterState[i] = dInp[i].value;
        }
        prevClockState[i] = clockInp[i].value;
      }

      if (qOutput[i].value != slaveState[i]) {
        qOutput[i].value = slaveState[i];
        simulationArea.simulationQueue.add(qOutput[i]);
      }
    } else {
      if (en[i].value == 0) {
        prevClockState[i] = clockInp[i].value;
      } else if (en[i].value == 1 || en[i].connections.length == 0) {
        // if(en.value==1) // Creating Infinite Loop, WHY ??
        if (clockInp[i].value == prevClockState[i]) {
          if (clockInp[i].value == 0 && dInp[i].value != undefined) {
            masterState[i] = dInp[i].value;
          }
        } else if (clockInp[i].value != undefined) {
          if (clockInp[i].value == 1) {
            slaveState[i] = masterState[i];
          } else if (
            clockInp[i].value == 0 &&
            dInp[i].value != undefined
          ) {
            masterState[i] = dInp[i].value;
          }
          prevClockState[i] = clockInp[i].value;
        }
      }

      if (qOutput[i].value != slaveState[i]) {
        qOutput[i].value = slaveState[i];
        simulationArea.simulationQueue.add(qOutput[i]);
      }
    }
  }
}

/**
 * verilogRAM Component.
 * @extends CircuitElement
 * @param {*} clockInp
 * @param {*} dInp
 * @param {*} qOutput
 * @param {*} en
 * @param {*} masterState
 * @param {*} slaveState
 * @param {*} prevClockState
 * @param {*} clock_polarity
 * @param {*} enable_polarity
 * @param {*} numIterations
 *
 * Two settings are available:
 * - addressWidth: 1 to 20, default=10. Controls the width of the address input.
 * - bitWidth: 1 to 32, default=8. Controls the width of data pins.
 *
 * Amount of memory in the element is 2^addressWidth x bitWidth bits.
 * Minimum verilogRAM size is: 2^1  x  1 = 2 bits.
 * Maximum verilogRAM size is: 2^20 x 32 = 1M x 32 bits => 32 Mbits => 4MB.
 * Maximum 8-bits size: 2^20 x  8 = 1M x 8 bits => 1MB.
 * Default verilogRAM size is: 2^10 x  8 = 1024 bytes => 1KB.
 *
 * verilogRAMs are volatile therefore this component does not persist the
 * memory contents.
 *
 * Changes to addressWidth and bitWidth also cause data to be lost.
 * Think of these operations as being equivalent to taking a piece of
 * verilogRAM out of a circuit board and replacing it with another verilogRAM
 * of different size.
 *
 * The contents of the verilogRAM can be reset to zero by setting the RESET pin
 * 1 or by selecting the component and pressing the "Reset" button in the
 * properties window.
 *
 * The contents of the verilogRAM can be dumped to the console by transitioning
 * CORE DUMP pin to 1 or by selecting the component and pressing the "Core Dump"
 * button in the properties window.
 * Address spaces that have not been written will show up as `undefined` in the
 * core dump.
 *
 * NOTE: The maximum address width of 20 is arbitrary.
 * Larger values are possible, but in practice circuits won't need this much
 * memory and keeping the value small helps avoid allocating too much memory on
 * the browser.
 * Internally we use a sparse array, so only the addresses that are written are
 * actually allocated. Nevertheless, it is better to prevent large allocations
 * from happening by keeping the max addressWidth small. If needed, we can
 * increase the max.
 * @category sequential
 */
export class verilogRAM extends CircuitElement {
  /**
   *
   * @param {*} x
   * @param {*} y
   * @param {*} scope
   * @param {*} dir
   * @param {*} bitWidth
   * @param {*} addressWidth
   * @param {*} memData
   * @param {*} words
   * @param {*} numRead
   * @param {*} numWrite
   * @param {*} rdports
   * @param {*} wrports
   */
  constructor(
      x,
      y,
      scope = globalScope,
      dir = 'RIGHT',
      bitWidth = 8,
      addressWidth = 10,
      memData,
      words,
      numRead,
      numWrite,
      rdports,
      wrports,
  ) {
    super(x, y, scope, dir, Math.min(Math.max(1, bitWidth), 32));
    this.setDimensions(60, 40);

    this.directionFixed = true;
    this.labelDirection = 'UP';

    this.addressWidth = Math.min(
        Math.max(1, addressWidth),
        this.maxAddressWidth,
    );

    this.readAddress = [];
    for (let i = 0; i < numRead; i++) {
      this.readAddress.push(
          new Node(
              -this.leftDimensionX,
              -20,
              0,
              this,
              this.addressWidth,
              'READ_ADDRESS' + i.toString(),
          ),
      );
    }

    this.writeAddress = [];
    for (let i = 0; i < numWrite; i++) {
      this.writeAddress.push(
          new Node(
              -this.leftDimensionX,
              -20,
              0,
              this,
              this.addressWidth,
              'WRITE_ADDRESS' + i.toString(),
          ),
      );
    }

    this.writeDataIn = [];
    this.writeEnable = [];

    this.writeDffClock = [];
    this.writeDffDInp = [];
    this.writeDffQOutput = [];
    this.writeDffEn = [];
    this.writeDffMasterState = [];
    this.writeDffSlaveState = [];
    this.writeDffprevClockState = [];
    this.writeDffClockPolarity = [];
    this.writeDffEnPolarity = [];

    for (let i = 0; i < numWrite; i++) {
      const currWriteData = new Node(
          -this.leftDimensionX,
          0,
          0,
          this,
          this.bitWidth,
          'DATA IN' + i.toString(),
      );

      const clockInp = new Node(-20, +10, 0, this, 1, 'Clock');
      const dInp = new Node(-20, -10, 0, this, this.bitWidth, 'D');
      const qOutput = new Node(20, -10, 1, this, this.bitWidth, 'Q');
      const en = new Node(-10, 20, 0, this, 1, 'Enable');
      const masterState = 0;
      const slaveState = 0;
      const prevClockState = 0;
      const clockPolarity = wrports[i]['clock_polarity'];
      let enPolarity = wrports[i]['enable_polarity'];

      if (enPolarity == undefined) {
        enPolarity = true;
      }

      currWriteData.connect(dInp);

      this.writeDffClock.push(clockInp);
      this.writeDffDInp.push(dInp);
      this.writeDffQOutput.push(qOutput);
      this.writeDffEn.push(en);
      this.writeDffMasterState.push(masterState);
      this.writeDffSlaveState.push(slaveState);
      this.writeDffprevClockState.push(prevClockState);
      this.writeDffClockPolarity.push(clockPolarity);
      this.writeDffEnPolarity.push(enPolarity);

      this.writeDataIn.push(currWriteData);
      this.writeEnable.push(
          new Node(
              -this.leftDimensionX,
              20,
              0,
              this,
              1,
              'WRITE_ENABLE' + i.toString(),
          ),
      );
    }

    this.reset = new Node(0, this.downDimensionY, 0, this, 1, 'RESET');
    this.coreDump = new Node(
        -20,
        this.downDimensionY,
        0,
        this,
        1,
        'CORE DUMP',
    );
    this.dataOut = [];

    this.readDffClock = [];
    this.readDffDInp = [];
    this.readDffQOutput = [];
    this.readDffEn = [];
    this.readDffMasterState = [];
    this.readDffSlaveState = [];
    this.readDffprevClockState = [];
    this.readDffClockPolarity = [];
    this.readDffEnPolarity = [];

    for (let i = 0; i < numRead; i++) {
      const currReadOut = new Node(
          this.rightDimensionX,
          0,
          1,
          this,
          this.bitWidth,
          'DATA OUT' + i.toString(),
      );

      const clockInp = new Node(-20, +10, 0, this, 1, 'Clock');
      const dInp = new Node(-20, -10, 0, this, this.bitWidth, 'D');
      const qOutput = new Node(20, -10, 1, this, this.bitWidth, 'Q');
      const en = new Node(-10, 20, 0, this, 1, 'Enable');
      const masterState = 0;
      const slaveState = 0;
      const prevClockState = 0;
      const clockPolarity = rdports[i]['clock_polarity'];
      const enPolarity = rdports[i]['enable_polarity'];

      this.readDffClock.push(clockInp);
      this.readDffDInp.push(dInp);
      this.readDffQOutput.push(qOutput);
      this.readDffEn.push(en);
      this.readDffMasterState.push(masterState);
      this.readDffSlaveState.push(slaveState);
      this.readDffprevClockState.push(prevClockState);
      this.readDffClockPolarity.push(clockPolarity);
      this.readDffEnPolarity.push(enPolarity);

      currReadOut.connect(dInp);

      this.dataOut.push(currReadOut);
    }

    this.prevCoreDumpValue = undefined;
    this.words = words;
    this.numRead = numRead;
    this.numWrite = numWrite;
    this.memData = memData;
    this.rdports = rdports;
    this.wrports = wrports;
    this.clearData();
    this.fillData(memData);
  }

  /**
   *
   * @param {*} memData
   */
  fillData(memData) {
    for (let i = 0; i < this.words; i++) {
      this.data[i] = 0;
    }
    const len = memData.length;
    let dataIndex = 0;
    for (let i = 0; i < len; i++) {
      if (Number.isInteger(memData[i])) {
        const data = memData[i + 1];

        if (data.startsWith('x')) {
          dataIndex += memData[i];
          continue;
        }

        let dataValue = 0;
        let power2 = 1;

        for (let j = this.bitWidth - 1; j >= 0; j--) {
          if (data[j] == '1') {
            dataValue += power2;
          }
          power2 *= 2;
        }

        for (let j = 0; j < memData[i]; j++) {
          this.data[dataIndex++] = dataValue;
        }
        i++;
      } else {
        const data = memData[i];

        if (data.startsWith('x')) {
          dataIndex++;
          continue;
        }

        let dataValue = 0;
        let power2 = 1;

        for (let j = this.bitWidth - 1; j >= 0; j--) {
          if (data[j] == '1') {
            dataValue += power2;
          }
          power2 *= 2;
        }

        this.data[dataIndex++] = dataValue;
      }
    }
  }

  /**
   * @memberof verilogRAM
   * Create save JSON data of object.
   * @return {JSON}
   */
  customSave() {
    this.dataOut.map(findNode);
    const data = {
      // NOTE: data is not persisted since verilogRAMs are volatile.
      constructorParamaters: [
        this.direction,
        this.bitWidth,
        this.addressWidth,
        this.memData,
        this.words,
        this.numRead,
        this.numWrite,
        this.rdports,
        this.wrports,
      ],

      nodes: {
        readAddress: this.readAddress.map(findNode),
        writeAddress: this.writeAddress.map(findNode),
        writeDataIn: this.writeDataIn.map(findNode),
        writeEnable: this.writeEnable.map(findNode),
        dataOut: this.dataOut.map(findNode),
        reset: findNode(this.reset),
        coreDump: findNode(this.coreDump),
        readDffClock: this.readDffClock.map(findNode),
        readDffDInp: this.readDffDInp.map(findNode),
        readDffQOutput: this.readDffQOutput.map(findNode),
        readDffEn: this.readDffEn.map(findNode),
        writeDffClock: this.writeDffClock.map(findNode),
        writeDffDInp: this.writeDffDInp.map(findNode),
        writeDffQOutput: this.writeDffQOutput.map(findNode),
        writeDffEn: this.writeDffEn.map(findNode),
      },
    };
    return data;
  }

  newBitWidth(value) {
  }

  changeAddressWidth(value) {
  }

  clearData() {
    this.data = new Array(this.words);
    this.tooltipText = `${this.memSizeString()} ${this.shortName}`;
  }

  isResolvable() {
    for (let i = 0; i < this.numRead; i++) {
      if (this.readAddress[i] != undefined) {
        return true;
      }
    }
    return this.reset.value != undefined || this.coreDump.value != undefined;
  }

  /**
   *
   */
  resolve() {
    customResolve(
        this.writeDffClock,
        this.writeDffDInp,
        this.writeDffQOutput,
        this.writeDffEn,
        this.writeDffMasterState,
        this.writeDffSlaveState,
        this.writeDffprevClockState,
        this.writeDffClockPolarity,
        this.writeDffEnPolarity,
        this.numWrite,
    );

    for (let i = 0; i < this.numWrite; i++) {
      if (this.writeEnable[i].value == 1) {
        this.data[this.writeAddress[i].value] =
          this.writeDffQOutput[i].value;
      }
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

    for (let i = 0; i < this.numRead; i++) {
      this.dataOut[i].value = this.data[this.readAddress[i].value] || 0;
      simulationArea.simulationQueue.add(this.dataOut[i]);
    }

    customResolve(
        this.readDffClock,
        this.readDffDInp,
        this.readDffQOutput,
        this.readDffEn,
        this.readDffMasterState,
        this.readDffSlaveState,
        this.readDffprevClockState,
        this.readDffClockPolarity,
        this.readDffEnPolarity,
        this.numRead,
    );
  }

  /**
   * Custom draw
   */
  customDraw() {
    const ctx = simulationArea.context;
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
    fillText2(ctx, 'A', this.address.x + 12, this.address.y, xx, yy, this.direction);
    fillText2(ctx, 'DI', this.dataIn.x + 12, this.dataIn.y, xx, yy, this.direction);
    fillText2(ctx, 'W', this.write.x + 12, this.write.y, xx, yy, this.direction);
    fillText2(ctx, 'DO', this.dataOut.x - 15, this.dataOut.y, xx, yy, this.direction);
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

    if (logLabel) {
      console.groupEnd();
    }
  }
}

verilogRAM.prototype.tooltipText = 'Random Access Memory';
verilogRAM.prototype.shortName = 'verilogRAM';
verilogRAM.prototype.maxAddressWidth = 20;
verilogRAM.prototype.mutableProperties = {
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
  reset: {
    name: 'Reset',
    type: 'button',
    func: 'clearData',
  },
};
verilogRAM.prototype.objectType = 'verilogRAM';
