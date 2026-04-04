import { UNDO_STACK_MAX } from './constants.js';

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
      redoStack.push(p.get());
      const prev = undoStack.pop();
      p.clear(0, 0, 0, 0);
      p.image(prev, 0, 0);
      return true;
    },

    redo() {
      if (redoStack.length === 0) return false;
      undoStack.push(p.get());
      const next = redoStack.pop();
      p.clear(0, 0, 0, 0);
      p.image(next, 0, 0);
      return true;
    },
  };
}
