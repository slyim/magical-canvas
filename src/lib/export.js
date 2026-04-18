import { BACKGROUND_HEX } from './constants.js';

/**
 * Exports the 2D canvas as a 1200×1200 PNG.
 *
 * Explicit `:not(.three-d-canvas)` selector so this never grabs the WEBGL
 * canvas — the 3D renderer is constructed first in main.ts, which means a
 * plain `#p5-container canvas` lookup returns the 3D one even while the 2D
 * view is visible.
 *
 * Composites the dark background color behind the transparent p5 canvas so
 * the exported image always has the correct theme background.
 */
export function exportPNG() {
  const domCanvas = document.querySelector('#p5-container canvas:not(.three-d-canvas)');
  if (!domCanvas) return;

  const temp = document.createElement('canvas');
  temp.width  = domCanvas.width;
  temp.height = domCanvas.height;

  const ctx = temp.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = BACKGROUND_HEX;
  ctx.fillRect(0, 0, temp.width, temp.height);
  ctx.drawImage(domCanvas, 0, 0);

  const link = document.createElement('a');
  link.download = 'MagicalArtwork.png';
  link.href = temp.toDataURL('image/png');
  link.click();
}

/**
 * Sets up a hidden file input for PNG/JPEG/WebP import.
 * Calls onImport(img) with the loaded p5.Image when a file is selected.
 * The input element is cleaned up automatically after each selection
 * so the same file can be re-imported.
 */
export function setupImport(p, onImport) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/png, image/jpeg, image/webp';
  input.style.display = 'none';
  document.body.appendChild(input);

  input.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result;
      if (dataUrl) {
        p.loadImage(dataUrl, (img) => onImport(img));
      }
    };
    reader.readAsDataURL(file);
    input.value = ''; // Allow re-importing the same file
  });

  return input;
}
