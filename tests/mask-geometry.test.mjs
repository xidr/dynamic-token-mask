import test from "node:test";
import assert from "node:assert/strict";
import {MASK_SHAPES, containsMaskPoint, toCircle, toRecord, traceMaskPath} from "../scripts/mask-geometry.mjs";

const frame = {x: 150, y: 75, radius: 50};

function verticesFor(shape, radiusX = frame.radius, radiusY = frame.radius) {
  const points = [];
  const path = {
    moveTo(x, y) { assert.equal(points.length, 0); points.push({x, y}); },
    lineTo(x, y) { points.push({x, y}); },
    closePath() { assert.ok(points.length >= 3); }
  };
  traceMaskPath(path, shape, frame.x, frame.y, radiusX, radiusY);
  return points;
}

test("shape changes preserve off-center source framing on rectangular images", () => {
  for (const shape of MASK_SHAPES) {
    const record = toRecord("test.png", frame, 400, 150, shape);
    assert.equal(record.shape, shape);
    assert.deepEqual(toCircle(record, 400, 150), frame);
  }
});

test("regular hexagons touch the oriented extremes and include their edges", () => {
  for (const shape of ["hex-flat", "hex-pointy"]) {
    const vertices = verticesFor(shape);
    assert.equal(vertices.length, 6);
    const flat = shape === "hex-flat";
    const extentX = Math.max(...vertices.map(p => p.x - frame.x));
    const extentY = Math.max(...vertices.map(p => p.y - frame.y));
    assert.equal(flat ? extentX : extentY, frame.radius);
    assert.ok(Math.abs((flat ? extentY : extentX) - frame.radius * Math.sqrt(3) / 2) < 1e-12);
    for (const [i, a] of vertices.entries()) {
      const b = vertices[(i + 1) % vertices.length];
      assert.ok(Math.abs(Math.hypot(a.x - b.x, a.y - b.y) - frame.radius) < 1e-12);
      assert.ok(containsMaskPoint(shape, frame, a));
      assert.ok(containsMaskPoint(shape, frame, {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2}));
    }
    assert.equal(containsMaskPoint(shape, frame,
      {x: frame.x + (flat ? 0 : 1) * frame.radius, y: frame.y + (flat ? 1 : 0) * frame.radius}), false);
  }
});

test("square, circle and hexagons differ at corners and respect the frame boundary", () => {
  const corner = {x: 200, y: 125};
  for (const shape of MASK_SHAPES) {
    assert.equal(containsMaskPoint(shape, frame, corner), shape === "square");
    assert.ok(containsMaskPoint(shape, frame, frame));
    assert.equal(containsMaskPoint(shape, frame, {x: 200.01, y: 75}), false);
  }
  assert.ok(containsMaskPoint(undefined, frame, {x: 200, y: 75}));
  assert.deepEqual(verticesFor("square", 60, 30), [
    {x: 210, y: 105}, {x: 90, y: 105}, {x: 90, y: 45}, {x: 210, y: 45}
  ]);
});
