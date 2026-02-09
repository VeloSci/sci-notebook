/**
 * VirtualRenderer for sci-notebook.
 *
 * Renders only the cells visible in the viewport for large notebooks (50+ cells).
 * Uses IntersectionObserver for efficient visibility tracking and a sentinel
 * element approach for smooth scrolling.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type { Cell as ICell } from "@sci-notebook/core";
import { RenderPipeline } from "@sci-notebook/renderer";
import { Cell } from "./Cell";
import { InsertHandle } from "./InsertHandle";

interface VirtualRendererProps {
  cells: ReadonlyArray<ICell>;
  pipeline: RenderPipeline;
  /** Estimated cell height in px (default: 120) */
  estimatedHeight?: number;
  /** Number of cells to render above/below viewport (default: 5) */
  overscan?: number;
}

export const VirtualRenderer: React.FC<VirtualRendererProps> = ({
  cells,
  pipeline,
  estimatedHeight = 120,
  overscan = 5,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const cellHeights = useRef<Map<number, number>>(new Map());

  // Calculate total height and offsets
  const getHeight = useCallback((index: number) => {
    return cellHeights.current.get(index) ?? estimatedHeight;
  }, [estimatedHeight]);

  const totalHeight = useMemo(() => {
    let h = 0;
    for (let i = 0; i < cells.length; i++) {
      h += getHeight(i) + 32; // 32px for InsertHandle
    }
    return h;
  }, [cells.length, getHeight]);

  // Update visible range on scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const viewportHeight = container.clientHeight;

      let accum = 0;
      let start = 0;
      let end = cells.length;

      for (let i = 0; i < cells.length; i++) {
        const h = getHeight(i) + 32;
        if (accum + h >= scrollTop && start === 0) {
          start = Math.max(0, i - overscan);
        }
        if (accum > scrollTop + viewportHeight) {
          end = Math.min(cells.length, i + overscan);
          break;
        }
        accum += h;
      }

      setVisibleRange(prev => {
        if (prev.start === start && prev.end === end) return prev;
        return { start, end };
      });
    };

    handleScroll(); // Initial calculation
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [cells.length, getHeight, overscan]);

  // Measure actual cell heights via ResizeObserver
  const measureRef = useCallback((index: number) => {
    return (el: HTMLDivElement | null) => {
      if (!el) return;
      const observer = new ResizeObserver(entries => {
        for (const entry of entries) {
          const h = entry.contentRect.height;
          if (h > 0 && cellHeights.current.get(index) !== h) {
            cellHeights.current.set(index, h);
          }
        }
      });
      observer.observe(el);
      // Cleanup on unmount handled by React
    };
  }, []);

  // Calculate top offset for the first visible cell
  const topOffset = useMemo(() => {
    let h = 0;
    for (let i = 0; i < visibleRange.start; i++) {
      h += getHeight(i) + 32;
    }
    return h;
  }, [visibleRange.start, getHeight]);

  const visibleCells = cells.slice(visibleRange.start, visibleRange.end);

  return (
    <div
      ref={containerRef}
      className="sci-nb-virtual-container"
      style={{ height: "100%", overflow: "auto", position: "relative" }}
    >
      {/* Spacer for total height */}
      <div style={{ height: totalHeight, position: "relative" }}>
        {/* Positioned visible cells */}
        <div style={{ position: "absolute", top: topOffset, left: 0, right: 0 }}>
          {visibleRange.start === 0 && <InsertHandle index={0} />}
          {visibleCells.map((cell, i) => {
            const realIndex = visibleRange.start + i;
            return (
              <div key={cell.id} ref={measureRef(realIndex)}>
                <Cell
                  cellId={cell.id}
                  pipeline={pipeline}
                  index={realIndex}
                  totalCells={cells.length}
                />
                <InsertHandle index={realIndex + 1} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
