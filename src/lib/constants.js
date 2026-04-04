// Central constants — all magic numbers live here

export const UNDO_STACK_MAX = 25;
export const CANVAS_SIZE = 1200; // 1:1 square, Instagram-ready export
export const PIXEL_DENSITY = 1; // Fixed for consistent performance at this resolution

export const PARTICLE_MAX = 1000; // Hard cap to prevent perf degradation on long sessions

export const FADE_ALPHA_MIN = 0.0001; // Near-zero: very slow, dramatic trail
export const FADE_ALPHA_MAX = 0.005; // Max: visible fade per frame

export const BACKGROUND_HEX = "#0d0617";
export const BACKGROUND_COLOR = [13, 6, 23]; // Deep space purple (RGB)

export const DEFAULT_COLOR = "#b496ff";
export const DEFAULT_SIZE = 25;
export const DEFAULT_OPACITY = 100;

// Probability thresholds — p.random(1) > threshold means chance = 1 - threshold
export const SPARKLE_PROBABILITY_THRESHOLD = 0.4; // ~60% chance per frame while drawing
export const SPARK_PROBABILITY_THRESHOLD = 0.9; // ~10% chance per frame while drawing
