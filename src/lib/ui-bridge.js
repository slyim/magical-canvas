import { DEFAULT_COLOR, DEFAULT_SIZE, DEFAULT_OPACITY } from "./constants.js";

/**
 * Lazy-cached refs to the DOM controls. getUIState() runs every draw frame,
 * so looking these up once — not 11× per frame — matters.
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
    // 2D tools
    isEraserActive: isActive("eraser-toggle"),
    isSquareActive: isActive("square-toggle"),
    isEllipseActive: isActive("ellipse-toggle"),
    isTriangleActive: isActive("triangle-toggle"),
    // 3D tools
    isPlanetActive:    isActive("planet-toggle"),
    isStarActive:      isActive("star-toggle"),
    isSunActive:       isActive("sun-toggle"),
    isMoonActive:      isActive("moon-toggle"),
    isNebulaActive:    isActive("nebula-toggle"),
    isCometActive:     isActive("comet-toggle"),
    isBlackholeActive: isActive("blackhole-toggle"),
    isRingsActive:     isActive("rings-toggle"),
    // Mode
    is3D: isActive("mode-3d"),
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

/** Returns the currently active 3D generator tool. Defaults to 'planet'. */
export function getActive3DTool(ui) {
  if (ui.isStarActive)      return "star";
  if (ui.isSunActive)       return "sun";
  if (ui.isMoonActive)      return "moon";
  if (ui.isNebulaActive)    return "nebula";
  if (ui.isCometActive)     return "comet";
  if (ui.isBlackholeActive) return "blackhole";
  if (ui.isRingsActive)     return "rings";
  return "planet";
}
