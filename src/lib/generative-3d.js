/**
 * Procedural 3D object factories for p5's WEBGL renderer.
 *
 * Every factory returns { draw(p), update?(p, dt), isDone?() }.
 * Textures are drawn once onto a p5.Graphics (offscreen 2D canvas) and applied
 * via texture() — p5 uploads them to the GPU lazily, so regenerating per click
 * is cheap enough for an interactive scene.
 *
 * Sizing: `sizeNorm` is a 0..1 value the host derives from the Size slider,
 * so users can scale their brush/object size with one control across both modes.
 */

// ── Small utilities ──────────────────────────────────────────────────────────

const rand  = (lo, hi) => lo + Math.random() * (hi - lo);
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

// ── Texture bakers (use p5.Graphics 2D canvases) ─────────────────────────────

/** Marbled/gas-giant planet skin with latitudinal bands and storm blobs. */
function bakePlanetTexture(p, baseHex) {
  const size = 512;
  const g = p.createGraphics(size, size);
  g.pixelDensity(1);
  const ctx = g.drawingContext;

  const { h, s, l } = rgbToHSL(hexToRGB(baseHex));

  // Vertical base gradient — pole highlights, equator midtones
  const bg = ctx.createLinearGradient(0, 0, 0, size);
  bg.addColorStop(0.0, hsl(h,       Math.max(10, s * 0.7), Math.min(90, l + 20)));
  bg.addColorStop(0.5, hsl(h,       s,                     l));
  bg.addColorStop(1.0, hsl(h + 20,  s * 0.8,               Math.max(6, l - 18)));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Drifting horizontal bands
  const bands = 5 + ((Math.random() * 8) | 0);
  for (let i = 0; i < bands; i++) {
    const y = Math.random() * size;
    const bh = 10 + Math.random() * 45;
    ctx.fillStyle = hsl(h + rand(-30, 30), s, l + rand(-15, 15), 0.08 + Math.random() * 0.12);
    ctx.fillRect(0, y, size, bh);
  }

  // Storms / continents as radial blobs
  const blobs = 110 + ((Math.random() * 90) | 0);
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

  // Speckle — reads as fine surface noise under lighting
  for (let i = 0; i < 500; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
  }

  return g;
}

/** Radial glow — used as a sprite for stars, sun coronas, comet heads. */
function bakeRadialGlow(p, innerCSS, outerCSS) {
  const size = 256;
  const g = p.createGraphics(size, size);
  g.pixelDensity(1);
  const ctx = g.drawingContext;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0.0, innerCSS);
  grad.addColorStop(0.5, outerCSS);
  grad.addColorStop(1.0, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return g;
}

/** Nebula: soft overlapping blobs on a dark vignette. */
function bakeNebulaTexture(p, baseHex) {
  const size = 512;
  const g = p.createGraphics(size, size);
  g.pixelDensity(1);
  const ctx = g.drawingContext;

  const { h } = rgbToHSL(hexToRGB(baseHex));

  for (let i = 0; i < 45; i++) {
    const x = size / 2 + (Math.random() - 0.5) * size * 0.7;
    const y = size / 2 + (Math.random() - 0.5) * size * 0.7;
    const r = 40 + Math.random() * 180;
    const hue = h + rand(-60, 60);
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, hsl(hue, 80, 55, 0.38));
    gr.addColorStop(1, hsl(hue, 80, 55, 0));
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Vignette so the edges fade into black space
  const edge = ctx.createRadialGradient(size / 2, size / 2, size * 0.3, size / 2, size / 2, size / 2);
  edge.addColorStop(0, "rgba(0,0,0,0)");
  edge.addColorStop(1, "rgba(0,0,0,1)");
  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, size, size);

  return g;
}

/** Banded ring texture for ring systems and black-hole accretion disks. */
function bakeRingTexture(p, hotHex = "#ffbb66") {
  const w = 512, hpx = 32;
  const g = p.createGraphics(w, hpx);
  g.pixelDensity(1);
  const ctx = g.drawingContext;
  ctx.clearRect(0, 0, w, hpx);
  const { h } = rgbToHSL(hexToRGB(hotHex));
  for (let i = 0; i < 140; i++) {
    const x = Math.random() * w;
    const ww = 1 + Math.random() * 8;
    const a  = 0.12 + Math.random() * 0.55;
    ctx.fillStyle = hsl(h + rand(-15, 15), 60, 55 + Math.random() * 30, a);
    ctx.fillRect(x, 0, ww, hpx);
  }
  return g;
}

// Shared hue-cycling helper for rainbow mode
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

// ── Object factories ─────────────────────────────────────────────────────────

/** Planet: textured sphere + optional ring + optional orbiting moons. */
export function createPlanet(p, { x, y, z, sizeNorm, colorHex, rainbow, animate }) {
  const radius = 30 + sizeNorm * 140;
  const tex = bakePlanetTexture(p, colorHex);

  // Random orientation + spin axis keeps every placement visually distinct
  const tiltX = rand(-0.4, 0.4);
  const tiltZ = rand(-0.3, 0.3);
  const spinSpeed = rand(0.15, 0.5) * (chance(0.5) ? -1 : 1);
  let spin = 0;

  const hasRings = chance(0.4);
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

      // Planet body
      p.push();
      p.rotateY(spin);
      p.noStroke();
      p.texture(tex);
      p.ambientMaterial(255);
      p.specularMaterial(60);
      p.shininess(8);
      p.sphere(radius, 36, 28);
      p.pop();

      // Halo — an oversized back-face-only sphere with additive feel via alpha
      p.push();
      p.noStroke();
      const { r, g, b } = colorToRGB(p, colorHex, rainbow);
      p.fill(r, g, b, 35);
      p.sphere(radius * 1.08, 24, 18);
      p.pop();

      // Rings
      if (hasRings) {
        p.push();
        p.rotateX(Math.PI / 2 + ringTilt);
        p.noStroke();
        p.texture(ringTex);
        p.ambientMaterial(255);
        // Torus approximates a flat ring well when major radius >> minor
        const major = (ringInner + ringOuter) / 2;
        const minor = (ringOuter - ringInner) / 2;
        p.torus(major, minor, 64, 2);
        p.pop();
      }

      // Moons
      for (const m of moons) {
        p.push();
        p.rotateY(m.tiltAxis);
        p.rotateX(0.3);
        const mx = Math.cos(m.angle) * m.orbitR;
        const mz = Math.sin(m.angle) * m.orbitR;
        p.translate(mx, 0, mz);
        p.noStroke();
        p.ambientMaterial(200, 200, 210);
        p.specularMaterial(180);
        p.sphere(m.size, 16, 12);
        p.pop();
      }

      p.pop();
    },
  };
}

/** Small rocky moon — standalone tool for adding a drifting companion. */
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
      p.sphere(radius, 24, 18);
      p.pop();
    },
  };
}

/** Glowing star: bright core sphere + pulsing billboarded corona sprite. */
export function createStar(p, { x, y, z, sizeNorm, colorHex, rainbow }) {
  const radius = 4 + sizeNorm * 18;
  const glow = bakeRadialGlow(p,
    "rgba(255,255,255,0.95)",
    `rgba(${hexToRGB(colorHex).r},${hexToRGB(colorHex).g},${hexToRGB(colorHex).b},0.4)`);

  let phase = Math.random() * Math.PI * 2;
  return {
    update(_p, dt) { phase += dt * 2.0; },
    draw(p) {
      p.push();
      p.translate(x, y, z);

      const { r, g, b } = colorToRGB(p, colorHex, rainbow);

      // Bright core
      p.push();
      p.noStroke();
      p.emissiveMaterial(255, 255, 220);
      p.ambientMaterial(255);
      p.sphere(radius, 20, 16);
      p.pop();

      // Corona — a textured plane facing camera (billboard trick via resetMatrix would be overkill)
      const pulse = 1 + Math.sin(phase) * 0.1;
      p.push();
      p.noStroke();
      p.tint(r, g, b, 220);
      p.texture(glow);
      p.plane(radius * 14 * pulse, radius * 14 * pulse);
      p.noTint();
      p.pop();

      p.pop();
    },
  };
}

/** Sun: bigger star with layered pulsing coronas. */
export function createSun(p, { x, y, z, sizeNorm, colorHex = "#ffcc66", rainbow }) {
  const radius = 40 + sizeNorm * 120;
  const inner = bakeRadialGlow(p, "rgba(255,255,255,0.95)",
    `rgba(${hexToRGB(colorHex).r},${hexToRGB(colorHex).g},${hexToRGB(colorHex).b},0.7)`);
  const outer = bakeRadialGlow(p,
    `rgba(${hexToRGB(colorHex).r},${hexToRGB(colorHex).g},${hexToRGB(colorHex).b},0.6)`,
    `rgba(${hexToRGB(colorHex).r},${hexToRGB(colorHex).g},${hexToRGB(colorHex).b},0.05)`);

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
      p.sphere(radius, 32, 24);
      p.pop();

      // Inner corona
      p.push();
      p.noStroke();
      p.tint(r, g, b, 220);
      p.texture(inner);
      const s1 = radius * (5 + Math.sin(phase * 1.3) * 0.4);
      p.plane(s1, s1);
      p.pop();

      // Outer corona
      p.push();
      p.noStroke();
      p.tint(r, g, b, 170);
      p.texture(outer);
      const s2 = radius * (12 + Math.sin(phase) * 0.8);
      p.plane(s2, s2);
      p.noTint();
      p.pop();

      p.pop();
    },
  };
}

/** Nebula: big billboarded cloud that drifts slowly. */
export function createNebula(p, { x, y, z, sizeNorm, colorHex, rainbow }) {
  const size = 240 + sizeNorm * 520;
  const tex  = bakeNebulaTexture(p, colorHex);
  const vx = rand(-5, 5), vy = rand(-2, 2);
  let cx = x, cy = y;
  let rot = Math.random() * Math.PI * 2;

  return {
    update(_p, dt) {
      cx += vx * dt;
      cy += vy * dt;
      rot += dt * 0.05;
    },
    draw(p) {
      const { r, g, b } = colorToRGB(p, colorHex, rainbow);
      p.push();
      p.translate(cx, cy, z - 10);
      p.rotateZ(rot);
      p.noStroke();
      p.tint(r, g, b, 220);
      p.texture(tex);
      p.plane(size, size);
      p.noTint();
      p.pop();
    },
  };
}

/** Comet: fast head with glowing tail; auto-removed when life expires. */
export function createComet(p, { x, y, z, sizeNorm, colorHex = "#e0f7ff", rainbow }) {
  const radius = 4 + sizeNorm * 10;
  const dir = { x: rand(-1, 1), y: rand(-0.4, 0.4), z: 0 };
  const n = Math.hypot(dir.x, dir.y) || 1;
  dir.x /= n; dir.y /= n;
  const speed = 280 + Math.random() * 120;
  let life = 3.0;
  const glow = bakeRadialGlow(p, "rgba(255,255,255,0.95)",
    `rgba(${hexToRGB(colorHex).r},${hexToRGB(colorHex).g},${hexToRGB(colorHex).b},0.25)`);
  let cx = x, cy = y;

  return {
    update(_p, dt) {
      cx += dir.x * speed * dt;
      cy += dir.y * speed * dt;
      life -= dt;
    },
    draw(p) {
      if (life <= 0) return;
      const t = Math.max(0, life / 3.0);
      const { r, g, b } = colorToRGB(p, colorHex, rainbow);

      p.push();
      p.translate(cx, cy, z);

      // Tail — a stretched textured plane aligned to travel direction
      const angle = Math.atan2(dir.y, dir.x);
      p.push();
      p.rotateZ(angle);
      p.translate(-radius * 14, 0, 0);
      p.noStroke();
      p.tint(r, g, b, 220 * t);
      p.texture(glow);
      p.plane(radius * 28, radius * 6);
      p.pop();

      // Head
      p.push();
      p.noStroke();
      p.emissiveMaterial(255, 250, 230);
      p.ambientMaterial(255);
      p.sphere(radius * (0.7 + t * 0.4), 16, 12);
      p.pop();

      p.noTint();
      p.pop();
    },
    isDone() { return life <= 0; },
  };
}

/** Black hole: dark core + swirling accretion disk + halo glow. */
export function createBlackHole(p, { x, y, z, sizeNorm }) {
  const radius = 20 + sizeNorm * 90;
  const ringMajor = radius * 2.2;
  const ringMinor = radius * 0.25;
  const ringTex = bakeRingTexture(p, "#ffa040");
  const halo = bakeRadialGlow(p, "rgba(255,180,120,0.85)", "rgba(60,20,80,0)");

  let rot = 0;
  return {
    update(_p, dt) { rot += dt * 0.8; },
    draw(p) {
      p.push();
      p.translate(x, y, z);

      // Halo
      p.push();
      p.noStroke();
      p.tint(255, 180, 140, 200);
      p.texture(halo);
      p.plane(radius * 10, radius * 10);
      p.noTint();
      p.pop();

      // Accretion disk
      p.push();
      p.rotateX(Math.PI / 2 + 0.2);
      p.rotateZ(rot);
      p.noStroke();
      p.texture(ringTex);
      p.ambientMaterial(255);
      p.torus(ringMajor, ringMinor, 64, 2);
      p.pop();

      // Core — pitch black
      p.push();
      p.noStroke();
      p.fill(0);
      p.ambientMaterial(0);
      p.sphere(radius, 28, 20);
      p.pop();

      p.pop();
    },
  };
}

/** Standalone ring system (no planet body) — lets users decorate the scene. */
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
      p.torus(major, minor, 64, 2);
      p.noTint();
      p.pop();
    },
  };
}

/** Persistent background star field. Rendered every frame. */
export function createStarField(p, count = 400) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    // Distribute on a spherical shell behind the camera focus
    const r = 600 + Math.random() * 900;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    stars.push({
      x: r * Math.sin(ph) * Math.cos(th),
      y: r * Math.sin(ph) * Math.sin(th),
      z: r * Math.cos(ph) - 200,
      size: 0.5 + Math.random() * 2.5,
      hue:  200 + Math.random() * 80,
      twinkle: Math.random() * Math.PI * 2,
    });
  }
  return {
    draw(p) {
      p.push();
      p.noStroke();
      for (const s of stars) {
        const a = 180 + Math.sin(p.frameCount * 0.03 + s.twinkle) * 60;
        p.push();
        p.translate(s.x, s.y, s.z);
        p.colorMode(p.HSB, 360, 100, 100, 255);
        p.fill(s.hue, 20, 100, a);
        p.colorMode(p.RGB, 255);
        p.sphere(s.size, 6, 4);
        p.pop();
      }
      p.pop();
    },
  };
}
