import { DEFAULT_COLOR, DEFAULT_SIZE, DEFAULT_OPACITY } from './constants.js';

/**
 * Reads all UI control values from the DOM once per call.
 * Called inside p.draw() each frame so values are always current.
 */
export function getUIState() {
  return {
    color:     document.getElementById('color-picker')?.value   ?? DEFAULT_COLOR,
    size:      parseInt(document.getElementById('size-picker')?.value    ?? String(DEFAULT_SIZE)),
    opacity:   parseInt(document.getElementById('opacity-picker')?.value ?? String(DEFAULT_OPACITY)),
    fadeSpeed: parseInt(document.getElementById('fade-speed')?.value     ?? '5'),

    isFadeActive:     document.getElementById('fade-toggle')?.classList.contains('active')     ?? false,
    isRainbowActive:  document.getElementById('rainbow-toggle')?.classList.contains('active')  ?? false,
    isAnimActive:     document.getElementById('anim-toggle')?.classList.contains('active')     ?? true,
    isEraserActive:   document.getElementById('eraser-toggle')?.classList.contains('active')   ?? false,
    isSquareActive:   document.getElementById('square-toggle')?.classList.contains('active')   ?? false,
    isEllipseActive:  document.getElementById('ellipse-toggle')?.classList.contains('active')  ?? false,
    isTriangleActive: document.getElementById('triangle-toggle')?.classList.contains('active') ?? false,
  };
}

/**
 * Returns the currently active drawing tool name.
 * Defaults to 'brush' when no shape tool is active.
 */
export function getActiveTool(ui) {
  if (ui.isEraserActive)   return 'eraser';
  if (ui.isSquareActive)   return 'square';
  if (ui.isEllipseActive)  return 'ellipse';
  if (ui.isTriangleActive) return 'triangle';
  return 'brush';
}
