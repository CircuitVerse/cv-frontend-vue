
import {miniMapArea, removeMiniMap, updateLastMinimapShown} from './minimap';
import {colors} from './themer/themer';

const unit = 10;

/**
 * Determine bounding box.
 * @param {Scope} scope
 */
export function findDimensions(scope = globalScope) {
  const simArea = globalScope.simulationArea;
  let totalObjects = 0;
  simArea.minWidth = undefined;
  simArea.maxWidth = undefined;
  simArea.minHeight = undefined;
  simArea.maxHeight = undefined;
  for (let i = 0; i < updateOrder.length; i++) {
    if (updateOrder[i] !== 'wires') {
      for (let j = 0; j < scope[updateOrder[i]].length; j++) {
        totalObjects += 1;
        const obj = scope[updateOrder[i]][j];
        if (totalObjects === 1) {
          simArea.minWidth = obj.absX();
          simArea.minHeight = obj.absY();
          simArea.maxWidth = obj.absX();
          simArea.maxHeight = obj.absY();
        }
        if (obj.objectType !== 'Node') {
          if (obj.y - obj.upDimensionY < simArea.minHeight) {
            simArea.minHeight = obj.y - obj.upDimensionY;
          }
          if (obj.y + obj.downDimensionY > simArea.maxHeight) {
            simArea.maxHeight = obj.y + obj.downDimensionY;
          }
          if (obj.x - obj.leftDimensionX < simArea.minWidth) {
            simArea.minWidth = obj.x - obj.leftDimensionX;
          }
          if (obj.x + obj.rightDimensionX > simArea.maxWidth) {
            simArea.maxWidth = obj.x + obj.rightDimensionX;
          }
        } else {
          if (obj.absY() < simArea.minHeight) {
            simArea.minHeight = obj.absY();
          }
          if (obj.absY() > simArea.maxHeight) {
            simArea.maxHeight = obj.absY();
          }
          if (obj.absX() < simArea.minWidth) {
            simArea.minWidth = obj.absX();
          }
          if (obj.absX() > simArea.maxWidth) {
            simArea.maxWidth = obj.absX();
          }
        }
      }
    }
  }
  simArea.objectList = updateOrder;
}

/**
 * Change the zoom level wrt to a point
 * Change scale (zoom) - It also shifts origin so that the position
 * of the object in focus doesn't change
 * @param {*} delta
 * @param {*} xx
 * @param {*} yy
 * @param {*} method
 */
export function changeScale(delta, xx, yy, method = 1) {
  // method = 3/2 - Zoom wrt center of screen
  // method = 1 - Zoom wrt position of mouse
  // Otherwise zoom wrt to selected object

  if (method === 3) {
    xx = (width / 2 - globalScope.ox) / globalScope.scale;
    yy = (height / 2 - globalScope.oy) / globalScope.scale;
  } else if (
    xx === undefined ||
    yy === undefined ||
    xx === 'zoomButton' ||
    yy === 'zoomButton'
  ) {
    if (
      globalScope.simulationArea.lastSelected &&
      globalScope.simulationArea.lastSelected.objectType !== 'Wire'
    ) {
      // selected object
      xx = globalScope.simulationArea.lastSelected.x;
      yy = globalScope.simulationArea.lastSelected.y;
    } else {
      // mouse location
      if (method === 1) {
        xx = globalScope.simulationArea.mouseX;
        yy = globalScope.simulationArea.mouseY;
      } else if (method === 2) {
        xx = (width / 2 - globalScope.ox) / globalScope.scale;
        yy = (height / 2 - globalScope.oy) / globalScope.scale;
      }
    }
  }

  const oldScale = globalScope.scale;
  globalScope.scale = Math.max(
      0.5,
      Math.min(4 * DPR, globalScope.scale + delta),
  );
  globalScope.scale = Math.round(globalScope.scale * 10) / 10;
  // Shift accordingly, so that we zoom wrt to the selected point
  globalScope.ox -= Math.round(xx * (globalScope.scale - oldScale));
  globalScope.oy -= Math.round(yy * (globalScope.scale - oldScale));

  // MiniMap
  if (!embed && !lightMode) {
    findDimensions(globalScope);
    miniMapArea.setup();
    $('#miniMap').show();
    updateLastMinimapShown();
    $('#miniMap').show();
    setTimeout(removeMiniMap, 2000);
  }
}

/**
 * Draw Dots on screen
 * the function is called only when the zoom level or size of screen changes.
 * Otherwise for normal panning, the canvas itself is moved to give
 * the illusion of movement
 * @param {Scope} scope
 * @param {boolean} dots
 * @param {boolean} transparentBackground
 * @param {boolean} force
 */
export function dots(
    scope,
    dots = true,
    transparentBackground = false,
    force = false,
) {
  const scale = unit * scope.scale;
  const ox = scope.ox % scale; // offset
  const oy = scope.oy % scale; // offset

  const backgroundCtx = scope.backgroundArea.context;
  if (!backgroundCtx) {
    return;
  }

  const canvasWidth = scope.backgroundArea.canvas.width;
  const canvasHeight = scope.backgroundArea.canvas.height;

  // adjust left position of canvas
  scope.backgroundArea.canvas.style.left = `${(ox - scale) / DPR}px`;
  // adjust top position of canvas
  scope.backgroundArea.canvas.style.top = `${(oy - scale) / DPR}px`;

  if (scope.scale === scope.simulationArea.prevScale && !force) {
    return;
  }

  // set the previous scale to current scale
  scope.simulationArea.prevScale = scope.scale;

  backgroundCtx.beginPath();
  scope.backgroundArea.clear();

  if (!transparentBackground) {
    backgroundCtx.fillStyle = colors['canvas_fill'];
    backgroundCtx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  if (dots) {
    backgroundCtx.fillStyle = colors['dot_fill'];
    for (let i = 0; i < canvasWidth; i += scale) {
      for (let j = 0; j < canvasHeight; j += scale) {
        backgroundCtx.beginPath();
        backgroundCtx.arc(i, j, scale / 10, 0, Math.PI * 2);
        backgroundCtx.fill();
      }
    }
  }

  backgroundCtx.strokeStyle = colors['canvas_stroke'];
  backgroundCtx.lineWidth = 1;

  if (!embed) {
    const correction = 0.5 * (backgroundCtx.lineWidth % 2);
    for (let i = 0; i < canvasWidth; i += scale) {
      backgroundCtx.moveTo(Math.round(i + correction) - correction, 0);
      backgroundCtx.lineTo(
          Math.round(i + correction) - correction,
          canvasHeight,
      );
    }
    for (let j = 0; j < canvasHeight; j += scale) {
      backgroundCtx.moveTo(0, Math.round(j + correction) - correction);
      backgroundCtx.lineTo(
          canvasWidth,
          Math.round(j + correction) - correction,
      );
    }
    backgroundCtx.stroke();
  }
}

/**
 * Helper canvas API starts here
 * All canvas functions are wrt to a center point (xx,yy),
 * direction is used to abstract rotation of everything by a certain angle
 * Possible values for direction = "RIGHT" (default), "LEFT", "UP", "DOWN"
 * @param {*} x1
 * @param {*} y1
 * @param {*} x2
 * @param {*} y2
 * @param {*} x3
 * @param {*} y3
 * @param {*} xx
 * @param {*} yy
 * @param {*} dir
 */
export function bezierCurveTo(x1, y1, x2, y2, x3, y3, xx, yy, dir) {
  [x1, y1] = rotate(x1, y1, dir);
  [x2, y2] = rotate(x2, y2, dir);
  [x3, y3] = rotate(x3, y3, dir);
  const {ox} = globalScope;
  const {oy} = globalScope;
  x1 *= globalScope.scale;
  y1 *= globalScope.scale;
  x2 *= globalScope.scale;
  y2 *= globalScope.scale;
  x3 *= globalScope.scale;
  y3 *= globalScope.scale;
  xx *= globalScope.scale;
  yy *= globalScope.scale;
  const ctx = globalScope.simulationArea.context;
  ctx.bezierCurveTo(
      Math.round(xx + ox + x1),
      Math.round(yy + oy + y1),
      Math.round(xx + ox + x2),
      Math.round(yy + oy + y2),
      Math.round(xx + ox + x3),
      Math.round(yy + oy + y3),
  );
}

/**
 *
 * @param {*} ctx
 * @param {*} x1
 * @param {*} y1
 * @param {*} xx
 * @param {*} yy
 * @param {*} dir
 * @param {*} bypass
 */
export function moveTo(ctx, x1, y1, xx, yy, dir, bypass = false) {
  const correction = 0.5 * (ctx.lineWidth % 2);
  let newX;
  let newY;
  [newX, newY] = rotate(x1, y1, dir);
  newX *= globalScope.scale;
  newY *= globalScope.scale;
  xx *= globalScope.scale;
  yy *= globalScope.scale;
  if (bypass) {
    ctx.moveTo(xx + globalScope.ox + newX, yy + globalScope.oy + newY);
  } else {
    ctx.moveTo(
        Math.round(xx + globalScope.ox + newX - correction) + correction,
        Math.round(yy + globalScope.oy + newY - correction) + correction,
    );
  }
}

/**
 *
 * @param {*} ctx
 * @param {*} x1
 * @param {*} y1
 * @param {*} xx
 * @param {*} yy
 * @param {*} dir
 */
export function lineTo(ctx, x1, y1, xx, yy, dir) {
  let newX;
  let newY;

  const correction = 0.5 * (ctx.lineWidth % 2);
  [newX, newY] = rotate(x1, y1, dir);
  newX *= globalScope.scale;
  newY *= globalScope.scale;
  xx *= globalScope.scale;
  yy *= globalScope.scale;
  ctx.lineTo(
      Math.round(xx + globalScope.ox + newX - correction) + correction,
      Math.round(yy + globalScope.oy + newY - correction) + correction,
  );
}

/**
 * Draw an arc.
 * @param {*} ctx
 * @param {*} sx
 * @param {*} sy
 * @param {*} radius
 * @param {*} start
 * @param {*} stop
 * @param {*} xx
 * @param {*} yy
 * @param {*} dir
 */
export function arc(ctx, sx, sy, radius, start, stop, xx, yy, dir) {
  // ox-x of origin, xx- x of element , sx - shift in x from element
  let Sx;
  let Sy;
  let newStart;
  let newStop;
  let counterClock;
  const correction = 0.5 * (ctx.lineWidth % 2);
  [Sx, Sy] = rotate(sx, sy, dir);
  Sx *= globalScope.scale;
  Sy *= globalScope.scale;
  xx *= globalScope.scale;
  yy *= globalScope.scale;
  radius *= globalScope.scale;
  [newStart, newStop, counterClock] = rotateAngle(start, stop, dir);
  ctx.arc(
      Math.round(xx + globalScope.ox + Sx + correction) - correction,
      Math.round(yy + globalScope.oy + Sy + correction) - correction,
      Math.round(radius),
      newStart,
      newStop,
      counterClock,
  );
}

/**
 * Draw an arc.
 * @param {*} ctx
 * @param {*} sx
 * @param {*} sy
 * @param {*} radius
 * @param {*} start
 * @param {*} stop
 * @param {*} xx
 * @param {*} yy
 * @param {*} dir
 */
export function arc2(ctx, sx, sy, radius, start, stop, xx, yy, dir) {
  // ox-x of origin, xx- x of element , sx - shift in x from element
  let Sx;
  let Sy;
  let newStart;
  let newStop;
  let counterClock;
  const correction = 0.5 * (ctx.lineWidth % 2)
    ;[Sx, Sy] = rotate(sx, sy, dir);
  Sx *= globalScope.scale;
  Sy *= globalScope.scale;
  xx *= globalScope.scale;
  yy *= globalScope.scale;
  radius *= globalScope.scale
  ;[newStart, newStop, counterClock] = rotateAngle(start, stop, dir);
  let pi = 0;
  if (counterClock) {
    pi = Math.PI;
  }
  ctx.arc(
      Math.round(xx + globalScope.ox + Sx + correction) - correction,
      Math.round(yy + globalScope.oy + Sy + correction) - correction,
      Math.round(radius),
      newStart + pi,
      newStop + pi,
  );
}

/**
 * Draw a circle.
 * @param {*} ctx
 * @param {*} sx
 * @param {*} sy
 * @param {*} radius
 * @param {*} xx
 * @param {*} yy
 * @param {*} dir
 */
export function drawCircle2(ctx, sx, sy, radius, xx, yy, dir) {
  // ox-x of origin, xx- x of element , sx - shift in x from element
  let Sx;
  let Sy
    ;[Sx, Sy] = rotate(sx, sy, dir);
  Sx *= globalScope.scale;
  Sy *= globalScope.scale;
  xx *= globalScope.scale;
  yy *= globalScope.scale;
  radius *= globalScope.scale;
  ctx.arc(
      Math.round(xx + globalScope.ox + Sx),
      Math.round(yy + globalScope.oy + Sy),
      Math.round(radius),
      0,
      2 * Math.PI,
  );
}

export function rect(ctx, x1, y1, x2, y2) {
  const correction = 0.5 * (ctx.lineWidth % 2);
  x1 *= globalScope.scale;
  y1 *= globalScope.scale;
  x2 *= globalScope.scale;
  y2 *= globalScope.scale;
  ctx.rect(
      Math.round(globalScope.ox + x1 - correction) + correction,
      Math.round(globalScope.oy + y1 - correction) + correction,
      Math.round(x2),
      Math.round(y2),
  );
}

/**
 *
 * @param {*} ctx
 * @param {*} img
 * @param {number} x1
 * @param {number} y1
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 */
export function drawImage(ctx, img, x1, y1, canvasWidth, canvasHeight) {
  x1 *= globalScope.scale;
  y1 *= globalScope.scale;
  x1 += globalScope.ox;
  y1 += globalScope.oy;

  canvasWidth *= globalScope.scale;
  canvasHeight *= globalScope.scale;
  ctx.drawImage(img, x1, y1, canvasWidth, canvasHeight);
}

/**
 * Draw a rectangle.
 * @param {*} ctx
 * @param {*} x1
 * @param {*} y1
 * @param {*} x2
 * @param {*} y2
 * @param {*} xx
 * @param {*} yy
 * @param {*} dir
 */
export function rect2(ctx, x1, y1, x2, y2, xx, yy, dir = 'RIGHT') {
  const correction = 0.5 * (ctx.lineWidth % 2)
    ;[x1, y1] = rotate(x1, y1, dir)
  ;[x2, y2] = rotate(x2, y2, dir);
  x1 *= globalScope.scale;
  y1 *= globalScope.scale;
  x2 *= globalScope.scale;
  y2 *= globalScope.scale;
  xx *= globalScope.scale;
  yy *= globalScope.scale;
  ctx.rect(
      Math.round(globalScope.ox + xx + x1 - correction) + correction,
      Math.round(globalScope.oy + yy + y1 - correction) + correction,
      Math.round(x2),
      Math.round(y2),
  );
}

/**
 * Rotate x and y coordinates by direction.
 * @param {*} x1
 * @param {*} y1
 * @param {*} dir
 * @return {number[]}
 */
export function rotate(x1, y1, dir) {
  if (dir === 'LEFT') {
    return [-x1, y1];
  }
  if (dir === 'DOWN') {
    return [y1, x1];
  }
  if (dir === 'UP') {
    return [y1, -x1];
  }
  return [x1, y1];
}

/**
 * Correct width
 * @param {*} width
 * @return {number}
 */
export function correctWidth(width) {
  return Math.max(1, Math.round(width * globalScope.scale));
}

/**
 * Rotate angle by direction.
 * @param {*} start
 * @param {*} stop
 * @param {*} dir
 * @return {any[]}
 */
function rotateAngle(start, stop, dir) {
  if (dir === 'LEFT') {
    return [start, stop, true];
  }
  if (dir === 'DOWN') {
    return [start - Math.PI / 2, stop - Math.PI / 2, true];
  }
  if (dir === 'UP') {
    return [start - Math.PI / 2, stop - Math.PI / 2, false];
  }
  return [start, stop, false];
}

/**
 * Draw a line.
 * @param {*} ctx
 * @param {*} x1
 * @param {*} y1
 * @param {*} x2
 * @param {*} y2
 * @param {*} color
 * @param {*} width
 */
export function drawLine(ctx, x1, y1, x2, y2, color, width) {
  x1 *= globalScope.scale;
  y1 *= globalScope.scale;
  x2 *= globalScope.scale;
  y2 *= globalScope.scale;
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = correctWidth(width); //* globalScope.scale;
  const correction = 0.5 * (ctx.lineWidth % 2);
  let hCorrection = 0;
  let vCorrection = 0;
  if (y1 === y2) {
    vCorrection = correction;
  }
  if (x1 === x2) {
    hCorrection = correction;
  }
  ctx.moveTo(
      Math.round(x1 + globalScope.ox + hCorrection) - hCorrection,
      Math.round(y1 + globalScope.oy + vCorrection) - vCorrection,
  );
  ctx.lineTo(
      Math.round(x2 + globalScope.ox + hCorrection) - hCorrection,
      Math.round(y2 + globalScope.oy + vCorrection) - vCorrection,
  );
  ctx.stroke();
}

/**
 * Checks if string color is a valid color using a hack
 * @param {string} color - html color string
 * @return {boolean} - is a valid html color
 */
export function validColor(color) {
  const $div = $('<div>');
  $div.css('border', `1px solid ${color}`);
  return $div.css('border-color') !== '';
}

/**
  * Convert color string to RGBA
  * @param {string} color - Color string like 'red'
  * @return {Uint8ClampedArray}
  */
export function colorToRGBA(color) {
  const cvs = document.createElement('canvas');
  cvs.height = 1;
  cvs.width = 1;
  const ctx = cvs.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  return ctx.getImageData(0, 0, 1, 1).data;
}

/**
 * Draw a circle on the canvas.
 * @param {*} ctx
 * @param {number} x1 - X position of the center;
 * @param {number} y1 - Y position of the center;
 * @param {number} r - radius of the circle.
 * @param {*} color - color of the circle.
 */
export function drawCircle(ctx, x1, y1, r, color) {
  x1 *= globalScope.scale;
  y1 *= globalScope.scale;
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.arc(
      Math.round(x1 + globalScope.ox),
      Math.round(y1 + globalScope.oy),
      Math.round(r * globalScope.scale),
      0,
      Math.PI * 2,
      false,
  );
  ctx.closePath();
  ctx.fill();
}

/**
 * Show message like values, node name etc
 * @param {*} ctx
 * @param {*} str
 * @param {*} x1
 * @param {*} y1
 * @param {*} fontSize
 */
export function canvasMessage(ctx, str, x1, y1, fontSize = 10) {
  if (!str || !str.length) {
    return;
  }

  ctx.font = `${Math.round(fontSize * globalScope.scale)}px Raleway`;
  ctx.textAlign = 'center';
  const width = ctx.measureText(str).width / globalScope.scale + 8;
  const height = 13;
  ctx.strokeStyle = 'black';
  ctx.lineWidth = correctWidth(1);
  ctx.fillStyle = 'yellow';
  ctx.save();
  ctx.beginPath();
  rect(ctx, x1 - width / 2, y1 - height / 2 - 3, width, height);
  ctx.shadowColor = '#999';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;
  ctx.stroke();
  ctx.fill();
  ctx.restore();
  x1 *= globalScope.scale;
  y1 *= globalScope.scale;
  ctx.beginPath();
  ctx.fillStyle = 'black';
  ctx.fillText(
      str,
      Math.round(x1 + globalScope.ox),
      Math.round(y1 + globalScope.oy),
  );
  ctx.fill();
}

/**
 * Fill text on canvas.
 * @param {*} ctx
 * @param {*} str
 * @param {*} x1
 * @param {*} y1
 * @param {*} fontSize
 */
export function fillText(ctx, str, x1, y1, fontSize = 20) {
  x1 *= globalScope.scale;
  y1 *= globalScope.scale;
  ctx.font = `${Math.round(fontSize * globalScope.scale)}px Raleway`;
  ctx.fillText(
      str,
      Math.round(x1 + globalScope.ox),
      Math.round(y1 + globalScope.oy),
  );
}

/**
 *
 * @param {*} ctx
 * @param {*} str
 * @param {*} x1
 * @param {*} y1
 * @param {*} xx
 * @param {*} yy
 * @param {*} dir
 */
export function fillText2(ctx, str, x1, y1, xx, yy, dir) {
  const angle = {
    RIGHT: 0,
    LEFT: 0,
    DOWN: Math.PI / 2,
    UP: -Math.PI / 2,
  };
  x1 *= globalScope.scale;
  y1 *= globalScope.scale
  ;[x1, y1] = rotate(x1, y1, dir);
  xx *= globalScope.scale;
  yy *= globalScope.scale;

  ctx.font = `${Math.round(14 * globalScope.scale)}px Raleway`;
  ctx.save();
  ctx.translate(
      Math.round(xx + x1 + globalScope.ox),
      Math.round(yy + y1 + globalScope.oy),
  );
  ctx.rotate(angle[dir]);
  ctx.textAlign = 'center';
  ctx.fillText(
      str,
      0,
      Math.round(4 * globalScope.scale) * (1 - 0 * +(dir === 'DOWN')),
  );
  ctx.restore();
}

/**
 *
 * @param {*} ctx
 * @param {*} str
 * @param {*} x1
 * @param {*} y1
 * @param {*} xx
 * @param {*} yy
 * @param {*} dir
 * @param {*} fontSize
 * @param {*} textAlign
 */
export function fillText4(
    ctx,
    str,
    x1,
    y1,
    xx,
    yy,
    dir,
    fontSize = 14,
    textAlign = 'center',
) {
  x1 *= globalScope.scale;
  y1 *= globalScope.scale
  ;[x1, y1] = rotate(x1, y1, dir);
  xx *= globalScope.scale;
  yy *= globalScope.scale;

  ctx.font = `${Math.round(fontSize * globalScope.scale)}px Raleway`;
  ctx.textAlign = textAlign;
  ctx.fillText(
      str,
      xx + x1 + globalScope.ox,
      yy +
    y1 +
    globalScope.oy +
    Math.round((fontSize / 3) * globalScope.scale),
  );
}

/**
 *
 * @param {*} ctx
 * @param {*} str
 * @param {*} x1
 * @param {*} y1
 * @param {*} xx
 * @param {*} yy
 * @param {*} fontSize
 * @param {*} font
 * @param {*} textAlign
 */
export function fillText3(
    ctx,
    str,
    x1,
    y1,
    xx = 0,
    yy = 0,
    fontSize = 14,
    font = 'Raleway',
    textAlign = 'center',
) {
  x1 *= globalScope.scale;
  y1 *= globalScope.scale;
  xx *= globalScope.scale;
  yy *= globalScope.scale;

  ctx.font = `${Math.round(fontSize * globalScope.scale)}px ${font}`;
  ctx.textAlign = textAlign;
  ctx.fillText(
      str,
      Math.round(xx + x1 + globalScope.ox),
      Math.round(yy + y1 + globalScope.oy),
  );
}

export const oppositeDirection = {
  RIGHT: 'LEFT',
  LEFT: 'RIGHT',
  DOWN: 'UP',
  UP: 'DOWN',
};
