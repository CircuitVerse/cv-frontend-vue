import {CircuitElement} from '../circuit_element';
import {Node, findNode} from '../node';

import {correctWidth, lineTo, moveTo} from '../canvas_api';
import {colors} from '../themer/themer';
/**
 * Clock
 * @extends CircuitElement
 * @param {number} x - x coord of element
 * @param {number} y - y coord of element
 * @param {Scope} scope - the circuit in which we want the Element
 * @param {string} dir - direction in which element has to drawn
 * @category sequential
 */
export class Clock extends CircuitElement {
  /**
   * @param {number} x - x coord of element
   * @param {number} y - y coord of element
   * @param {Scope} scope - the circuit in which we want the Element
   * @param {string} dir - direction in which element has to drawn
   */
  constructor(x, y, scope, dir = 'RIGHT') {
    super(x, y, scope, dir, 1);
    this.fixedBitWidth = true;
    this.output1 = new Node(10, 0, 1, this, 1);
    this.state = 0;
    this.output1.value = this.state;
    this.wasClicked = false;
    this.interval = null;
  }

  /**
   * @memberof Clock
   * Create save JSON data of object.
   * @return {JSON}
   */
  customSave() {
    const data = {
      nodes: {
        output1: findNode(this.output1),
      },
      customData: {
        direction: this.direction,
      },
    };
    return data;
  }

  /**
   * @memberof Clock
   * Determine output values and add to simulation queue.
   */
  resolve() {
    this.output1.value = this.state;
    this.scope.simulationArea.simulationQueue.add(this.output1);
  }

  /**
   *
   */
  toggleState() {
    // toggleState
    this.state = (this.state + 1) % 2;
    this.output1.value = this.state;
  }

  /**
   * Custom draw.
   * @param {CanvasRenderingContext2D} ctx
   */
  customDraw(ctx) {
    ctx.strokeStyle = colors['stroke'];
    ctx.fillStyle = colors['fill'];
    ctx.lineWidth = correctWidth(3);
    const xx = this.x;
    const yy = this.y;

    ctx.beginPath();
    ctx.strokeStyle = [colors['color_wire_con'], colors['color_wire_pow']][
        this.state
    ];
    ctx.lineWidth = correctWidth(2);
    if (this.state == 0) {
      moveTo(ctx, -6, 0, xx, yy, 'RIGHT');
      lineTo(ctx, -6, 5, xx, yy, 'RIGHT');
      lineTo(ctx, 0, 5, xx, yy, 'RIGHT');
      lineTo(ctx, 0, -5, xx, yy, 'RIGHT');
      lineTo(ctx, 6, -5, xx, yy, 'RIGHT');
      lineTo(ctx, 6, 0, xx, yy, 'RIGHT');
    } else {
      moveTo(ctx, -6, 0, xx, yy, 'RIGHT');
      lineTo(ctx, -6, -5, xx, yy, 'RIGHT');
      lineTo(ctx, 0, -5, xx, yy, 'RIGHT');
      lineTo(ctx, 0, 5, xx, yy, 'RIGHT');
      lineTo(ctx, 6, 5, xx, yy, 'RIGHT');
      lineTo(ctx, 6, 0, xx, yy, 'RIGHT');
    }
    ctx.stroke();
  }

  static verilogInstructions() {
    return 'Clock - Use a single global clock\n';
  }
}

Clock.prototype.tooltipText = 'Clock';

Clock.prototype.click = Clock.prototype.toggleState;
Clock.prototype.objectType = 'Clock';
Clock.prototype.propagationDelay = 0;
Clock.prototype.propagationDelayFixed = true;
Clock.prototype.constructorParameters= ['direction'];
