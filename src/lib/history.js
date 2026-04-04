import { UNDO_STACK_MAX } from "./constants.js";

/**
 * Creates an undo/redo history manager for the p5 canvas.
 * Each snapshot is a full 1200×1200 pixel capture (~5.76 MB each).
 * Up to UNDO_STACK_MAX snapshots are kept in memory at once.
 */
export function createHistory(p) {
  let undoStack = [];
  let redoStack = [];

  return {
    save() {
      undoStack.push(p.get());
      if (undoStack.length > UNDO_STACK_MAX) undoStack.shift();
      redoStack = []; // New action clears forward history
    },

    undo() {
      if (undoStack.length === 0) return false;
      // Push a deep-cloned snapshot of the current canvas into redoStack
      const current = p.get();
      const currentClone = p.createImage(current.width, current.height);
      currentClone.copy(
        current,
        0,
        0,
        current.width,
        current.height,
        0,
        0,
        current.width,
        current.height,
      );
      redoStack.push(currentClone);
      const prev = undoStack.pop();
      p.clear();
      p.image(prev, 0, 0);
      return true;
    },

    redo() {
      if (redoStack.length === 0) return false;
      // Push a deep-cloned snapshot of the current canvas into undoStack
      const current = p.get();
      const currentClone = p.createImage(current.width, current.height);
      currentClone.copy(
        current,
        0,
        0,
        current.width,
        current.height,
        0,
        0,
        current.width,
        current.height,
      );
      undoStack.push(currentClone);
      const next = redoStack.pop();
      p.clear();
      p.image(next, 0, 0);
      return true;
    },
  };
}
