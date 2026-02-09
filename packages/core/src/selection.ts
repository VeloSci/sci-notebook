export interface SelectionState {
  /** Currently focused cell ID (keyboard navigation target) */
  focusedCellId: string | null;

  /** Set of selected cell IDs (for multi-select operations) */
  selectedCellIds: Set<string>;

  /** Text cursor position within the focused cell (for split/merge) */
  cursorOffset: number | null;

  /** Text selection range within the focused cell */
  textSelection: { start: number; end: number } | null;
}

export function createInitialSelection(): SelectionState {
  return {
    focusedCellId: null,
    selectedCellIds: new Set(),
    cursorOffset: null,
    textSelection: null,
  };
}
