/**
 * Wires up toolbar button behavior:
 *   - `.toggle-btn`  — independently toggleable effects (rainbow, fade, animate).
 *   - `.tool-btn`    — mutually exclusive tools. Tools are scoped to their
 *                      visible tool-set (2D or 3D), so each mode keeps its own
 *                      active tool independent of the other.
 *   - `.mode-btn`    — mutually exclusive mode switcher (2D vs 3D). Switching
 *                      toggles visibility of the two `.tool-set` groups and
 *                      dispatches a `mode-change` event that the canvas host
 *                      listens for to show/hide the appropriate renderer.
 */
export function initToolbar() {
  document.querySelectorAll(".toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => btn.classList.toggle("active"));
  });

  // Each tool-set is a scope — picking a tool only deactivates siblings in
  // the same set. That way the 2D "brush" stays remembered even while the 3D
  // panel is visible, and vice versa.
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

  // Mode switch — shows/hides the 2D or 3D tool set and emits an event.
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
}
