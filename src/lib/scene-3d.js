import p5 from "p5";
import {
  createPlanet, createStar, createSun, createMoon,
  createNebula, createComet, createBlackHole, createRings,
  createStarField, SCENE_BOUND,
} from "./generative-3d.js";
import { CANVAS_SIZE } from "./constants.js";

/**
 * Generative 3D scene.
 *
 * The 3D mode in this app is composition-first, not paint-first: the user
 * dials in counts per object type (planets, stars, nebulas, etc.) and presses
 * "Generate" to materialize a scene. Each generate() snapshots a *placement
 * list* — an array of concrete object records with positions baked in — so
 * undo/redo replays the exact prior layout rather than re-rolling random
 * positions.
 *
 * Architecture:
 *   - `sceneObjects` are live draw/update records (what we render this frame).
 *   - `history` + `future` are stacks of *placement lists* (what we could
 *     render). Generating pushes the current list onto history; undo pops.
 *   - `starfield` is persistent ambient scenery, not part of the placement
 *     list, so it survives undo/clear.
 *
 * Firefox compatibility:
 *   - `setAttributes()` is called BEFORE `createCanvas()`. Called after, p5
 *     warns and tries to recreate the GL context, which Firefox occasionally
 *     fails on — and every subsequent frame then renders as a black canvas.
 */

// Public factory so the host component (main.ts) can drive the scene.
export function createScene3D(containerId, getUI) {
  const sceneObjects = [];
  let starfield = null;
  let lastFrameTime = 0;

  // Undo/redo stacks of placement lists. `current` is the list that produced
  // the active `sceneObjects`. A placement list is a plain array — safe to
  // structuredClone for safety if we ever need to mutate in place.
  let current = [];
  const history = [];
  const future  = [];
  const HISTORY_MAX = 25;

  let pInstance = null;
  let canvasEl  = null;
  let visible   = false;

  const pending = [];

  const sketch = (p) => {
    p.setup = () => {
      // NOTE: We intentionally do NOT call `setAttributes("antialias", true)`
      // here. p5 2.x defaults to an antialiased WEBGL context already, and
      // calling `setAttributes()` at any point forces a GL context re-
      // creation — which Firefox sometimes leaves in a broken "black canvas"
      // state. Omitting the call gets anti-aliasing for free and keeps the
      // context stable across browsers.
      p.pixelDensity(1);
      const c = p.createCanvas(CANVAS_SIZE, CANVAS_SIZE, p.WEBGL);
      c.parent(containerId);
      canvasEl = c.elt;
      canvasEl.classList.add("three-d-canvas");
      canvasEl.style.width  = "100%";
      canvasEl.style.height = "100%";
      canvasEl.style.position = "absolute";
      canvasEl.style.inset    = "0";
      canvasEl.style.touchAction = "none";
      // The container's global `canvas { display: block !important }` rule
      // wins over inline styles — use setProperty with the important flag.
      canvasEl.style.setProperty("display", visible ? "block" : "none", "important");

      p.perspective(p.PI / 3, 1, 1, 5000);

      // Persistent starry backdrop (survives undo/clear)
      starfield = createStarField(p, 220);

      // Flush anything queued before setup ran
      for (const fn of pending) fn(p);
      pending.length = 0;
    };

    p.draw = () => {
      if (!visible) return;

      p.clear();

      // Drag-to-rotate, wheel-to-zoom, two-finger-pan come for free.
      p.orbitControl(2, 2, 0.05);

      // Lighting — warm key + cool fill mirrors the neon theme
      p.ambientLight(90, 70, 150);
      p.directionalLight(255, 220, 200, 0.4, 0.3, -1);
      p.pointLight(255, 150, 230, -400, -200, 300);

      const now = p.millis();
      const dt  = lastFrameTime ? Math.min(0.05, (now - lastFrameTime) / 1000) : 0;
      lastFrameTime = now;

      if (starfield) starfield.draw(p);

      // Objects: update, draw. The factories render into their own push/pop
      // so we don't leak transforms.
      for (const obj of sceneObjects) {
        obj.update?.(p, dt);
        obj.draw(p);
      }
    };

    p.touchStarted = (e) => { if (e && e.target === canvasEl) e.preventDefault?.(); };
    p.touchMoved   = (e) => { if (e && e.target === canvasEl) e.preventDefault?.(); };
  };

  // Defer p5 construction so an SSR pass never touches `window`.
  if (typeof window !== "undefined") {
    pInstance = new p5(sketch);
  }

  const run = (fn) => {
    if (pInstance && canvasEl) fn(pInstance);
    else pending.push(fn);
  };

  // ── Placement list → live draw records ─────────────────────────────────
  // Each placement is a plain data record. Rebuilding the scene from a
  // placement list always yields a visually equivalent layout.

  const FACTORY = {
    planet:    createPlanet,
    star:      createStar,
    sun:       createSun,
    moon:      createMoon,
    nebula:    createNebula,
    comet:     createComet,
    blackhole: createBlackHole,
    rings:     createRings,
  };

  function materialize(placements) {
    // Nothing we can do until p5 is ready; replay once setup flushes.
    if (!pInstance) {
      pending.push(() => materialize(placements));
      return;
    }
    // Dispose any texture-owning factory outputs from the previous scene.
    for (const obj of sceneObjects) obj.dispose?.();
    sceneObjects.length = 0;
    for (const pl of placements) {
      const f = FACTORY[pl.type];
      if (!f) continue;
      sceneObjects.push(f(pInstance, pl));
    }
  }

  // ── Scene generation ───────────────────────────────────────────────────
  // Build a placement list from UI counts. The randomness here (position,
  // per-object size jitter) is baked into the placement list so undo replays
  // the same layout.

  function buildPlacements(counts, ui) {
    const out = [];
    const rand = (lo, hi) => lo + Math.random() * (hi - lo);
    // Keep the fringe of the scene breathing room so nothing touches the edge.
    const edge = SCENE_BOUND * 0.85;
    const baseSize = (ui.size - 5) / 95; // 0..1 from the Size slider

    const push = (type, { sizeJitter = 0.35, zRange = 120 } = {}) => {
      out.push({
        type,
        x: rand(-edge, edge),
        y: rand(-edge, edge),
        z: rand(-zRange, zRange),
        sizeNorm: Math.max(0, Math.min(1, baseSize + rand(-sizeJitter, sizeJitter))),
        colorHex: ui.color,
        rainbow: ui.isRainbowActive,
        animate: ui.isAnimActive,
      });
    };

    // Order matters only for paint — keep large cloudy things first so the
    // solid bodies read on top. (We also depth-test, but it reads cleaner.)
    for (let i = 0; i < (counts.nebulas    ?? 0); i++) push("nebula",    { zRange: 60 });
    for (let i = 0; i < (counts.blackholes ?? 0); i++) push("blackhole", { sizeJitter: 0.2 });
    for (let i = 0; i < (counts.rings      ?? 0); i++) push("rings",     { sizeJitter: 0.25 });
    for (let i = 0; i < (counts.suns       ?? 0); i++) push("sun",       { sizeJitter: 0.25 });
    for (let i = 0; i < (counts.planets    ?? 0); i++) push("planet");
    for (let i = 0; i < (counts.moons      ?? 0); i++) push("moon",      { sizeJitter: 0.2 });
    for (let i = 0; i < (counts.stars      ?? 0); i++) push("star",      { sizeJitter: 0.3 });
    for (let i = 0; i < (counts.comets     ?? 0); i++) push("comet",     { sizeJitter: 0.3 });

    return out;
  }

  function pushHistory(list) {
    if (current.length) history.push(current);
    if (history.length > HISTORY_MAX) history.shift();
    future.length = 0; // new generation invalidates the redo stack
    current = list;
  }

  // ── Public API ─────────────────────────────────────────────────────────
  return {
    show() {
      visible = true;
      run(() => { canvasEl?.style.setProperty("display", "block", "important"); });
    },
    hide() {
      visible = false;
      run(() => { canvasEl?.style.setProperty("display", "none", "important"); });
    },
    isVisible: () => visible,

    /**
     * Generate a new scene from the current slider counts. Snapshots the
     * prior scene into undo history.
     */
    generate(counts) {
      const ui = getUI();
      const list = buildPlacements(counts, ui);
      pushHistory(list);
      materialize(list);
    },

    /** Clear the scene. Clears history too — a fresh canvas is a fresh state. */
    clear() {
      for (const obj of sceneObjects) obj.dispose?.();
      sceneObjects.length = 0;
      current = [];
      history.length = 0;
      future.length = 0;
    },

    /** Undo the most recent generation. Returns true if anything changed. */
    undo() {
      if (history.length === 0) return false;
      future.push(current);
      current = history.pop();
      materialize(current);
      return true;
    },

    /** Redo a previously-undone generation. */
    redo() {
      if (future.length === 0) return false;
      history.push(current);
      current = future.pop();
      materialize(current);
      return true;
    },

    exportPNG(filename = "MagicalArtwork3D.png") {
      if (!canvasEl) return;
      const link = document.createElement("a");
      link.download = filename;
      link.href = canvasEl.toDataURL("image/png");
      link.click();
    },
  };
}
