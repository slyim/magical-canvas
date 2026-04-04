import { SPARKLE_PROBABILITY_THRESHOLD, SPARK_PROBABILITY_THRESHOLD } from './constants.js';

/**
 * Creates a stateful drawing engine.
 * Tracks lastDrawX/lastDrawY and currentThickness across frames
 * so brush strokes render as smooth connected lines.
 */
export function createDrawingEngine(p) {
  let lastDrawX = -1;
  let lastDrawY = -1;
  let currentThickness = 25;

  return {
    /**
     * Draw at the current input position.
     * opts: { tool, inputX, inputY, prevInputX, prevInputY,
     *         currentPressure, color, size, opacity, isRainbow, isAnim }
     */
    drawAtPoint(opts, particleSystem) {
      const {
        tool, inputX, inputY, prevInputX, prevInputY,
        currentPressure, color, size, opacity, isRainbow, isAnim,
      } = opts;

      if (tool === 'eraser') {
        drawEraser(p, inputX, inputY, prevInputX, prevInputY, size, opacity);
      } else {
        // Initialize tracking position at the start of each stroke
        if (lastDrawX === -1) {
          lastDrawX = inputX;
          lastDrawY = inputY;
          currentThickness = size;
        }

        currentThickness = Math.max(size * currentPressure, size * 0.1);

        const c = buildStrokeColor(p, color, isRainbow);

        // Neon glow via native canvas shadow API
        p.drawingContext.shadowBlur  = size * p.random(0.6, 1.0);
        p.drawingContext.shadowColor = c.toString();

        // Brush opacity: normalized 0–1, scaled by a random 180–220 alpha base
        // (This intentionally differs from eraser's 0–255 scale — they use different APIs)
        const opacityNorm = opacity / 100.0;
        const alphaBase   = p.random(180, 220) * opacityNorm;

        p.stroke(p.red(c), p.green(c), p.blue(c), alphaBase);
        p.strokeWeight(currentThickness);

        drawShape(p, tool, inputX, inputY, currentThickness, c, alphaBase, lastDrawX, lastDrawY);
        drawSparkles(p, inputX, inputY, size, c);
        drawSparks(p, inputX, inputY, lastDrawX, lastDrawY, size, currentThickness, c, isAnim, particleSystem);

        lastDrawX = inputX;
        lastDrawY = inputY;
      }
    },

    /** Reset tracking at end of stroke (called when input is lifted). */
    resetStroke() {
      lastDrawX = -1;
    },
  };
}

// ── Internal helpers ─────────────────────────────────────────────────────────

function drawEraser(p, inputX, inputY, prevInputX, prevInputY, size, opacity) {
  p.drawingContext.shadowBlur = 0;
  // p5.js erase() uses 0–255 blend strength (different from brush's normalized 0–1)
  const eraseStrength = p.map(opacity, 0, 100, 0, 255);
  p.erase(eraseStrength, eraseStrength);
  p.strokeWeight(size * 1.5); // Eraser slightly thicker than brush for usability
  p.line(inputX, inputY, prevInputX, prevInputY);
  p.noErase();
}

/**
 * Computes the final stroke color with iridescent hue shifting.
 * Rainbow mode overrides the base color with a fast frame-cycling hue.
 */
function buildStrokeColor(p, baseColorHex, isRainbow) {
  const baseC = p.color(baseColorHex);
  p.colorMode(p.HSB);
  let h = p.hue(baseC);
  let s = p.saturation(baseC);
  let b = p.brightness(baseC);

  if (isRainbow) {
    h = (p.frameCount * 5) % 360; // Rapid hue cycle
    s = 100;
    b = 100;
  }

  // Pearlescent effect: randomize hue ±25° and saturation ±10
  const offsetH = (h + p.random(-25, 25) + 360) % 360;
  const sSat    = p.constrain(s + p.random(-10, 10), 0, 100);
  const c       = p.color(offsetH, sSat, b);
  p.colorMode(p.RGB); // Restore for all subsequent rendering
  return c;
}

function drawShape(p, tool, inputX, inputY, thickness, c, alphaBase, lastDrawX, lastDrawY) {
  if (tool === 'square') {
    p.noStroke();
    p.fill(p.red(c), p.green(c), p.blue(c), alphaBase);
    p.rectMode(p.CENTER);
    p.rect(inputX, inputY, thickness * 2.0, thickness * 2.0);
  } else if (tool === 'ellipse') {
    p.noStroke();
    p.fill(p.red(c), p.green(c), p.blue(c), alphaBase);
    p.ellipse(inputX, inputY, thickness * 2.0, thickness * 2.0);
  } else if (tool === 'triangle') {
    p.noStroke();
    p.fill(p.red(c), p.green(c), p.blue(c), alphaBase);
    const s = thickness * 1.5;
    p.triangle(
      inputX,              inputY - s,
      inputX - s * 0.866,  inputY + s * 0.5,
      inputX + s * 0.866,  inputY + s * 0.5,
    );
  } else {
    // Default brush: continuous connected line
    p.line(lastDrawX, lastDrawY, inputX, inputY);
  }
}

/** Scatter ambient sparkle dots and cross-stars around the cursor. */
function drawSparkles(p, inputX, inputY, baseSize, c) {
  if (p.random(1) <= SPARKLE_PROBABILITY_THRESHOLD) return;

  const sparkBase = baseSize * 0.5;
  const spread    = baseSize * p.random(1, 3);
  const px        = inputX + p.random(-spread, spread);
  const py        = inputY + p.random(-spread, spread);

  p.drawingContext.shadowBlur  = Math.max(3, sparkBase);
  p.drawingContext.shadowColor = c.toString();

  if (p.random(1) > 0.7) {
    // Cross-star sparkle
    p.stroke(p.red(c), p.green(c), p.blue(c), p.random(150, 255));
    p.strokeWeight(p.random(1, 2));
    p.noFill();
    const crossS = p.random(2, sparkBase * 0.5);
    p.line(px - crossS, py, px + crossS, py);
    p.line(px, py - crossS, px, py + crossS);
  } else {
    // Circle sparkle
    p.noStroke();
    p.fill(p.red(c), p.green(c), p.blue(c), p.random(150, 255));
    p.circle(px, py, p.random(1, Math.max(2, sparkBase * 0.5)));
  }
}

/** Emit energetic flying line sparks or animated particles from the stroke. */
function drawSparks(p, inputX, inputY, lastDrawX, lastDrawY, baseSize, thickness, c, isAnim, particleSystem) {
  if (p.random(1) <= SPARK_PROBABILITY_THRESHOLD) return;

  const px    = inputX + p.random(-baseSize * 1.5, baseSize * 1.5);
  const py    = inputY + p.random(-baseSize * 1.5, baseSize * 1.5);
  const pSize = thickness * p.random(0.5, 1.5);

  if (isAnim) {
    // Animated particle: drifts in the stroke direction
    const dirX = inputX - lastDrawX;
    const dirY = inputY - lastDrawY;

    particleSystem.add({
      x: px,
      y: py,
      vx: dirX * p.random(0.1, 0.4) + p.random(-4, 4),
      vy: dirY * p.random(0.1, 0.4) + p.random(-4, 4),
      life:     p.random(150, 255),
      size:     pSize,
      angle:    p.random(p.TWO_PI),
      rotSpeed: p.random(-0.15, 0.15),
      r:        p.red(c),
      g:        p.green(c),
      b:        p.blue(c),
      lenMult:  p.random(0.2, 0.7),
    });
  } else {
    // Static spark: single random-angle line, no shadow blur for performance
    p.drawingContext.shadowBlur = 0;
    p.stroke(p.red(c), p.green(c), p.blue(c), p.random(150, 255));
    p.strokeWeight(Math.max(1, pSize * 0.05));
    p.noFill();
    const l = pSize * p.random(0.2, 0.7);
    const a = p.random(p.TWO_PI);
    // Trig avoids translate/rotate matrix overhead
    p.beginShape();
    p.vertex(px - Math.cos(a) * l, py - Math.sin(a) * l);
    p.vertex(px + Math.cos(a) * l, py + Math.sin(a) * l);
    p.endShape();
  }
}
