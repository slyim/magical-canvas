# MagicalCanvas

A browser-based drawing app built with [Astro](https://astro.build) and [p5.js](https://p5js.org). Paint with neon glow brushes, animated particle sparks, rainbow cycling, and a fade trail effect — then export your artwork as a 1200×1200 PNG ready for Instagram.

**[Live Demo](https://slyim.github.io/magical-canvas)**

---

## Features

- **Neon glow brush** — iridescent hue-shifting strokes with real-time canvas shadow blur
- **Particle sparks** — energetic animated lines burst from each stroke (toggle on/off)
- **Ambient sparkles** — subtle circles and cross-stars scatter around the cursor
- **Shape stamps** — square, ellipse, and triangle tools for filled shapes
- **Eraser** — variable opacity erase with soft edges
- **Rainbow mode** — overrides brush color with a rapid hue cycle
- **Fade/trail effect** — slowly erases the canvas each frame for long neon trails; speed adjustable
- **Pen pressure** — brush thickness responds to stylus pressure on supported devices
- **Undo / Redo** — up to 25 steps, full canvas snapshots
- **Import** — load a PNG, JPEG, or WebP as a base layer
- **Export** — saves a 1200×1200 PNG with the dark background composited in

---

## Tech Stack

| Layer         | Technology                                   |
| ------------- | -------------------------------------------- |
| Framework     | [Astro](https://astro.build) 6 (static site) |
| Canvas engine | [p5.js](https://p5js.org) 2 (instance mode)  |
| Styling       | Vanilla CSS (responsive grid)                |
| Deployment    | GitHub Pages via Astro static build          |

---

## Local Development

**Requirements:** Node.js 20+

```bash
npm install
npm run dev
```

Open [http://localhost:4321/magical-canvas](http://localhost:4321/magical-canvas) in your browser.

```bash
npm run build    # Build to dist/
npm run preview  # Preview the build locally
```

---

## Deployment

The project is configured for GitHub Pages in [astro.config.mjs](astro.config.mjs):

```js
site: 'https://slyim.github.io',
base: '/magical-canvas',
```

Pushes to `main` trigger the GitHub Actions workflow in [.github/workflows/deploy.yml](.github/workflows/deploy.yml) which builds and deploys automatically.

---

## Controls

### Tools (left dock)

| Tool     | Description                 |
| -------- | --------------------------- |
| Brush    | Default smooth line tool    |
| Eraser   | Erase with variable opacity |
| Square   | Stamp filled squares        |
| Ellipse  | Stamp filled ellipses       |
| Triangle | Stamp filled triangles      |

### Effects (right dock)

| Effect  | Description                                          |
| ------- | ---------------------------------------------------- |
| Rainbow | Cycles through all hues rapidly                      |
| Animate | Emits animated particle sparks from the brush        |
| Fade    | Slowly fades the canvas each frame for trail effects |
| Speed   | Controls how fast the Fade effect erases             |

### Top dock

- **Color** — base brush color (hue-shifted ±25° per stroke for iridescence)
- **Size** — brush diameter (5–100 px in canvas-space)
- **Opacity** — stroke alpha

### Bottom dock

- **Undo / Redo** — up to 25 history states
- **Clear** — clear the canvas with a flash animation
- **Import PNG** — load an image as a base layer
- **Export PNG** — save 1200×1200 PNG with background

### Keyboard

- **Space** — reserved (default browser scroll is suppressed)

---

## Mobile Support

Touch drawing works on **iOS Safari 15.4+** and **Android Chrome 108+**. The canvas scales to a square viewport on mobile with all docks stacked vertically. The SVG cursor ring is hidden on touch devices.

The `svh` (smallest viewport height) unit is used for desktop canvas sizing, which requires the same browser versions for correct behavior; older browsers fall back gracefully to `vh`.

---

## Export

The canvas renders at a fixed **1200×1200 px** internal resolution regardless of screen size. When you export, the dark background (`#0d0617`) is composited behind the transparent canvas layer, producing a clean PNG ready for social media.

---

## License

MIT
