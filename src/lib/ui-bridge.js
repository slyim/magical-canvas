import { DEFAULT_COLOR, DEFAULT_SIZE, DEFAULT_OPACITY } from "./constants.js";

/**
 * UI bridge — the DOM is the source of truth for tool state, this module just
 * snapshots it each frame. Element refs are lazy-cached because `getUIState()`
 * runs inside the draw loop and we don't want 11 DOM queries per frame.
 */
const refs = {};
const resolve = (id) => (refs[id] ??= document.getElementById(id));

const intVal = (id, fallback) => {
  const el = resolve(id);
  const n = parseInt(el?.value ?? "", 10);
  return Number.isFinite(n) ? n : fallback;
};

const isActive = (id) => resolve(id)?.classList.contains("active") ?? false;

/** Snapshot all UI control values. Called once per draw frame. */
export function getUIState() {
  return {
    color: resolve("color-picker")?.value ?? DEFAULT_COLOR,
    size: intVal("size-picker", DEFAULT_SIZE),
    opacity: intVal("opacity-picker", DEFAULT_OPACITY),
    fadeSpeed: intVal("fade-speed", 5),

    isFadeActive: isActive("fade-toggle"),
    isRainbowActive: isActive("rainbow-toggle"),
    isAnimActive: resolve("anim-toggle")?.classList.contains("active") ?? true,

    // 2D tools — mutually exclusive within the 2D tool-set
    isEraserActive: isActive("eraser-toggle"),
    isSquareActive: isActive("square-toggle"),
    isEllipseActive: isActive("ellipse-toggle"),
    isTriangleActive: isActive("triangle-toggle"),

    // Mode
    is3D: isActive("mode-3d"),
  };
}

/** Snapshot of the 3D generative counts — one slider per object type. */
export function get3DCounts() {
  return {
    planets:    intVal("count-planets",    3),
    moons:      intVal("count-moons",      2),
    stars:      intVal("count-stars",      8),
    suns:       intVal("count-suns",       1),
    nebulas:    intVal("count-nebulas",    1),
    comets:     intVal("count-comets",     2),
    blackholes: intVal("count-blackholes", 0),
    rings:      intVal("count-rings",      1),
  };
}

/** Returns the currently active 2D drawing tool. Defaults to 'brush'. */
export function getActiveTool(ui) {
  if (ui.isEraserActive) return "eraser";
  if (ui.isSquareActive) return "square";
  if (ui.isEllipseActive) return "ellipse";
  if (ui.isTriangleActive) return "triangle";
  return "brush";
}
