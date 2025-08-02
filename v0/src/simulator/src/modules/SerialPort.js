import CircuitElement from '../circuitElement';
import Node, { findNode } from '../node';
import simulationArea from '../simulationArea';
import { fillText4 } from '../canvasApi';

/**
 * @class
 * SerialPort
 * @extends CircuitElement
 * A component that allows bidirectional communication with external hardware via the Web Serial API.
 * Supports writing 8-bit data through the TX node and reading 8-bit data on the RX node.
 *
 * @param {number} x - X coordinate of the element
 * @param {number} y - Y coordinate of the element
 * @param {Scope=} scope - Circuit scope where the component is placed
 * @category modules
 */
import { showError, showMessage } from '../utils'

export default class SerialPort extends CircuitElement {
    constructor(x, y, scope = globalScope) {
        super(x, y, scope, 'LEFT', 8);
        this.setDimensions(30, 40);
        this.fixedBitWidth = true;
        this.rectangleObject = true;
        this.tx = new Node(-30, 0, 0, this, 8, "TX");
        this.rx = new Node(-30, 20, 1, this, 8, "RX");
        this.prevReceived = 0;
        this.prevWritten = null;
        this.baudRate = 9600;
        this.isConnected = false;
    }

    /**
        * Save the component's custom data for JSON serialization
        * @returns {Object}
        */
    customSave() {
        return {
            nodes: {}
        };
    }

    /**
     * @memberof SerialPort
     * function to draw element
     */
    customDraw() {
        const ctx = simulationArea.context;
        const xx = this.x;
        const yy = this.y;

        // Title
        ctx.fillStyle = "#000";
        ctx.textAlign = "center";
        fillText4(ctx, "🔌Serial Port", 0, -24, xx, yy, this.direction, 9);

        // Labels
        ctx.textAlign = "left";
        fillText4(ctx, "TX ◀───", 0, 0, xx, yy, this.direction, 7);
        fillText4(ctx, "RX ───▶", 0, 20, xx, yy, this.direction, 7);
    }

    /**
    * Toggles the serial connection via Web Serial API.
    * Prompts user to select a port and opens it with the selected baud rate.
    */
    toggleSerialConnection() {
        if (this.isConnected) {
            this.reader?.cancel();
            this.reader?.releaseLock();
            this.writer?.releaseLock();
            this.port?.close();
            this.isConnected = false;
            showMessage("Serial disconnected");
            return;
        }
        if (!"serial" in navigator) {
            showMessage("The Web Serial API is not supported on your browser");
            return;
        }
        navigator.serial.requestPort().then((port) => {
            this.port = port;
            port.open({ baudRate: this.baudRate }).then(async () => {
                this.wasAllowed = true;
                this.reader = port.readable.getReader();
                this.writer = port.writable.getWriter();
                this.isConnected = true;
                showMessage("Serial connected");
                this.readSerialData();

            }).catch((error) => {
                console.log("Error opening serial port:", error);
                this.isConnected = false;
                showError("Serial connection failed");
            });
        }).catch((error) => {
            console.log("Error requesting serial port:", error);
            this.isConnected = false;
            showError("Serial port request denied");
        });
    }

    /**
    * Continuously reads incoming data from the serial port and writes it to the RX pin.
    */
    async readSerialData() {
        while (this.isConnected) {
            try {
                const { value, done } = await this.reader.read();
                if (done) break;
                if (value && value.length > 0) {
                    const byteReceived = value[0];
                    this.prevReceived = byteReceived;
                }
                this.rx.value = this.prevReceived;
                simulationArea.simulationQueue.add(this.rx);
            } catch (err) {
                console.error("Read error:", err);
                break;
            }
        }
    }

    /**
     * Sends an 8-bit value through the serial port.
     * @param {number} valueToSend - 8-bit value to send
     */
    async writeSerialData(valueToSend) {
        const data = new Uint8Array([valueToSend & 0xFF]); // 1 byte
        await this.writer.write(data);
    }
    isResolvable() {
        return false;
    }

    /**
    * Main resolve logic:
    * If connected, sends data on TX node and updates RX node with last received byte.
    */
    resolve() {
        // Read from tx pin
        const valueToSend = this.tx.value;
        // Only send if connected and value is defined
        if (valueToSend !== undefined && this.isConnected && this.port?.writable && valueToSend !== this.prevWritten) {
            this.writeSerialData(valueToSend);
            this.prevWritten = valueToSend;
        }
        this.rx.value = this.prevReceived;
        simulationArea.simulationQueue.add(this.rx);
    }
    changeBaudRate(value) {
        if (value !== undefined && value !== NaN && this.baudRate !== value)
            this.baudRate = value;
        showMessage(`Baud rate set to ${this.baudRate}. You need to restart connection.`);
    }

}

SerialPort.prototype.mutableProperties = {
    baudRate: {
        name: "Baud Rate",
        type: "number",
        func: "changeBaudRate",
        min: "1",
        max: "115200"
    },
    toggleSerial: {
        name: "Connect/Disconnect",
        type: 'button',
        func: 'toggleSerialConnection',
    },

};


SerialPort.prototype.tooltipText = 'SerialPort - Communicates with external devices using Web Serial API';
SerialPort.prototype.helplink = 'https://docs.circuitverse.org/#/chapter4/<To Be Updated>';
SerialPort.prototype.objectType = 'SerialPort';
