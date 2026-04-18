# MagicalCanvas

A browser-based drawing app built with [Vite](https://vite.dev) and [p5.js](https://p5js.org). Paint with neon glow brushes and animated sparks in 2D, or generate entire procedural cosmoses — planets, stars, nebulas, comets, black holes — in 3D. Exports a 1200×1200 PNG ready for social media.

**[Live Demo](https://slyim.github.io/magical-canvas/)**

---

## Features

### 2D painting
- **Neon glow brush** — iridescent hue-shifting strokes with real-time canvas shadow blur
- **Particle sparks** — energetic animated lines burst from each stroke (toggle on/off)
- **Ambient sparkles** — subtle circles and cross-stars scatter around the cursor
- **Shape stamps** — square, ellipse, triangle tools for filled shapes
- **Eraser** — variable opacity erase with soft edges
- **Rainbow mode** — overrides brush color with a rapid hue cycle
- **Fade/trail effect** — slowly erases the canvas each frame for long neon trails; speed adjustable
- **Pen pressure** — brush thickness responds to stylus pressure on supported devices

### 3D generative cosmos
- **Slider-driven composition** — dial in counts per object type (planets, moons, stars, suns, nebulas, comets, black holes, rings), press **Generate Scene**
- **Orbit camera** — drag to rotate, scroll to zoom
- **Undo / Redo** — cycles through previously-generated scenes
- **Clean transparent overlays** — depth-writes disabled around coronas and rings so no glitchy auras
- **Cached textures** — identical glows and rings share a single GPU upload across all objects

### Shared
- **Undo / Redo** — 25 steps per mode (pixel snapshots in 2D, placement lists in 3D)
- **Import** — load a PNG, JPEG, or WebP as a 2D base layer
- **Export** — saves a 1200×1200 PNG with the dark background composited in
- **Firefox-compatible** — WebGL init path avoids the context-recreation trap

---

## Tech Stack

| Layer         | Technology                                  |
| ------------- | ------------------------------------------- |
| Build tooling | [Vite](https://vite.dev) 6 + TypeScript 5   |
| Canvas engine | [p5.js](https://p5js.org) 2 (instance mode) |
| Styling       | Vanilla CSS (responsive grid)               |
| Deployment    | GitHub Pages via Vite static build          |

---

## Local Development

**Requirements:** Node.js 20+

```bash
npm install
npm run dev
```

Open [http://localhost:5173/magical-canvas/](http://localhost:5173/magical-canvas/) in your browser.

```bash
npm run build    # Build to dist/
npm run preview  # Preview the build locally
```

---

## Project Layout

```
index.html                    # Single entry page (served by Vite)
src/
  main.ts                     # App bootstrap — wires UI to the p5 sketches
  lib/
    canvas-engine.js          # 2D p5 canvas setup
    drawing-tools.js          # Brush / shape / eraser logic
    effects.js                # Fade trail
    particle-system.js        # Animated spark particles
    history.js                # 2D undo/redo (pixel snapshots)
    cursor.js                 # Custom SVG cursor ring
    export.js                 # PNG export + import helpers
    scene-3d.js               # 3D WEBGL sketch + scene generation & history
    generative-3d.js          # Procedural factories (planet, star, nebula, …)
    toolbar.js                # DOM control wiring
    ui-bridge.js              # Per-frame UI state snapshot
    constants.js              # Canvas size, defaults, probability thresholds
  styles/style.css            # All styling in one file
vite.config.ts                # Base path + build config for GitHub Pages
```

All files in `src/lib/` are plain ES modules — no Vite-specific magic — so the
engine is framework-agnostic and portable.

---

## Deployment

The project is configured for GitHub Pages in [vite.config.ts](vite.config.ts):

```ts
base: "/magical-canvas/"
```

Pushes to `main` trigger the workflow in [.github/workflows/deploy.yml](.github/workflows/deploy.yml), which runs `npm ci && npm run build` and publishes `dist/` to GitHub Pages.

---

## Controls

### Mode (top dock)
- **2D** — painting surface (brush, shapes, eraser, effects)
- **3D** — generative cosmos (slider counts + Generate button)

### Top dock (shared)
- **Color** — brush color / base tint for 3D objects (hue-shifted per stroke for iridescence)
- **Size** — 2D brush diameter OR base 3D object size (5–100)
- **Opacity** — 2D stroke alpha

### Left dock — 2D tools
| Tool     | Description                 |
| -------- | --------------------------- |
| Brush    | Default smooth line tool    |
| Eraser   | Erase with variable opacity |
| Square   | Stamp filled squares        |
| Ellipse  | Stamp filled ellipses       |
| Triangle | Stamp filled triangles      |

### Left dock — 3D sliders
Each slider sets how many of that object type will be placed on the next **Generate Scene**. Positions, tilts and per-object sizes are randomized per generation and baked into the undo history.

| Slider        | Range | Default |
| ------------- | ----- | ------- |
| Planets       | 0–10  | 3       |
| Moons         | 0–12  | 2       |
| Stars         | 0–30  | 8       |
| Suns          | 0–5   | 1       |
| Nebulas       | 0–6   | 1       |
| Comets        | 0–8   | 2       |
| Black Holes   | 0–3   | 0       |
| Rings         | 0–6   | 1       |

### Right dock — effects
| Effect  | Description                                          |
| ------- | ---------------------------------------------------- |
| Rainbow | Cycles through all hues rapidly                      |
| Animate | Emits sparks / rotates planets and moons             |
| Fade    | 2D only — slowly fades the canvas each frame         |
| Speed   | Controls how fast the Fade effect erases             |

### Bottom dock
- **Undo / Redo** — scoped to the active mode
- **Clear** — clears the visible canvas (flash animation in 2D)
- **Import PNG** — drops an image into the 2D canvas (auto-switches to 2D)
- **Export PNG** — exports the active canvas as 1200×1200 PNG

### Keyboard
- **Space** — reserved (default browser scroll is suppressed)

---

## Mobile Support

Touch drawing works on **iOS Safari 15.4+** and **Android Chrome 108+**. The canvas scales to a square viewport on mobile with all docks stacked vertically. The SVG cursor ring is hidden on touch devices.

On mobile, the 3D sliders reflow into rows so all counts remain visible without scrolling.

---

## Export

The canvas renders at a fixed **1200×1200 px** internal resolution regardless of screen size. When you export in 2D, the dark background (`#0d0617`) is composited behind the transparent canvas layer. 3D export uses the WebGL canvas's native contents.

---

## License

MIT
