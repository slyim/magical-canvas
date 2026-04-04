import { FADE_ALPHA_MIN, FADE_ALPHA_MAX } from './constants.js';

/**
 * Applies the fade/trail effect by drawing a near-transparent
 * destination-out rectangle over the entire canvas each frame.
 * Very low alpha values create long, dramatic neon trails.
 */
export function applyFadeEffect(p, speedVal) {
  const ctx = p.drawingContext;
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.shadowBlur = 0;
  const fadeAlpha = p.map(speedVal, 1, 60, FADE_ALPHA_MIN, FADE_ALPHA_MAX);
  ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
  ctx.fillRect(0, 0, p.width, p.height);
  ctx.restore();
}
