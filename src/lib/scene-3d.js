import p5 from "p5";
import {
  createPlanet, createStar, createSun, createMoon,
  createNebula, createComet, createBlackHole, createRings,
  createStarField,
} from "./generative-3d.js";
import { CANVAS_SIZE } from "./constants.js";

/**
 * Spins up a second p5 instance running in WEBGL mode alongside the 2D sketch.
 * The returned controller lets the host component toggle visibility, spawn
 * generative objects at a clicked point, and clear the scene.
 *
 * Architecture:
 *   - Objects live in `sceneObjects` as { draw(p), update(p, dt) } records.
 *   - `draw()` is called every frame inside the WEBGL p5's draw loop; objects
 *     are responsible for their own push/pop so they don't leak transforms.
 *   - Ambient star field is persistent so the cosmos never looks empty.
 */
export function createScene3D(containerId, getUI) {
  const sceneObjects = [];
  let starfield = null;           // persistent background
  let lastFrameTime = 0;
  let orbitEnabled = true;        // disabled while a tool is being placed

  let pInstance = null;
  let canvasEl  = null;
  let visible   = false;

  // Queue objects added before p5 finishes setup (rare, but cheap to guard)
  const pending = [];

  const sketch = (p) => {
    p.setup = () => {
      p.pixelDensity(1);
      const c = p.createCanvas(CANVAS_SIZE, CANVAS_SIZE, p.WEBGL);
      c.parent(containerId);
      canvasEl = c.elt;
      canvasEl.classList.add("three-d-canvas"); // used by host to stack it
      canvasEl.style.width  = "100%";
      canvasEl.style.height = "100%";
      canvasEl.style.position = "absolute";
      canvasEl.style.inset    = "0";
      canvasEl.style.touchAction = "none";
      // The container's global `canvas { display: block !important }` rule
      // wins over inline styles — use setProperty with the important flag.
      canvasEl.style.setProperty("display", visible ? "block" : "none", "important");

      p.setAttributes("antialias", true);
      p.perspective(p.PI / 3, 1, 1, 5000);

      // Persistent starry backdrop
      starfield = createStarField(p, 400);

      // Flush anything queued before setup ran
      for (const fn of pending) fn(p);
      pending.length = 0;
    };

    p.draw = () => {
      if (!visible) return;

      p.clear();

      // Camera: orbitControl gives drag-to-rotate + wheel-to-zoom for free.
      // Disabled momentarily when the user is placing an object so the
      // placement click doesn't also rotate the camera.
      if (orbitEnabled) p.orbitControl(2, 2, 0.05);

      // Lighting — warm key + cool fill mirrors the neon theme
      p.ambientLight(90, 70, 150);
      p.directionalLight(255, 220, 200, 0.4, 0.3, -1);
      p.pointLight(255, 150, 230, -400, -200, 300);

      const now = p.millis();
      const dt  = lastFrameTime ? Math.min(0.05, (now - lastFrameTime) / 1000) : 0;
      lastFrameTime = now;

      // Background stars
      if (starfield) starfield.draw(p);

      // Spawn / iterate / cull
      for (let i = sceneObjects.length - 1; i >= 0; i--) {
        const obj = sceneObjects[i];
        obj.update?.(p, dt);
        obj.draw(p);
        if (obj.isDone?.()) sceneObjects.splice(i, 1);
      }
    };

    // Suppress scroll-while-drawing on touch
    p.touchStarted = (e) => { if (e && e.target === canvasEl) e.preventDefault?.(); };
    p.touchMoved   = (e) => { if (e && e.target === canvasEl) e.preventDefault?.(); };
  };

  // ── Public API ──────────────────────────────────────────────────────────
  // Defer p5 construction so that an SSR pass never touches `window`.
  if (typeof window !== "undefined") {
    pInstance = new p5(sketch);
  }

  const run = (fn) => {
    if (pInstance && canvasEl) fn(pInstance);
    else pending.push(fn);
  };

  /**
   * Maps a DOM-space click (clientX/clientY) to a WEBGL placement point.
   * p5 WEBGL coords place (0,0) at the canvas center — we simply map the
   * click's fraction across the canvas and scale by the sketch's internal size.
   */
  const screenToWorld = (clientX, clientY) => {
    if (!canvasEl) return { x: 0, y: 0, z: 0 };
    const rect = canvasEl.getBoundingClientRect();
    const fx = (clientX - rect.left) / rect.width;  // 0..1
    const fy = (clientY - rect.top)  / rect.height;
    // Half the sketch width/height in WEBGL units is the visible half-extent
    const halfW = (pInstance?.width  ?? CANVAS_SIZE) / 2;
    const halfH = (pInstance?.height ?? CANVAS_SIZE) / 2;
    // Pull the scale in so objects land inside the focal area, not at the
    // extreme edges where the perspective skew is dramatic.
    const worldScale = 0.6;
    return {
      x: (fx * 2 - 1) * halfW * worldScale,
      y: (fy * 2 - 1) * halfH * worldScale,
      z: 0,
    };
  };

  const spawn = (tool, clientX, clientY) => {
    run((p) => {
      const ui = getUI();
      const pos = screenToWorld(clientX, clientY);
      const opts = {
        x: pos.x, y: pos.y, z: pos.z,
        sizeNorm: (ui.size - 5) / 95,      // 0..1
        colorHex: ui.color,
        rainbow: ui.isRainbowActive,
        animate: ui.isAnimActive,
      };
      let obj = null;
      switch (tool) {
        case "planet":     obj = createPlanet(p, opts); break;
        case "star":       obj = createStar(p, opts); break;
        case "sun":        obj = createSun(p, opts); break;
        case "moon":       obj = createMoon(p, opts); break;
        case "nebula":     obj = createNebula(p, opts); break;
        case "comet":      obj = createComet(p, opts); break;
        case "blackhole":  obj = createBlackHole(p, opts); break;
        case "rings":      obj = createRings(p, opts); break;
      }
      if (obj) sceneObjects.push(obj);
    });
  };

  return {
    show() {
      visible = true;
      run((_p) => { canvasEl?.style.setProperty("display", "block", "important"); });
    },
    hide() {
      visible = false;
      run((_p) => { canvasEl?.style.setProperty("display", "none", "important"); });
    },
    isVisible: () => visible,
    spawn,
    clear() {
      sceneObjects.length = 0;
    },
    setOrbitEnabled(on) { orbitEnabled = on; },
    exportPNG(filename = "MagicalArtwork3D.png") {
      if (!canvasEl) return;
      const link = document.createElement("a");
      link.download = filename;
      link.href = canvasEl.toDataURL("image/png");
      link.click();
    },
  };
}
