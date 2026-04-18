/**
 * Wires up the DOM controls that live alongside the canvas.
 *
 * Three kinds of buttons:
 *   - `.toggle-btn`  — independently toggleable effects (rainbow, fade, animate).
 *   - `.tool-btn`    — mutually exclusive tools. Tools are scoped to their
 *                      visible tool-set (2D or 3D), so each mode keeps its own
 *                      active tool independent of the other.
 *   - `.mode-btn`    — mutually exclusive mode switcher (2D vs 3D). Switching
 *                      toggles visibility of the two `.tool-set` groups and
 *                      dispatches a `mode-change` event that the canvas host
 *                      listens for to show/hide the appropriate renderer.
 *
 * Also keeps the 3D slider readouts live — each slider has a sibling
 * `.slider-value[data-for=<id>]` that mirrors the current value.
 */
export function initToolbar() {
  document.querySelectorAll(".toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => btn.classList.toggle("active"));
  });

  document.querySelectorAll(".tool-set").forEach((set) => {
    const toolBtns = set.querySelectorAll(".tool-btn");
    toolBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.classList.contains("active")) return;
        toolBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });
  });

  const modeBtns = document.querySelectorAll(".mode-btn");
  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("active")) return;
      modeBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const mode = btn.id === "mode-3d" ? "3d" : "2d";
      document.querySelectorAll(".tool-set").forEach((set) => {
        set.hidden = set.dataset.mode !== mode;
      });
      window.dispatchEvent(new CustomEvent("mode-change", { detail: { mode } }));
    });
  });

  // Live slider readouts — every input[type=range] inside a .slider-row gets
  // its current value mirrored into the sibling .slider-value span.
  document.querySelectorAll(".slider-row input[type=range]").forEach((input) => {
    const readout = document.querySelector(`.slider-value[data-for="${input.id}"]`);
    if (!readout) return;
    const sync = () => { readout.textContent = input.value; };
    input.addEventListener("input", sync);
    sync(); // initial paint — in case the default value differs
  });
}
