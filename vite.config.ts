import { defineConfig } from "vite";

// GitHub Pages serves the site under /magical-canvas/, so assets have to be
// requested from that subpath. Local `vite dev` and `vite preview` honor the
// same base so the app runs identically in both environments.
export default defineConfig({
  base: "/magical-canvas/",
  build: {
    outDir: "dist",
    sourcemap: false,
    // p5 is ~900 KB minified — give Vite a realistic chunk ceiling so the
    // build log stops shouting about it.
    chunkSizeWarningLimit: 1500,
  },
  server: {
    host: true,
    port: 5173,
  },
});
