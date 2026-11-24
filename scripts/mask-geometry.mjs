/** Geometry uses source-image pixels; the persisted radius uses the shorter dimension. */
export function constrainCircle({x, y, radius}, width, height, minimumRadius = Math.min(width, height) / 1000) {
  radius = Math.max(minimumRadius, Math.min(radius, width / 2, height / 2));
  return {x: Math.max(radius, Math.min(x, width - radius)),
    y: Math.max(radius, Math.min(y, height - radius)), radius};
}

export function toCircle(record, width, height) {
  const shorterSide = Math.min(width, height);
  const radius = (record?.radius ?? 0.5) * shorterSide;
  return constrainCircle({x: (record?.centerX ?? 0.5) * width,
    y: (record?.centerY ?? 0.5) * height, radius}, width, height, Math.min(shorterSide / 1000, radius));
}

export function toRecord(src, circle, imageWidth, imageHeight, shape) {
  return {src, centerX: circle.x / imageWidth, centerY: circle.y / imageHeight,
    radius: circle.radius / Math.min(imageWidth, imageHeight), imageWidth, imageHeight,
    ...(shape === undefined ? {} : {shape})};
}

export const MASK_SHAPES = Object.freeze(["circle", "square", "hex-flat", "hex-pointy"]);

// Vertices run clockwise in canvas coordinates, relative to half the square sampling frame.
const apothem = Math.sqrt(3) / 2;
const outlines = {
  square: [[1, 1], [-1, 1], [-1, -1], [1, -1]],
  "hex-flat": [[1, 0], [0.5, apothem], [-0.5, apothem], [-1, 0], [-0.5, -apothem], [0.5, -apothem]],
  "hex-pointy": [[0, -1], [apothem, -0.5], [apothem, 0.5], [0, 1], [-apothem, 0.5], [-apothem, -0.5]]
};

/** Horizontal extent through the center, in units of the sampling frame's half-size. */
export function maskRightExtent(shape) {
  return shape === "circle" ? 1 : Math.max(...outlines[shape].map(([x]) => x));
}

/** Append an outline in canvas coordinates, allowing independent display scales for each axis. */
export function traceMaskPath(context, shape = "circle", x, y, radiusX, radiusY = radiusX) {
  if (shape === "circle") {
    if (radiusX === radiusY) context.arc(x, y, radiusX, 0, 2 * Math.PI);
    else context.ellipse(x, y, radiusX, radiusY, 0, 0, 2 * Math.PI);
    return;
  }
  const vertices = outlines[shape];
  context.moveTo(x + radiusX * vertices[0][0], y + radiusY * vertices[0][1]);
  for (const [dx, dy] of vertices.slice(1)) context.lineTo(x + radiusX * dx, y + radiusY * dy);
  context.closePath();
}

/** Fill a concentric band whose perpendicular width is a fraction of the square crop side. */
export function drawMaskBorder(context, shape = "circle", border, x, y, radiusX, radiusY = radiusX) {
  if (!border?.enabled) return;
  const sideInset = 2 * border.widthPercent / 100;
  const innerScale = 1 - sideInset / (shape.startsWith("hex-") ? apothem : 1);
  context.beginPath();
  traceMaskPath(context, shape, x, y, radiusX, radiusY);
  // Canvas arcs connect to the previous subpath unless the inner contour starts explicitly.
  if (shape === "circle") context.moveTo(x + radiusX * innerScale, y);
  traceMaskPath(context, shape, x, y, radiusX * innerScale, radiusY * innerScale);
  context.fillStyle = border.color;
  context.fill("evenodd");
}

/** Test in source-image pixels against the same convex outline used for drawing. */
export function containsMaskPoint(shape = "circle", {x, y, radius}, point) {
  const dx = (point.x - x) / radius;
  const dy = (point.y - y) / radius;
  const tolerance = 1e-12;
  if (shape === "circle") return Math.hypot(dx, dy) <= 1 + tolerance;
  const vertices = outlines[shape];
  return vertices.every(([ax, ay], index) => {
    const [bx, by] = vertices[(index + 1) % vertices.length];
    return (bx - ax) * (dy - ay) - (by - ay) * (dx - ax) >= -tolerance;
  });
}

export function resolveImageURL(src, base) {
  if (typeof src !== "string" || !src.trim() || src.includes("*") || src.trimStart().startsWith("#")) return null;
  try {
    const url = new URL(src, base);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

/** Reject animated containers rather than silently authoring a mask against their first frame. */
export function isSupportedStaticImage(buffer) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const text = (start, length) => String.fromCharCode(...bytes.subarray(start, start + length));
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return true;
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b)) {
    for (let offset = 8; offset + 12 <= bytes.length;) {
      const size = view.getUint32(offset);
      if (offset + 12 + size > bytes.length) return false;
      const type = text(offset + 4, 4);
      if (["acTL", "fcTL", "fdAT"].includes(type)) return false;
      if (type === "IEND") return true;
      offset += 12 + size;
    }
    return false;
  }
  if (bytes.length >= 12 && text(0, 4) === "RIFF" && text(8, 4) === "WEBP") {
    const end = view.getUint32(4, true) + 8;
    if (end > bytes.length) return false;
    let image = false;
    let offset = 12;
    for (; offset + 8 <= end;) {
      const type = text(offset, 4);
      const size = view.getUint32(offset + 4, true);
      if (offset + 8 + size > end) return false;
      if (type === "ANIM" || type === "ANMF") return false;
      if (type === "VP8X" && size >= 1 && (bytes[offset + 8] & 2)) return false;
      if (type === "VP8 " || type === "VP8L") image = true;
      offset += 8 + size + (size % 2);
    }
    return image && offset === end;
  }
  return false;
}
