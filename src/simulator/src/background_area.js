/**
 * Background area.
 */
export class BackgroundArea {
  /**
   * @param {*} canvasArea
   */
  constructor(canvasArea) {
    const existing = canvasArea.getElementsByClassName('backgroundArea');
    if (existing.length === 0) {
      this.canvas = document.createElement('canvas');
      this.canvas.style.position='absolute';
      this.canvas.style.left=0;
      this.canvas.style.top=0;
      this.canvas.style.zIndex=0;
      this.canvas.className = 'backgroundArea';
      this.canvas.width = width;
      this.canvas.height = height;
      // this.canvas.style.height = height / DPR + 100 + 'px';
      // this.canvas.style.width = width / DPR + 100 + 'px';
      canvasArea.appendChild(this.canvas);
    } else {
      console.log(existing[0]);
      this.canvas = existing[0];
    }
    this.context = this.canvas.getContext('2d');
  }

  /**
   * Clear background.
   */
  clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
