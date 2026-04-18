import p5 from "p5";
import { setupCanvas } from "./lib/canvas-engine.js";
import { createHistory } from "./lib/history.js";
import { getUIState, getActiveTool, get3DCounts } from "./lib/ui-bridge.js";
import { updateCursorRing } from "./lib/cursor.js";
import { applyFadeEffect } from "./lib/effects.js";
import { createParticleSystem } from "./lib/particle-system.js";
import { createDrawingEngine } from "./lib/drawing-tools.js";
import { exportPNG, setupImport } from "./lib/export.js";
import { createScene3D } from "./lib/scene-3d.js";
import { initToolbar } from "./lib/toolbar.js";

/**
 * Entry point for the Vite build.
 *
 * Runs two p5 sketches in parallel:
 *   - 2D sketch (canvas-engine) — the painting surface.
 *   - 3D sketch (scene-3d)       — a WEBGL second instance, stacked on top.
 *
 * Only one is visible at a time. Mode switch is coordinated by a
 * "mode-change" CustomEvent that toolbar.js emits when the 2D/3D button is
 * clicked.
 */

// Wire DOM controls first — handlers are attached by the time p5 finishes
// setup, so the first click always lands on a ready scene.
initToolbar();

// 3D scene lives under the same container and swaps visibility with the 2D
// canvas. Launch it before the 2D sketch so its canvas lands on top of the
// 2D one in DOM order (see .three-d-canvas CSS rule).
const scene3D = createScene3D("p5-container", () => getUIState());

// Mode switch: show one renderer, hide the other. We also force-hide the
// cursor ring in 3D since the WebGL canvas handles its own interaction.
window.addEventListener("mode-change", (e: Event) => {
  const mode = (e as CustomEvent).detail?.mode;
  const twoD = document.querySelector<HTMLElement>("#p5-container canvas:not(.three-d-canvas)");
  const ring = document.getElementById("cursor-ring");
  if (mode === "3d") {
    scene3D.show();
    if (twoD) twoD.style.visibility = "hidden";
    if (ring) ring.style.display = "none";
  } else {
    scene3D.hide();
    if (twoD) twoD.style.visibility = "visible";
  }
});

// Generate button — builds a fresh 3D scene from the current slider counts.
document.getElementById("generate-btn")?.addEventListener("click", () => {
  scene3D.generate(get3DCounts());
});

// ── 2D sketch ────────────────────────────────────────────────────────────

const sketch = (p: p5) => {
  // Persistent state
  const history       = createHistory(p);
  const particles     = createParticleSystem(p);
  const drawingEngine = createDrawingEngine(p);

  // Input state
  let dragStartOnUI     = false;
  let isMouseOverCanvas = false;
  let currentPressure   = 1.0;
  let isDrawing         = false;

  let inputActive = false;
  let inputX      = 0;
  let inputY      = 0;
  let prevInputX  = 0;
  let prevInputY  = 0;

  // ── Event listeners ─────────────────────────────────────────────────

  // Pen pressure
  window.addEventListener("pointermove", (e) => {
    currentPressure = e.pointerType === "pen" && e.pressure > 0.05 ? e.pressure : 1.0;
  });
  window.addEventListener("pointerdown", (e) => {
    currentPressure = e.pointerType === "pen" && e.pressure > 0.05 ? e.pressure : 1.0;
  });
  window.addEventListener("pointerup",     (e) => { if (e.pointerType === "pen") currentPressure = 1.0; });
  window.addEventListener("pointercancel", (e) => { if (e.pointerType === "pen") currentPressure = 1.0; });

  // UI drag lock — clicks/drags that start inside a dock never paint on the canvas.
  const setDragStartOnUI = (target: Element | null) => {
    dragStartOnUI = !!(target && target.closest(".dock"));
  };
  window.addEventListener("mousedown",  (e) => setDragStartOnUI(e.target as Element));
  window.addEventListener("touchstart", (e) => setDragStartOnUI(e.touches[0]?.target as Element), { passive: true });

  // Hover tracking for cursor ring + draw guard
  const p5Container = document.getElementById("p5-container");
  if (p5Container) {
    p5Container.addEventListener("mouseenter", () => { isMouseOverCanvas = true; });
    p5Container.addEventListener("mouseleave", () => { isMouseOverCanvas = false; });
  }

  // Prevent spacebar from scrolling while panning
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") e.preventDefault();
  }, { passive: false });

  // ── p5 lifecycle ────────────────────────────────────────────────────

  p.setup = () => {
    setupCanvas(p);

    // Clear — clears whichever renderer is visible
    document.getElementById("clear-btn")?.addEventListener("click", () => {
      if (scene3D.isVisible()) {
        scene3D.clear();
        return;
      }
      history.save();
      p.clear(0, 0, 0, 0);
      particles.clear();
      drawingEngine.resetStroke();
      const canvasEl = document.querySelector<HTMLElement>("#p5-container canvas:not(.three-d-canvas)");
      if (canvasEl) {
        canvasEl.style.transition = "none";
        canvasEl.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
        setTimeout(() => {
          canvasEl.style.transition = "background-color 0.4s ease-out";
          canvasEl.style.backgroundColor = "transparent";
        }, 10);
      }
    });

    // Export — picks the visible canvas
    document.getElementById("export-btn")?.addEventListener("click", () => {
      if (scene3D.isVisible()) scene3D.exportPNG();
      else                     exportPNG();
    });

    // Import (2D only — importing a PNG into a 3D scene doesn't map cleanly)
    const importInput = setupImport(p, (img: p5.Image) => {
      history.save();
      const ratio = Math.min(p.width / img.width, p.height / img.height);
      const newW  = img.width  * ratio;
      const newH  = img.height * ratio;
      p.image(img, p.width / 2 - newW / 2, p.height / 2 - newH / 2, newW, newH);
    });
    document.getElementById("import-btn")?.addEventListener("click", () => {
      // Import forces back to 2D — a PNG can't be placed in the 3D scene.
      if (scene3D.isVisible()) {
        document.getElementById("mode-2d")?.dispatchEvent(new Event("click"));
      }
      importInput.click();
    });

    // Undo/redo — route to the visible renderer
    document.getElementById("undo-btn")?.addEventListener("click", () => {
      if (scene3D.isVisible()) { scene3D.undo(); return; }
      if (history.undo()) drawingEngine.resetStroke();
    });
    document.getElementById("redo-btn")?.addEventListener("click", () => {
      if (scene3D.isVisible()) { scene3D.redo(); return; }
      if (history.redo()) drawingEngine.resetStroke();
    });
  };

  // ── Touch hooks — bridge p5's touch events into unified input state ──
  const pt = p as any;

  pt.touchStarted = () => {
    if (p.touches.length > 0) {
      const t = p.touches[0] as any;
      prevInputX = t.x;
      prevInputY = t.y;
      inputX     = t.x;
      inputY     = t.y;
      inputActive = true;
    }
    return false;
  };

  pt.touchMoved = () => {
    if (p.touches.length > 0) {
      const t = p.touches[0] as any;
      prevInputX = inputX;
      prevInputY = inputY;
      inputX = t.x;
      inputY = t.y;
    }
    return false;
  };

  pt.touchEnded = () => {
    if (p.touches.length === 0) inputActive = false;
    return false;
  };

  pt.touchCancelled = () => {
    inputActive = false;
    drawingEngine.resetStroke();
    return false;
  };

  // ── Draw loop ───────────────────────────────────────────────────────

  p.draw = () => {
    const ui   = getUIState();
    const tool = getActiveTool(ui);

    // In 3D mode, the WEBGL sketch is the active renderer — pause 2D work.
    if (ui.is3D) {
      if (isDrawing) {
        isDrawing = false;
        drawingEngine.resetStroke();
      }
      return;
    }

    if (ui.isFadeActive) applyFadeEffect(p, ui.fadeSpeed);

    updateCursorRing(p, isMouseOverCanvas, ui, tool);

    // Sync mouse into unified input (touch hooks update directly)
    if (p.touches.length === 0) {
      if (p.mouseIsPressed && isMouseOverCanvas) {
        inputActive = true;
        inputX      = p.mouseX;
        inputY      = p.mouseY;
        prevInputX  = p.pmouseX;
        prevInputY  = p.pmouseY;
      } else {
        inputActive = false;
      }
    }

    const canDraw = inputActive && !dragStartOnUI && !p.keyIsDown(32)
      && (p.touches.length > 0 || isMouseOverCanvas);

    if (canDraw) {
      if (!isDrawing) {
        isDrawing = true;
        history.save();
      }
      drawingEngine.drawAtPoint({
        tool, inputX, inputY, prevInputX, prevInputY,
        currentPressure,
        color:     ui.color,
        size:      ui.size,
        opacity:   ui.opacity,
        isRainbow: ui.isRainbowActive,
        isAnim:    ui.isAnimActive,
      }, particles);
    } else {
      if (isDrawing) {
        isDrawing = false;
        drawingEngine.resetStroke();
      }
    }

    particles.update();
  };

  p.windowResized = () => {
    // Canvas is a fixed 1200×1200 — CSS scales it. No resize needed.
  };
};

new p5(sketch);
