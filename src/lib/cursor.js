let cursorRing = null;
let canvasEl = null;
let circleEl = null;
let squareEl = null;
let triangleEl = null;

const resolve = () => {
  cursorRing ??= document.getElementById("cursor-ring");
  canvasEl ??= document.querySelector("#p5-container canvas");
  circleEl ??= document.getElementById("cursor-circle");
  squareEl ??= document.getElementById("cursor-square");
  triangleEl ??= document.getElementById("cursor-triangle");
};

const SHAPE_SCALE = {
  eraser: 1.5,
  square: 2.0,
  ellipse: 2.0,
  triangle: 3.0, // viewBox radius 50 → 3× scale matches p.triangle()'s 1.5× radius
  brush: 1.0,
};

/**
 * Syncs the SVG cursor ring's position, shape, and size to the active tool.
 * Hidden on touch and when the pointer leaves the canvas.
 */
export function updateCursorRing(p, isMouseOverCanvas, ui, tool) {
  resolve();
  if (!cursorRing || !canvasEl) return;

  const isTouch = p.touches && p.touches.length > 0;
  const panning = p.keyIsDown(32);

  if (!isMouseOverCanvas || panning || isTouch) {
    cursorRing.style.display = "none";
    canvasEl.style.cursor = panning
      ? p.mouseIsPressed ? "grabbing" : "grab"
      : "default";
    return;
  }

  cursorRing.style.display = "block";
  canvasEl.style.cursor = "none";

  // Canvas-space → CSS pixel space
  const scaleFactor = canvasEl.clientWidth / p.width;
  const screenThickness = ui.size * scaleFactor;

  if (circleEl) circleEl.style.display = "none";
  if (squareEl) squareEl.style.display = "none";
  if (triangleEl) triangleEl.style.display = "none";

  const finalSize = screenThickness * (SHAPE_SCALE[tool] ?? 1.0);
  const shown =
    tool === "square" ? squareEl :
    tool === "triangle" ? triangleEl :
    circleEl; // brush, eraser, ellipse
  if (shown) shown.style.display = "block";

  cursorRing.style.width = finalSize + "px";
  cursorRing.style.height = finalSize + "px";
  cursorRing.style.left = p.winMouseX + "px";
  cursorRing.style.top = p.winMouseY + "px";
}
