export interface Command {
  /** Human-readable label for the undo stack UI */
  label: string;
  /** Apply the mutation */
  execute(): void;
  /** Reverse the mutation */
  undo(): void;
}

/**
 * Manages undo/redo history with command pattern and batching
 */
export class HistoryManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxDepth: number;
  private batchTimer: any = null;
  private currentBatch: Command[] = [];

  constructor(maxDepth: number = 100) {
    this.maxDepth = maxDepth;
  }

  push(cmd: Command): void {
    // If we have a redo stack, clear it when a new mutation happens
    this.redoStack = [];

    this.undoStack.push(cmd);
    if (this.undoStack.length > this.maxDepth) {
      this.undoStack.shift();
    }
  }

  undo(): boolean {
    const cmd = this.undoStack.pop();
    if (cmd) {
      cmd.undo();
      this.redoStack.push(cmd);
      return true;
    }
    return false;
  }

  redo(): boolean {
    const cmd = this.redoStack.pop();
    if (cmd) {
      cmd.execute();
      this.undoStack.push(cmd);
      return true;
    }
    return false;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  checkpoint(): void {
    // Force a new undo boundary
    // In a real implementation, this might involve flushing batched edits
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
