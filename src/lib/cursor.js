/**
 * Updates the SVG cursor ring position and shape to match the active tool and brush size.
 * The ring is hidden on touch input (no pointer to follow) and when mouse leaves the canvas.
 */
export function updateCursorRing(p, isMouseOverCanvas, ui, tool) {
  const cursorRing = document.getElementById('cursor-ring');
  const canvasEl   = document.querySelector('#p5-container canvas');
  if (!cursorRing || !canvasEl) return;

  // Hide cursor ring on touch devices — there's no pointer to follow
  const isTouch = p.touches && p.touches.length > 0;

  if (!isMouseOverCanvas || p.keyIsDown(32) || isTouch) {
    cursorRing.style.display = 'none';
    canvasEl.style.cursor = p.keyIsDown(32) ? (p.mouseIsPressed ? 'grabbing' : 'grab') : 'default';
    return;
  }

  cursorRing.style.display = 'block';
  canvasEl.style.cursor = 'none';

  // Map the 1200px canvas coordinate space into CSS screen pixels
  const scaleFactor = canvasEl.clientWidth / p.width;
  const screenThickness = ui.size * scaleFactor;

  const circleEl   = document.getElementById('cursor-circle');
  const squareEl   = document.getElementById('cursor-square');
  const triangleEl = document.getElementById('cursor-triangle');

  // Reset all shapes, then show the one that matches the active tool
  if (circleEl)   circleEl.style.display   = 'none';
  if (squareEl)   squareEl.style.display   = 'none';
  if (triangleEl) triangleEl.style.display = 'none';

  let finalSize = screenThickness;

  if (tool === 'eraser') {
    if (circleEl) circleEl.style.display = 'block';
    finalSize = screenThickness * 1.5;
  } else if (tool === 'square') {
    if (squareEl) squareEl.style.display = 'block';
    finalSize = screenThickness * 2.0;
  } else if (tool === 'ellipse') {
    if (circleEl) circleEl.style.display = 'block';
    finalSize = screenThickness * 2.0;
  } else if (tool === 'triangle') {
    if (triangleEl) triangleEl.style.display = 'block';
    finalSize = screenThickness * 3.0; // SVG viewBox radius=50; 3x scale = radius 1.5x, matching p.triangle()
  } else {
    if (circleEl) circleEl.style.display = 'block';
    finalSize = screenThickness; // Standard brush
  }

  cursorRing.style.width  = finalSize + 'px';
  cursorRing.style.height = finalSize + 'px';
  cursorRing.style.left   = p.winMouseX + 'px';
  cursorRing.style.top    = p.winMouseY + 'px';
}
