/**
 * Procedural 3D object factories for p5's WEBGL renderer.
 *
 * Each factory returns { draw(p), update?(p, dt), isDone?(), dispose?() }.
 * Textures bake onto offscreen `p5.Graphics` and are cached by input when the
 * output depends only on color — so regenerating a scene doesn't burn GPU
 * uploads on identical glows and ring bands.
 *
 * Sizing: `sizeNorm` is 0..1 from the host, mapped from the Size slider.
 *
 * Transparent overlays (halos, coronas, ring bands) render with depth-writes
 * disabled — that's what stops the glitchy "aura cross-fighting" you see on
 * the sun/star/rings when several additive quads coincide at the same z.
 */

// ── Small utilities ──────────────────────────────────────────────────────────

const rand   = (lo, hi) => lo + Math.random() * (hi - lo);
const chance = (p) => Math.random() < p;

const hexToRGB = (hex) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

const rgbToHSL = ({ r, g, b }) => {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  let h = 0, s = 0;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if      (mx === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (mx === g) h = ((b - r) / d + 2);
    else               h = ((r - g) / d + 4);
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
};

const hsl = (h, s, l, a = 1) =>
  `hsla(${((h % 360) + 360) % 360}, ${Math.max(0, Math.min(100, s))}%, ${Math.max(0, Math.min(100, l))}%, ${a})`;

/**
 * Disable depth writes around a draw block. Solid geometry already in the
 * depth buffer still occludes these transparent layers correctly — but the
 * layers don't fight each other, which is what causes the flickery auras.
 */
function drawTransparent(p, fn) {
  const gl = p._renderer?.GL;
  if (gl) gl.depthMask(false);
  try { fn(); } finally { if (gl) gl.depthMask(true); }
}

// ── Texture caches ───────────────────────────────────────────────────────────
// Radial glows depend only on two CSS colors — identical inputs get one shared
// GPU texture across all stars/suns/comets.

const glowCache = new Map();

function bakeRadialGlow(p, innerCSS, outerCSS, size = 256) {
  const key = `${size}|${innerCSS}|${outerCSS}`;
  const hit = glowCache.get(key);
  if (hit) return hit;
  const g = p.createGraphics(size, size);
  g.pixelDensity(1);
  const ctx = g.drawingContext;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0.0, innerCSS);
  grad.addColorStop(0.5, outerCSS);
  grad.addColorStop(1.0, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  glowCache.set(key, g);
  return g;
}

/** Marbled/gas-giant planet skin. One-off per planet (unique bands & storms). */
function bakePlanetTexture(p, baseHex) {
  const size = 512;
  const g = p.createGraphics(size, size);
  g.pixelDensity(1);
  const ctx = g.drawingContext;

  const { h, s, l } = rgbToHSL(hexToRGB(baseHex));

  // Pole→equator gradient
  const bg = ctx.createLinearGradient(0, 0, 0, size);
  bg.addColorStop(0.0, hsl(h,      Math.max(10, s * 0.7), Math.min(90, l + 20)));
  bg.addColorStop(0.5, hsl(h,      s,                     l));
  bg.addColorStop(1.0, hsl(h + 20, s * 0.8,               Math.max(6, l - 18)));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Drifting horizontal bands
  const bands = 5 + ((Math.random() * 8) | 0);
  for (let i = 0; i < bands; i++) {
    const y  = Math.random() * size;
    const bh = 10 + Math.random() * 45;
    ctx.fillStyle = hsl(h + rand(-30, 30), s, l + rand(-15, 15), 0.08 + Math.random() * 0.12);
    ctx.fillRect(0, y, size, bh);
  }

  // Storm / continent blobs (reduced from 110-200 → 70-120: still rich, half the fill work)
  const blobs = 70 + ((Math.random() * 50) | 0);
  for (let i = 0; i < blobs; i++) {
    const x  = Math.random() * size;
    const y  = Math.random() * size;
    const r  = 4 + Math.random() * 40;
    const hh = h + rand(-55, 55);
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, hsl(hh, s, l + 15, 0.45));
    gr.addColorStop(1, hsl(hh, s, l,       0));
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fine noise
  for (let i = 0; i < 300; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
  }

  return g;
}

/** Nebula cloud — smaller (256²) & fewer blobs than v1 to keep fragment cost sane. */
function bakeNebulaTexture(p, baseHex) {
  const size = 256;
  const g = p.createGraphics(size, size);
  g.pixelDensity(1);
  const ctx = g.drawingContext;

  const { h } = rgbToHSL(hexToRGB(baseHex));

  // 20 blobs instead of 45 — still cloudy, half the radial gradient cost.
  for (let i = 0; i < 20; i++) {
    const x  = size / 2 + (Math.random() - 0.5) * size * 0.7;
    const y  = size / 2 + (Math.random() - 0.5) * size * 0.7;
    const r  = 30 + Math.random() * 110;
    const hh = h + rand(-60, 60);
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, hsl(hh, 80, 55, 0.38));
    gr.addColorStop(1, hsl(hh, 80, 55, 0));
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Vignette so edges fade into space
  const edge = ctx.createRadialGradient(size / 2, size / 2, size * 0.3, size / 2, size / 2, size / 2);
  edge.addColorStop(0, "rgba(0,0,0,0)");
  edge.addColorStop(1, "rgba(0,0,0,1)");
  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, size, size);

  return g;
}

const ringCache = new Map();
/** Banded ring. Cached by color — identical colors reuse one texture. */
function bakeRingTexture(p, hotHex = "#ffbb66") {
  const key = hotHex.toLowerCase();
  const hit = ringCache.get(key);
  if (hit) return hit;

  const w = 512, hpx = 32;
  const g = p.createGraphics(w, hpx);
  g.pixelDensity(1);
  const ctx = g.drawingContext;
  ctx.clearRect(0, 0, w, hpx);
  const { h } = rgbToHSL(hexToRGB(hotHex));
  for (let i = 0; i < 140; i++) {
    const x  = Math.random() * w;
    const ww = 1 + Math.random() * 8;
    const a  = 0.12 + Math.random() * 0.55;
    ctx.fillStyle = hsl(h + rand(-15, 15), 60, 55 + Math.random() * 30, a);
    ctx.fillRect(x, 0, ww, hpx);
  }
  ringCache.set(key, g);
  return g;
}

/** Rainbow hue cycler — RGB out, so callers don't have to swap colorMode. */
function rainbowColor(p) {
  p.colorMode(p.HSB, 360, 100, 100);
  const c = p.color((p.frameCount * 3) % 360, 100, 100);
  p.colorMode(p.RGB, 255);
  return { r: p.red(c), g: p.green(c), b: p.blue(c) };
}

function colorToRGB(p, hex, rainbow) {
  if (rainbow) return rainbowColor(p);
  const c = p.color(hex);
  return { r: p.red(c), g: p.green(c), b: p.blue(c) };
}

// ── Scene bounds ─────────────────────────────────────────────────────────────
// All placed objects live inside this half-extent so they stay inside the
// framed canvas at default camera zoom. Comets wrap around these bounds.
export const SCENE_BOUND = 340;

// ── Object factories ─────────────────────────────────────────────────────────

/** Planet: textured sphere + optional ring + optional moons. */
export function createPlanet(p, { x, y, z, sizeNorm, colorHex, rainbow, animate }) {
  const radius = 30 + sizeNorm * 140;
  const tex = bakePlanetTexture(p, colorHex);

  const tiltX     = rand(-0.4, 0.4);
  const tiltZ     = rand(-0.3, 0.3);
  const spinSpeed = rand(0.15, 0.5) * (chance(0.5) ? -1 : 1);
  let spin = 0;

  const hasRings  = chance(0.4);
  const ringInner = radius * rand(1.35, 1.55);
  const ringOuter = ringInner * rand(1.4, 1.9);
  const ringTilt  = rand(-0.35, 0.35);
  const ringTex   = hasRings ? bakeRingTexture(p, colorHex) : null;

  const moonCount = 1 + ((Math.random() * 3) | 0);
  const hasMoons  = chance(0.65);
  const moons = [];
  if (hasMoons) {
    for (let i = 0; i < moonCount; i++) {
      moons.push({
        orbitR:   radius * (1.8 + Math.random() * 1.8 + i * 0.4),
        size:     radius * (0.09 + Math.random() * 0.13),
        speed:    rand(0.4, 1.2) * (chance(0.5) ? -1 : 1),
        angle:    Math.random() * Math.PI * 2,
        tiltAxis: Math.random() * Math.PI,
      });
    }
  }

  return {
    update(_p, dt) {
      if (animate) spin += spinSpeed * dt;
      for (const m of moons) m.angle += m.speed * dt;
    },
    draw(p) {
      p.push();
      p.translate(x, y, z);
      p.rotateX(tiltX);
      p.rotateZ(tiltZ);

      // Solid body (depth-writing)
      p.push();
      p.rotateY(spin);
      p.noStroke();
      p.texture(tex);
      p.ambientMaterial(255);
      p.specularMaterial(60);
      p.shininess(8);
      p.sphere(radius, 24, 18); // was 36,28
      p.pop();

      const { r, g, b } = colorToRGB(p, colorHex, rainbow);

      // Halo + rings as transparent overlays — no depth-write so they don't
      // fight each other at the planet surface.
      drawTransparent(p, () => {
        p.push();
        p.noStroke();
        p.fill(r, g, b, 35);
        p.sphere(radius * 1.08, 20, 14);
        p.pop();

        if (hasRings) {
          p.push();
          p.rotateX(Math.PI / 2 + ringTilt);
          p.noStroke();
          p.texture(ringTex);
          p.ambientMaterial(255);
          const major = (ringInner + ringOuter) / 2;
          const minor = (ringOuter - ringInner) / 2;
          p.torus(major, minor, 48, 2); // was 64,2
          p.pop();
        }
      });

      // Moons — solid, depth-writing
      for (const m of moons) {
        p.push();
        p.rotateY(m.tiltAxis);
        p.rotateX(0.3);
        p.translate(Math.cos(m.angle) * m.orbitR, 0, Math.sin(m.angle) * m.orbitR);
        p.noStroke();
        p.ambientMaterial(200, 200, 210);
        p.specularMaterial(180);
        p.sphere(m.size, 16, 12);
        p.pop();
      }

      p.pop();
    },
    dispose() { tex.remove?.(); },
  };
}

/** Small rocky moon companion. */
export function createMoon(p, { x, y, z, sizeNorm }) {
  const radius = 14 + sizeNorm * 40;
  let angle = Math.random() * Math.PI * 2;
  return {
    update(_p, dt) { angle += dt * 0.3; },
    draw(p) {
      p.push();
      p.translate(
        x + Math.cos(angle) * 8,
        y + Math.sin(angle * 0.8) * 4,
        z,
      );
      p.noStroke();
      p.ambientMaterial(200, 195, 210);
      p.specularMaterial(200);
      p.shininess(5);
      p.sphere(radius, 20, 14); // was 24,18
      p.pop();
    },
  };
}

/** Star: emissive core + pulsing corona. Corona glow is shared via cache. */
export function createStar(p, { x, y, z, sizeNorm, colorHex, rainbow }) {
  const radius = 4 + sizeNorm * 18;
  const { r: cr, g: cg, b: cb } = hexToRGB(colorHex);
  const glow = bakeRadialGlow(p,
    "rgba(255,255,255,0.95)",
    `rgba(${cr},${cg},${cb},0.4)`);

  let phase = Math.random() * Math.PI * 2;
  return {
    update(_p, dt) { phase += dt * 2.0; },
    draw(p) {
      p.push();
      p.translate(x, y, z);

      const { r, g, b } = colorToRGB(p, colorHex, rainbow);

      // Core — solid, depth-writing
      p.push();
      p.noStroke();
      p.emissiveMaterial(255, 255, 220);
      p.ambientMaterial(255);
      p.sphere(radius, 16, 12);
      p.pop();

      // Corona — transparent overlay
      drawTransparent(p, () => {
        const pulse = 1 + Math.sin(phase) * 0.1;
        p.push();
        p.noStroke();
        p.tint(r, g, b, 220);
        p.texture(glow);
        p.plane(radius * 14 * pulse, radius * 14 * pulse);
        p.noTint();
        p.pop();
      });

      p.pop();
    },
  };
}

/** Sun: bigger star with layered pulsing coronas. */
export function createSun(p, { x, y, z, sizeNorm, colorHex = "#ffcc66", rainbow }) {
  const radius = 40 + sizeNorm * 120;
  const { r: cr, g: cg, b: cb } = hexToRGB(colorHex);
  const inner = bakeRadialGlow(p, "rgba(255,255,255,0.95)", `rgba(${cr},${cg},${cb},0.7)`);
  const outer = bakeRadialGlow(p, `rgba(${cr},${cg},${cb},0.6)`, `rgba(${cr},${cg},${cb},0.05)`);

  let phase = Math.random() * Math.PI * 2;
  return {
    update(_p, dt) { phase += dt; },
    draw(p) {
      p.push();
      p.translate(x, y, z);
      const { r, g, b } = colorToRGB(p, colorHex, rainbow);

      // Core
      p.push();
      p.noStroke();
      p.emissiveMaterial(255, 240, 180);
      p.ambientMaterial(255);
      p.sphere(radius, 28, 20); // was 32,24
      p.pop();

      // Two corona layers — depth-writes off so they blend cleanly
      drawTransparent(p, () => {
        p.push();
        p.noStroke();
        p.tint(r, g, b, 220);
        p.texture(inner);
        const s1 = radius * (5 + Math.sin(phase * 1.3) * 0.4);
        p.plane(s1, s1);
        p.pop();

        p.push();
        p.noStroke();
        p.tint(r, g, b, 170);
        p.texture(outer);
        const s2 = radius * (12 + Math.sin(phase) * 0.8);
        p.plane(s2, s2);
        p.noTint();
        p.pop();
      });

      p.pop();
    },
  };
}

/** Nebula: billboarded cloud. Drifts slowly inside bounds. */
export function createNebula(p, { x, y, z, sizeNorm, colorHex, rainbow }) {
  const size = 220 + sizeNorm * 360; // was 240..760 — smaller footprint, less overdraw
  const tex  = bakeNebulaTexture(p, colorHex);
  const vx = rand(-3, 3), vy = rand(-1.5, 1.5);
  let cx = x, cy = y;
  let rot = Math.random() * Math.PI * 2;

  return {
    update(_p, dt) {
      cx += vx * dt;
      cy += vy * dt;
      // Soft wrap inside bounds so the cloud never escapes frame
      if (cx >  SCENE_BOUND) cx = -SCENE_BOUND;
      if (cx < -SCENE_BOUND) cx =  SCENE_BOUND;
      if (cy >  SCENE_BOUND) cy = -SCENE_BOUND;
      if (cy < -SCENE_BOUND) cy =  SCENE_BOUND;
      rot += dt * 0.05;
    },
    draw(p) {
      const { r, g, b } = colorToRGB(p, colorHex, rainbow);
      drawTransparent(p, () => {
        p.push();
        p.translate(cx, cy, z - 10);
        p.rotateZ(rot);
        p.noStroke();
        p.tint(r, g, b, 200);
        p.texture(tex);
        p.plane(size, size);
        p.noTint();
        p.pop();
      });
    },
    dispose() { tex.remove?.(); },
  };
}

/**
 * Comet: fast head with glowing tail. Wraps inside scene bounds so it never
 * flies permanently off-screen. No auto-death — the scene lifetime is managed
 * by the caller via clear()/dispose().
 */
export function createComet(p, { x, y, z, sizeNorm, colorHex = "#e0f7ff", rainbow }) {
  const radius = 4 + sizeNorm * 10;
  const dir = { x: rand(-1, 1), y: rand(-0.4, 0.4) };
  const n = Math.hypot(dir.x, dir.y) || 1;
  dir.x /= n; dir.y /= n;
  const speed = 220 + Math.random() * 120;
  const { r: cr, g: cg, b: cb } = hexToRGB(colorHex);
  const glow = bakeRadialGlow(p,
    "rgba(255,255,255,0.95)",
    `rgba(${cr},${cg},${cb},0.25)`);

  let cx = x, cy = y;

  const wrap = () => {
    // Respawn on the opposite edge with a fresh direction so the trail
    // keeps feeling organic rather than ping-ponging.
    if (cx >  SCENE_BOUND || cx < -SCENE_BOUND || cy >  SCENE_BOUND || cy < -SCENE_BOUND) {
      const edge = Math.floor(Math.random() * 4);
      if (edge === 0) { cx = -SCENE_BOUND; cy = rand(-SCENE_BOUND, SCENE_BOUND); dir.x =  1; dir.y = rand(-0.4, 0.4); }
      if (edge === 1) { cx =  SCENE_BOUND; cy = rand(-SCENE_BOUND, SCENE_BOUND); dir.x = -1; dir.y = rand(-0.4, 0.4); }
      if (edge === 2) { cy = -SCENE_BOUND; cx = rand(-SCENE_BOUND, SCENE_BOUND); dir.y =  1; dir.x = rand(-0.4, 0.4); }
      if (edge === 3) { cy =  SCENE_BOUND; cx = rand(-SCENE_BOUND, SCENE_BOUND); dir.y = -1; dir.x = rand(-0.4, 0.4); }
      const n2 = Math.hypot(dir.x, dir.y) || 1;
      dir.x /= n2; dir.y /= n2;
    }
  };

  return {
    update(_p, dt) {
      cx += dir.x * speed * dt;
      cy += dir.y * speed * dt;
      wrap();
    },
    draw(p) {
      const { r, g, b } = colorToRGB(p, colorHex, rainbow);

      p.push();
      p.translate(cx, cy, z);

      // Tail — transparent, behind head
      drawTransparent(p, () => {
        const angle = Math.atan2(dir.y, dir.x);
        p.push();
        p.rotateZ(angle);
        p.translate(-radius * 14, 0, 0);
        p.noStroke();
        p.tint(r, g, b, 220);
        p.texture(glow);
        p.plane(radius * 28, radius * 6);
        p.noTint();
        p.pop();
      });

      // Head — solid
      p.push();
      p.noStroke();
      p.emissiveMaterial(255, 250, 230);
      p.ambientMaterial(255);
      p.sphere(radius, 12, 10);
      p.pop();

      p.pop();
    },
  };
}

/** Black hole: dark core + swirling accretion disk + halo. */
export function createBlackHole(p, { x, y, z, sizeNorm }) {
  const radius    = 20 + sizeNorm * 90;
  const ringMajor = radius * 2.2;
  const ringMinor = radius * 0.25;
  const ringTex   = bakeRingTexture(p, "#ffa040");
  const halo      = bakeRadialGlow(p, "rgba(255,180,120,0.85)", "rgba(60,20,80,0)");

  let rot = 0;
  return {
    update(_p, dt) { rot += dt * 0.8; },
    draw(p) {
      p.push();
      p.translate(x, y, z);

      drawTransparent(p, () => {
        p.push();
        p.noStroke();
        p.tint(255, 180, 140, 200);
        p.texture(halo);
        p.plane(radius * 10, radius * 10);
        p.noTint();
        p.pop();

        p.push();
        p.rotateX(Math.PI / 2 + 0.2);
        p.rotateZ(rot);
        p.noStroke();
        p.texture(ringTex);
        p.ambientMaterial(255);
        p.torus(ringMajor, ringMinor, 48, 2); // was 64,2
        p.pop();
      });

      // Core — solid black
      p.push();
      p.noStroke();
      p.fill(0);
      p.ambientMaterial(0);
      p.sphere(radius, 24, 18); // was 28,20
      p.pop();

      p.pop();
    },
  };
}

/** Standalone ring system. */
export function createRings(p, { x, y, z, sizeNorm, colorHex, rainbow }) {
  const inner = 40 + sizeNorm * 140;
  const outer = inner * 1.6;
  const ringTex = bakeRingTexture(p, colorHex);
  const tiltX = rand(-0.4, 0.4);
  const tiltZ = rand(-0.3, 0.3);
  let rot = Math.random() * Math.PI * 2;

  return {
    update(_p, dt) { rot += dt * 0.1; },
    draw(p) {
      drawTransparent(p, () => {
        p.push();
        p.translate(x, y, z);
        p.rotateX(Math.PI / 2 + tiltX);
        p.rotateZ(rot + tiltZ);
        p.noStroke();
        p.texture(ringTex);
        const { r, g, b } = colorToRGB(p, colorHex, rainbow);
        p.tint(r, g, b, 255);
        p.ambientMaterial(255);
        const major = (inner + outer) / 2;
        const minor = (outer - inner) / 2;
        p.torus(major, minor, 48, 2); // was 64,2
        p.pop();
      });
    },
  };
}

/**
 * Persistent background star field.
 *
 * Rewrite: v1 pushed/popped and flipped colorMode for every one of 400 stars
 * and called sphere() for each — ~2400 state changes + 400 draw calls per
 * frame, which is what made hover feedback feel dead on mid-range machines
 * and stalled entirely in Firefox. v2 bins the stars into three brightness
 * tiers and emits each tier as a single beginShape(POINTS) call: three draw
 * calls total, per-frame twinkle via a global alpha multiplier.
 */
export function createStarField(p, count = 220) {
  // Three tiers — faint/medium/bright — give the same visual variety as
  // per-star color without the per-star state changes.
  const tiers = [
    { weight: 1.4, alpha: 140, stars: [] },
    { weight: 2.2, alpha: 190, stars: [] },
    { weight: 3.5, alpha: 240, stars: [] },
  ];

  for (let i = 0; i < count; i++) {
    const r = 600 + Math.random() * 900;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    const star = {
      x: r * Math.sin(ph) * Math.cos(th),
      y: r * Math.sin(ph) * Math.sin(th),
      z: r * Math.cos(ph) - 200,
    };
    // Bias: most stars faint, few bright
    const roll = Math.random();
    const tier = roll < 0.65 ? 0 : roll < 0.9 ? 1 : 2;
    tiers[tier].stars.push(star);
  }

  return {
    draw(p) {
      p.push();
      p.noFill();
      // Global twinkle — one sin() per frame rather than per star
      const globalTwinkle = 0.7 + Math.sin(p.frameCount * 0.02) * 0.3;

      for (const t of tiers) {
        p.strokeWeight(t.weight);
        p.stroke(220, 230, 255, t.alpha * globalTwinkle);
        p.beginShape(p.POINTS);
        for (const s of t.stars) p.vertex(s.x, s.y, s.z);
        p.endShape();
      }
      p.pop();
    },
  };
}
