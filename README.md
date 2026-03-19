# 🌌 MagicalCanvas

MagicalCanvas is a mesmerizing, high-performance web-based drawing application built with **Astro** and **p5.js**. It features a custom-built, hardware-accelerated neon rendering engine that produces iridescent, dynamic glowing strokes wrapped in an absolutely pristine, responsive layout.

![Magical Canvas Preview]() *(Add your own screenshot here!)*

## ✨ Features

- **Hyper-Responsive UI**: A fully custom CSS Grid cross-layout that automatically `"shrink-wraps"` the canvas on desktop screens to provide a perfectly compact workspace, while elegantly transforming into a native, touch-friendly vertical timeline on mobile devices.
- **Dynamic Neon Engine**: Hardware-accelerated brush logic utilizing `p5.js` drawing context shadows combined with smooth HSB iridescence to create a stunning, pearlescent glow effect.
- **Ambient Sparkles & Particles**: Draw with life! Built-in physics mechanics generate directional sparks and ambient floating sparkles surrounding your brush strokes in real-time.
- **Advanced Export System**: Natively implemented HTML5 Canvas compositing bypasses viewport scaling bugs, actively guaranteeing a flawless, 1:1 mathematical 1200x1200px Instagram-ready PNG export every single time.
- **Robust Toolset**: Includes Brush, Eraser, geometric stamping (Square, Ellipse, Triangle), and full Undo/Redo state management.
- **Layer Effects**: Features a real-time `destination-out` trailing Fade effect (with variable speed) and a hyper-active Rainbow cycle.

## 🚀 Tech Stack

- **[Astro](https://astro.build/)**: Framework for an ultra-fast, optimized layout and component structure.
- **[p5.js](https://p5js.org/)**: The core WebGL/2D rendering engine powering the interactive canvas drawing mechanics.
- **Vanilla CSS**: No bulky frameworks. Pure, handwritten flexbox and grid trickery for uncompromising layout mathematics (`cqmin` container queries, custom media breakpoints, etc.)

## 🛠️ Local Development

Want to run MagicalCanvas locally or hack on the particle physics engine?

1. **Clone the repository:**
   ```bash
   git clone https://github.com/slyim/magical-canvas.git
   cd magical-canvas
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the Astro dev server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:4321` and start painting!

## 📦 Deployment

This project handles optimized static building via Astro. It natively compiles to the `dist/` directory, making it perfectly tailored for one-click deployments to **GitHub Pages**, Vercel, Netlify, or your remote host of choice.

```bash
npm run build
```

## 🎨 Controls Guide

- **Color, Size, Opacity**: Tweak your brush utilizing the top dock. Size actively affects the dynamic scatter rate of particles.
- **Rainbow**: Overrides your base color with a rapidly shifting hue-cycle.
- **Animate**: Enables velocity-based trailing sparks that burst off your brush in the direction of your stroke.
- **Fade**: Applies an atmospheric trailing disappearance to your canvas. Adjust the dial to change the decay speed!
- **Import PNG**: Drops an existing image perfectly scaled into the absolute center of your piece without disrupting the background composition.

---

*Crafted with CSS mathematics and p5.js magic.*
