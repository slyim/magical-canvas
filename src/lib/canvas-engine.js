import { CANVAS_SIZE, PIXEL_DENSITY } from './constants.js';

/**
 * Initializes the p5 canvas inside #p5-container.
 * Sets up a fixed CANVAS_SIZE × CANVAS_SIZE internal resolution
 * (1200×1200 for Instagram-ready export) that scales visually via CSS.
 * Returns the p5 canvas element.
 */
export function setupCanvas(p) {
  p.pixelDensity(PIXEL_DENSITY); // Standardize for consistent performance
  const canvas = p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
  canvas.parent('p5-container');

  // CSS fills the container; the 1200px render resolution stays fixed
  canvas.elt.style.width  = '100%';
  canvas.elt.style.height = '100%';

  // Start fully transparent so the CSS background (#0d0617) shows through
  p.clear(0, 0, 0, 0);

  // Round line caps for smooth, connected brush strokes
  p.strokeCap(p.ROUND);
  p.strokeJoin(p.ROUND);

  return canvas;
}
