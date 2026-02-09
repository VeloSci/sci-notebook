/**
 * Image Resize Handles for sci-notebook.
 *
 * Wraps an image element with draggable resize handles (SE corner).
 * Reports new width back to the parent via onResize callback.
 */

import React, { useState, useCallback, useRef, useEffect } from "react";

interface ImageResizeProps {
  src: string;
  alt?: string;
  initialWidth: string;
  maxWidth?: string;
  onResize: (newWidth: string) => void;
  children?: React.ReactNode;
}

export const ImageResize: React.FC<ImageResizeProps> = ({
  src,
  alt = "",
  initialWidth,
  maxWidth = "100%",
  onResize,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [dragging, setDragging] = useState(false);
  const [width, setWidth] = useState<number | null>(null);
  const startRef = useRef<{ x: number; w: number }>({ x: 0, w: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const img = imgRef.current;
    if (!img) return;

    startRef.current = { x: e.clientX, w: img.offsetWidth };
    setDragging(true);
  }, []);

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startRef.current.x;
      const newW = Math.max(50, startRef.current.w + dx);
      setWidth(newW);
    };

    const handleMouseUp = () => {
      setDragging(false);
      if (width !== null && containerRef.current) {
        const parentW = containerRef.current.parentElement?.offsetWidth || 1;
        const pct = Math.round((width / parentW) * 100);
        onResize(`${Math.min(pct, 100)}%`);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, width, onResize]);

  const style: React.CSSProperties = {
    maxWidth,
    width: width !== null ? `${width}px` : initialWidth,
    position: "relative",
    display: "inline-block",
  };

  return (
    <div ref={containerRef} className="sci-nb-image-resizable" style={style}>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        style={{ width: "100%", height: "auto", display: "block" }}
        draggable={false}
      />
      {children}
      <div
        className="sci-nb-image-resize-handle sci-nb-image-resize-handle--se"
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};
