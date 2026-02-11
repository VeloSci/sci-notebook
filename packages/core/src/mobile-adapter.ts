/**
 * Mobile / Touch-optimized adapter for sci-notebook.
 *
 * Handles touch events, gestures, and mobile-specific UX:
 * - Tap to focus/edit cell
 * - Long press for context menu
 * - Swipe left/right for cell actions
 * - Pinch to zoom (optional)
 * - Touch-friendly insert handles
 * - Responsive layout helpers
 */

import type { EditorEngine } from "./editor-engine";

export interface MobileAdapterConfig {
  /** Enable swipe gestures (default: true) */
  swipeEnabled?: boolean;
  /** Long press duration in ms (default: 500) */
  longPressDuration?: number;
  /** Swipe threshold in px (default: 50) */
  swipeThreshold?: number;
  /** Enable haptic feedback via navigator.vibrate (default: true) */
  hapticFeedback?: boolean;
  /** Callback for long press on a cell */
  onLongPress?: (cellId: string, x: number, y: number) => void;
  /** Callback for swipe left on a cell */
  onSwipeLeft?: (cellId: string) => void;
  /** Callback for swipe right on a cell */
  onSwipeRight?: (cellId: string) => void;
}

export interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  cellId: string | null;
  longPressTimer: ReturnType<typeof setTimeout> | null;
  swiping: boolean;
}

/**
 * Mobile adapter — attaches touch event handlers to a notebook container.
 */
export class MobileAdapter {
  private engine: EditorEngine;
  private container: HTMLElement;
  private config: Required<MobileAdapterConfig>;
  private touchState: TouchState = {
    startX: 0,
    startY: 0,
    startTime: 0,
    cellId: null,
    longPressTimer: null,
    swiping: false,
  };
  private destroyed = false;

  constructor(engine: EditorEngine, container: HTMLElement, config: MobileAdapterConfig = {}) {
    this.engine = engine;
    this.container = container;
    this.config = {
      swipeEnabled: config.swipeEnabled ?? true,
      longPressDuration: config.longPressDuration ?? 500,
      swipeThreshold: config.swipeThreshold ?? 50,
      hapticFeedback: config.hapticFeedback ?? true,
      onLongPress: config.onLongPress ?? (() => {}),
      onSwipeLeft: config.onSwipeLeft ?? (() => {}),
      onSwipeRight: config.onSwipeRight ?? (() => {}),
    };

    this.bindEvents();
    this.injectMobileStyles();
  }

  private bindEvents(): void {
    this.container.addEventListener("touchstart", this.onTouchStart, { passive: false });
    this.container.addEventListener("touchmove", this.onTouchMove, { passive: false });
    this.container.addEventListener("touchend", this.onTouchEnd, { passive: false });
    this.container.addEventListener("touchcancel", this.onTouchCancel, { passive: false });
  }

  private onTouchStart = (e: TouchEvent): void => {
    if (this.destroyed) return;
    const touch = e.touches[0];
    if (!touch) return;

    const cellEl = (e.target as HTMLElement).closest<HTMLElement>("[data-cell-id]");
    const cellId = cellEl?.dataset.cellId ?? null;

    this.touchState = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      cellId,
      longPressTimer: null,
      swiping: false,
    };

    // Long press detection
    if (cellId) {
      this.touchState.longPressTimer = setTimeout(() => {
        if (!this.touchState.swiping && cellId) {
          this.vibrate(30);
          this.config.onLongPress(cellId, touch.clientX, touch.clientY);
        }
      }, this.config.longPressDuration);
    }
  };

  private onTouchMove = (e: TouchEvent): void => {
    if (this.destroyed) return;
    const touch = e.touches[0];
    if (!touch) return;

    const dx = touch.clientX - this.touchState.startX;
    const dy = touch.clientY - this.touchState.startY;

    // Cancel long press if finger moves
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      this.cancelLongPress();
    }

    // Detect horizontal swipe
    if (this.config.swipeEnabled && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20) {
      this.touchState.swiping = true;

      // Apply visual feedback: translate the cell element
      if (this.touchState.cellId) {
        const cellEl = this.container.querySelector<HTMLElement>(
          `[data-cell-id="${this.touchState.cellId}"]`
        );
        if (cellEl) {
          const clampedDx = Math.max(-120, Math.min(120, dx));
          cellEl.style.transform = `translateX(${clampedDx}px)`;
          cellEl.style.transition = "none";
        }
      }
    }
  };

  private onTouchEnd = (e: TouchEvent): void => {
    if (this.destroyed) return;
    this.cancelLongPress();

    const touch = e.changedTouches[0];
    if (!touch) return;

    const dx = touch.clientX - this.touchState.startX;
    const duration = Date.now() - this.touchState.startTime;

    // Reset cell transform
    if (this.touchState.cellId) {
      const cellEl = this.container.querySelector<HTMLElement>(
        `[data-cell-id="${this.touchState.cellId}"]`
      );
      if (cellEl) {
        cellEl.style.transform = "";
        cellEl.style.transition = "transform 0.2s ease";
      }
    }

    // Handle swipe
    if (this.touchState.swiping && this.touchState.cellId) {
      if (Math.abs(dx) >= this.config.swipeThreshold) {
        this.vibrate(15);
        if (dx < 0) {
          this.config.onSwipeLeft(this.touchState.cellId);
        } else {
          this.config.onSwipeRight(this.touchState.cellId);
        }
      }
    }

    // Handle tap (short touch without swipe)
    if (!this.touchState.swiping && duration < 300 && this.touchState.cellId) {
      this.engine.focusCell(this.touchState.cellId);

      // Double-tap to edit
      const now = Date.now();
      const lastTap = (this.container as any).__lastTap || 0;
      if (now - lastTap < 300) {
        this.engine.setEditMode(this.touchState.cellId);
      }
      (this.container as any).__lastTap = now;
    }

    this.touchState.swiping = false;
  };

  private onTouchCancel = (): void => {
    this.cancelLongPress();
    this.touchState.swiping = false;

    // Reset any cell transforms
    if (this.touchState.cellId) {
      const cellEl = this.container.querySelector<HTMLElement>(
        `[data-cell-id="${this.touchState.cellId}"]`
      );
      if (cellEl) {
        cellEl.style.transform = "";
        cellEl.style.transition = "transform 0.2s ease";
      }
    }
  };

  private cancelLongPress(): void {
    if (this.touchState.longPressTimer) {
      clearTimeout(this.touchState.longPressTimer);
      this.touchState.longPressTimer = null;
    }
  }

  private vibrate(duration: number): void {
    if (this.config.hapticFeedback && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(duration);
    }
  }

  private injectMobileStyles(): void {
    if (typeof document === "undefined") return;

    const styleId = "sci-nb-mobile-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = getMobileCSS();
    document.head.appendChild(style);
  }

  /**
   * Check if the current device is likely mobile/touch.
   */
  static isTouchDevice(): boolean {
    if (typeof window === "undefined") return false;
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Get the current viewport size category.
   */
  static getViewportSize(): "small" | "medium" | "large" {
    if (typeof window === "undefined") return "large";
    const w = window.innerWidth;
    if (w < 640) return "small";
    if (w < 1024) return "medium";
    return "large";
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.cancelLongPress();
    this.container.removeEventListener("touchstart", this.onTouchStart);
    this.container.removeEventListener("touchmove", this.onTouchMove);
    this.container.removeEventListener("touchend", this.onTouchEnd);
    this.container.removeEventListener("touchcancel", this.onTouchCancel);
  }
}

/**
 * CSS for mobile-optimized notebook layout.
 */
export function getMobileCSS(): string {
  return `
@media (max-width: 640px) {
  .sci-nb { padding: 0; }
  .sci-nb-toolbar { padding: 8px 12px; flex-wrap: wrap; gap: 4px; }
  .sci-nb-toolbar-btn { padding: 6px 8px; font-size: 11px; }
  .sci-nb-cells { padding: 0 8px; }
  .sci-nb-cell { margin: 4px 0; border-radius: 8px; }
  .sci-nb-cell-content { padding: 12px; font-size: 14px; }
  .sci-nb-cell-editor { font-size: 14px; min-height: 80px; }
  .sci-nb-cell-handle { width: 24px; min-width: 24px; }
  .sci-nb-cell-actions { gap: 2px; }
  .sci-nb-cell-action { padding: 4px 6px; font-size: 11px; }
  .sci-nb-insert-handle { height: 24px; }
  .sci-nb-insert-btn { width: 28px; height: 28px; font-size: 16px; }
  .sci-nb-toc { display: none; }
  .sci-nb-layout { flex-direction: column !important; }

  /* Touch-friendly hit targets */
  .sci-nb-cell { min-height: 44px; }
  .sci-nb-toolbar-btn { min-height: 36px; min-width: 36px; }
  .sci-nb-insert-btn { min-height: 36px; min-width: 36px; }

  /* Swipe action indicators */
  .sci-nb-cell { overflow: hidden; position: relative; }
  .sci-nb-cell::before {
    content: '🗑️';
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0;
    transition: opacity 0.2s;
    font-size: 20px;
  }
  .sci-nb-cell::after {
    content: '📋';
    position: absolute;
    left: 8px;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0;
    transition: opacity 0.2s;
    font-size: 20px;
  }
}

@media (min-width: 641px) and (max-width: 1024px) {
  .sci-nb-cell-content { padding: 14px; }
  .sci-nb-toolbar { padding: 10px 16px; }
}

/* Safe area insets for notched devices */
@supports (padding: env(safe-area-inset-bottom)) {
  .sci-nb-toolbar { padding-top: max(12px, env(safe-area-inset-top)); }
  .sci-nb { padding-bottom: env(safe-area-inset-bottom); }
}
`;
}
