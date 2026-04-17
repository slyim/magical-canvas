import { UNDO_STACK_MAX } from "./constants.js";

/**
 * Undo/redo history for the p5 canvas.
 * Each snapshot is a full 1200×1200 pixel capture (~5.76 MB).
 * Up to UNDO_STACK_MAX snapshots are retained per stack.
 */
export function createHistory(p) {
  const undoStack = [];
  const redoStack = [];

  const restore = (snap) => {
    p.clear();
    p.image(snap, 0, 0);
  };

  return {
    save() {
      undoStack.push(p.get());
      if (undoStack.length > UNDO_STACK_MAX) undoStack.shift();
      redoStack.length = 0; // New action invalidates forward history
    },

    undo() {
      if (undoStack.length === 0) return false;
      redoStack.push(p.get()); // p.get() already returns a deep copy
      restore(undoStack.pop());
      return true;
    },

    redo() {
      if (redoStack.length === 0) return false;
      undoStack.push(p.get());
      restore(redoStack.pop());
      return true;
    },

    clear() {
      undoStack.length = 0;
      redoStack.length = 0;
    },
  };
}
