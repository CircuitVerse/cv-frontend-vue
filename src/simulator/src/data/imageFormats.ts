/**
 * Encoders for the image formats a canvas cannot produce on its own.
 * `toDataURL` silently falls back to PNG for anything it does not support,
 * so these formats are written from the raw pixels instead.
 * @category data
 */

/** Image types that have to be encoded here rather than by the canvas. */
export const rawEncodedTypes = ["bmp", "tiff"];

/**
 * Encode pixels as an uncompressed 24 bit BMP.
 */
export function encodeBmp(rgba: Uint8ClampedArray, width: number, height: number): Uint8Array {
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const pixelBytes = rowSize * height;
  const out = new Uint8Array(54 + pixelBytes);
  const header = new DataView(out.buffer);

  out[0] = 0x42;
  out[1] = 0x4d;
  header.setUint32(2, out.length, true);
  header.setUint32(10, 54, true);
  header.setUint32(14, 40, true);
  header.setInt32(18, width, true);
  header.setInt32(22, height, true);
  header.setUint16(26, 1, true);
  header.setUint16(28, 24, true);
  header.setUint32(34, pixelBytes, true);

  for (let y = 0; y < height; y += 1) {
    let at = 54 + (height - 1 - y) * rowSize;
    let from = y * width * 4;
    for (let x = 0; x < width; x += 1) {
      out[at] = rgba[from + 2];
      out[at + 1] = rgba[from + 1];
      out[at + 2] = rgba[from];
      at += 3;
      from += 4;
    }
  }

  return out;
}

/**
 * Encode pixels as an uncompressed baseline RGB TIFF.
 */
export function encodeTiff(rgba: Uint8ClampedArray, width: number, height: number): Uint8Array {
  const pixelBytes = width * height * 3;
  const padToEven = pixelBytes % 2;
  const bitsAt = 8 + pixelBytes + padToEven;
  const xResolutionAt = bitsAt + 6;
  const yResolutionAt = xResolutionAt + 8;
  const ifdAt = yResolutionAt + 8;

  const SHORT = 3;
  const LONG = 4;
  const RATIONAL = 5;
  const entries: [number, number, number, number][] = [
    [256, LONG, 1, width],
    [257, LONG, 1, height],
    [258, SHORT, 3, bitsAt],
    [259, SHORT, 1, 1],
    [262, SHORT, 1, 2],
    [273, LONG, 1, 8],
    [277, SHORT, 1, 3],
    [278, LONG, 1, height],
    [279, LONG, 1, pixelBytes],
    [282, RATIONAL, 1, xResolutionAt],
    [283, RATIONAL, 1, yResolutionAt],
    [296, SHORT, 1, 2],
  ];

  const out = new Uint8Array(ifdAt + 2 + entries.length * 12 + 4);
  const view = new DataView(out.buffer);

  out[0] = 0x49;
  out[1] = 0x49;
  view.setUint16(2, 42, true);
  view.setUint32(4, ifdAt, true);

  for (let i = 0; i < width * height; i += 1) {
    out[8 + i * 3] = rgba[i * 4];
    out[9 + i * 3] = rgba[i * 4 + 1];
    out[10 + i * 3] = rgba[i * 4 + 2];
  }

  out.set([8, 0, 8, 0, 8, 0], bitsAt);
  view.setUint32(xResolutionAt, 72, true);
  view.setUint32(xResolutionAt + 4, 1, true);
  view.setUint32(yResolutionAt, 72, true);
  view.setUint32(yResolutionAt + 4, 1, true);

  view.setUint16(ifdAt, entries.length, true);
  entries.forEach(([tag, type, count, value], i) => {
    const at = ifdAt + 2 + i * 12;
    view.setUint16(at, tag, true);
    view.setUint16(at + 2, type, true);
    view.setUint32(at + 4, count, true);
    if (type === SHORT && count === 1) view.setUint16(at + 8, value, true);
    else view.setUint32(at + 8, value, true);
  });

  return out;
}

/**
 * Read a canvas back as a blob in one of the formats above.
 */
export function encodeCanvas(canvas: HTMLCanvasElement, imgType: string): Blob {
  const { width, height } = canvas;
  const { data } = canvas.getContext("2d")!.getImageData(0, 0, width, height);
  const bytes =
    imgType === "bmp" ? encodeBmp(data, width, height) : encodeTiff(data, width, height);
  return new Blob([bytes], { type: `image/${imgType}` });
}
