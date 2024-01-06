/**
 * Background area.
 */
export class BackgroundArea {
  public canvas: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;

  /**
   * @param {HTMLElement} canvasArea
   */
  constructor(canvasArea: HTMLElement) {
    const existing = canvasArea.getElementsByClassName('backgroundArea');
    if (existing.length === 0) {
      this.canvas = document.createElement('canvas');
      this.canvas.style.position = 'absolute';
      this.canvas.style.left = '0';
      this.canvas.style.top = '0';
      this.canvas.style.zIndex = '0';
      this.canvas.className = 'backgroundArea';
      canvasArea.appendChild(this.canvas);
    } else {
      this.canvas = <HTMLCanvasElement>existing[0];
    }
    this.context = this.canvas.getContext('2d')!;
  }

  /**
   * Clear background.
   */
  clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
