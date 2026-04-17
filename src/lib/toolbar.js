/**
 * Wires up toolbar button behavior:
 *   - `.toggle-btn` — independently toggleable effects (rainbow, fade, animate).
 *   - `.tool-btn`   — mutually exclusive tools (brush, eraser, shapes). At least
 *                     one must always stay active.
 */
export function initToolbar() {
  document.querySelectorAll(".toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => btn.classList.toggle("active"));
  });

  const toolBtns = document.querySelectorAll(".tool-btn");
  toolBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("active")) return;
      toolBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}
