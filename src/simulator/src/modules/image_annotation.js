import {CircuitElement} from '../circuit_element';
import {simulationArea} from '../simulation_area';
import {correctWidth, rect, fillText, drawImage} from '../canvas_api';
import {colors} from '../themer/themer';
import {promptFile} from '../utils';
import {showMessage} from '../utils_clock';
/**
 * @class
 * Image
 * @extends CircuitElement
 * @param {number} x - x coordinate of element.
 * @param {number} y - y coordinate of element.
 * @param {Scope} scope - Circuit on which element is drawn.
 * @param {number} rows - number of rows.
 * @param {number} cols - number of columns.
 * @category modules
 */
export class ImageAnnotation extends CircuitElement {
  /**
   * @param {number} x - x coordinate of element.
   * @param {number} y - y coordinate of element.
   * @param {Scope} scope - Circuit on which element is drawn.
   * @param {number} rows - number of rows.
   * @param {number} cols - number of columns.
   * @param {string} imageUrl - image URL.
   */
  constructor(
      x,
      y,
      scope = globalScope,
      rows = 15,
      cols = 20,
      imageUrl = '',
  ) {
    super(x, y, scope, 'RIGHT', 1);
    this.directionFixed = true;
    this.fixedBitWidth = true;
    this.imageUrl = imageUrl;
    this.cols = cols || parseInt(prompt('Enter cols:'), 10);
    this.rows = rows || parseInt(prompt('Enter rows:'), 10);
    this.setSize();
    this.loadImage();
  }

  /**
   * @memberof ImageAnnotation
   * @param {number} size - new size of rows
   * @return {ImageAnnotation} this
   */
  changeRowSize(size) {
    if (size === undefined || size < 5 || size > 1000) {
      return;
    }
    if (this.rows === size) {
      return;
    }
    this.rows = parseInt(size, 10);
    this.setSize();
    return this;
  }

  /**
   * @memberof ImageAnnotation
   * @param {number} size - new size of columns
   * @return {ImageAnnotation} this
   */
  changeColSize(size) {
    if (size === undefined || size < 5 || size > 1000) {
      return;
    }
    if (this.cols === size) {
      return;
    }
    this.cols = parseInt(size, 10);
    this.setSize();
    return this;
  }

  /**
   * @memberof ImageAnnotation
   * listener function to change direction of Image
   * @param {string} dir - new direction
   */
  keyDown3(dir) {
    if (dir === 'ArrowRight') {
      this.changeColSize(this.cols + 2);
    }
    if (dir === 'ArrowLeft') {
      this.changeColSize(this.cols - 2);
    }
    if (dir === 'ArrowDown') {
      this.changeRowSize(this.rows + 2);
    }
    if (dir === 'ArrowUp') {
      this.changeRowSize(this.rows - 2);
    }
  }

  /**
   * @memberof ImageAnnotation
   * Create save JSON data of object.
   * @return {JSON}
   */
  customSave() {
    const data = {
      customData: {
        rows: this.rows,
        cols: this.cols,
        imageUrl: this.imageUrl,
      },
    };
    return data;
  }

  /**
   * @memberof ImageAnnotation
   * function to draw element
   * @param {CanvasRenderingContext2D} ctx
   */
  customDraw(ctx) {
    const xx = this.x;
    const yy = this.y;
    const w = this.elementWidth;
    const h = this.elementHeight;
    if (this.image && this.image.complete) {
      drawImage(ctx, this.image, xx - w / 2, yy - h / 2, w, h);
    } else {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.setLineDash([5 * globalScope.scale, 5 * globalScope.scale]);
      ctx.lineWidth = correctWidth(1.5);

      rect(ctx, xx - w / 2, yy - h / 2, w, h);
      ctx.stroke();

      if (
        simulationArea.lastSelected === this ||
        simulationArea.multipleObjectSelections.includes(this)
      ) {
        ctx.fillStyle = 'rgba(255, 255, 32,0.1)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.textAlign = 'center';
      ctx.fillStyle = colors['text'];
      fillText(ctx, 'Double Click to Insert Image', xx, yy, 10);
      ctx.fill();

      ctx.setLineDash([]);
    }
  }

  /**
     * Procedure if image is double clicked
     **/
  dblclick() {
    if (embed) {
      return;
    }
    this.uploadImage();
  }

  /**
   * Upload image.
   */
  async uploadImage() {
    const file = await promptFile('image/*', false);
    const apiUrl = 'https://api.imgur.com/3/image';
    const apiKey = '9a33b3b370f1054';
    const settings = {
      crossDomain: true,
      processData: false,
      contentType: false,
      type: 'POST',
      url: apiUrl,
      headers: {
        Authorization: 'Client-ID ' + apiKey,
        Accept: 'application/json',
      },
      mimeType: 'multipart/form-data',
    };
    const formData = new FormData();
    formData.append('image', file);
    settings.data = formData;

    // Response contains stringified JSON
    // Image URL available at response.data.link
    showMessage('Uploading Image');
    const response = await $.ajax(settings);
    showMessage('Image Uploaded');
    this.imageUrl = JSON.parse(response).data.link;
    this.loadImage();
  }

  /**
   * Load image from URL.
   * @return {void}
   */
  async loadImage() {
    if (!this.imageUrl) {
      return;
    }
    this.image = new Image();
    this.image.crossOrigin = 'anonymous';
    this.image.src = this.imageUrl;
  }
  /**
     * @memberof Image
     * function to reset or (internally) set size
     */
  setSize() {
    this.elementWidth = this.cols * 10;
    this.elementHeight = this.rows * 10;
    this.upDimensionY = this.elementHeight / 2;
    this.downDimensionY = this.elementHeight / 2;
    this.leftDimensionX = this.elementWidth / 2;
    this.rightDimensionX = this.elementWidth / 2;
  }
}

/**
 * @memberof ImageAnnotation
 * Help Tip
 * @type {string}
 * @category modules
 */
ImageAnnotation.prototype.tooltipText =
  'Image ToolTip: Embed an image in the circuit for annotation';
ImageAnnotation.prototype.propagationDelayFixed = true;

/**
 * @memberof ImageAnnotation
 * Mutable properties of the element
 * @type {JSON}
 * @category modules
 */
ImageAnnotation.prototype.mutableProperties = {
  cols: {
    name: 'Columns',
    type: 'number',
    max: '1000',
    min: '5',
    func: 'changeColSize',
  },
  rows: {
    name: 'Rows',
    type: 'number',
    max: '1000',
    min: '5',
    func: 'changeRowSize',
  },
};
ImageAnnotation.prototype.objectType = 'ImageAnnotation';
ImageAnnotation.prototype.rectangleObject = false;
ImageAnnotation.prototype.mutableProperties = {
  imageUrl: {
    name: 'Upload Image',
    type: 'button',
    func: 'uploadImage',
  },
  cols: {
    name: 'Columns',
    type: 'number',
    max: '1000',
    min: '5',
    func: 'changeColSize',
  },
  rows: {
    name: 'Rows',
    type: 'number',
    max: '1000',
    min: '5',
    func: 'changeRowSize',
  },
};
ImageAnnotation.prototype.constructorParameters= [
  'rows',
  'cols',
  'imageUrl',
];
