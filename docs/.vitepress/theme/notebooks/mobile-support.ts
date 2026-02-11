export const mobileSupportNotebook = {
  id: "doc-mobile",
  title: "Mobile & Touch Support",
  cells: [
    {
      id: "mb-intro",
      type: "markdown",
      source: "# Mobile & Touch Support\n\nThe `MobileAdapter` provides touch-optimized interactions for notebooks on mobile devices. It includes gesture handling, haptic feedback, and responsive CSS with 3 breakpoints.",
      metadata: {},
    },
    {
      id: "mb-quick",
      type: "code",
      source: "import { MobileAdapter, getMobileCSS } from '@velo-sci/notebook-core';\n\n// Inject responsive CSS\nconst style = document.createElement('style');\nstyle.textContent = getMobileCSS();\ndocument.head.appendChild(style);\n\n// Create adapter\nconst adapter = new MobileAdapter(container, engine, {\n  longPressDuration: 500,   // ms before long press triggers\n  swipeThreshold: 80,       // px minimum swipe distance\n  enableHaptic: true,       // navigator.vibrate() feedback\n});\n\n// Clean up\nadapter.destroy();",
      metadata: { language: "typescript" },
    },
    {
      id: "mb-gestures",
      type: "markdown",
      source: "## Touch Gestures\n\n| Gesture | Action |\n|---------|--------|\n| **Tap** | Focus cell |\n| **Double-tap** | Enter edit mode |\n| **Long press** (500ms) | Open context menu |\n| **Swipe left** | Delete cell (with confirmation) |\n| **Swipe right** | Duplicate cell |",
      metadata: {},
    },
    {
      id: "mb-haptic",
      type: "markdown",
      source: "## Haptic Feedback\n\nOn supported devices, the adapter provides haptic feedback via `navigator.vibrate()`:\n\n- **Long press**: Short vibration (50ms)\n- **Swipe action**: Medium vibration (100ms)\n\nDisable with `enableHaptic: false`.",
      metadata: {},
    },
    {
      id: "mb-breakpoints",
      type: "markdown",
      source: "## Responsive CSS Breakpoints\n\n| Breakpoint | Width | Adjustments |\n|------------|-------|-------------|\n| **Small** | < 640px | Reduced padding, smaller fonts, stacked toolbar |\n| **Medium** | < 1024px | Moderate padding, compact toolbar |\n| **Large** | ≥ 1024px | Full desktop layout |\n\nAdditional features:\n- **Safe area insets** for notched devices (`env(safe-area-inset-*)`)\n- **Touch-friendly hit targets** (minimum 44px)\n- **Disabled hover effects** on touch devices",
      metadata: {},
    },
    {
      id: "mb-detect",
      type: "code",
      source: "// Device detection utilities\nimport { MobileAdapter } from '@velo-sci/notebook-core';\n\nconst isTouch = MobileAdapter.isTouchDevice();\nconst { width, height } = MobileAdapter.getViewportSize();\n\nif (isTouch) {\n  console.log(`Touch device: ${width}x${height}`);\n}",
      metadata: { language: "typescript" },
    },
    {
      id: "mb-react",
      type: "code",
      source: "// Integration with React\nimport { useEffect, useRef } from 'react';\nimport { MobileAdapter, getMobileCSS } from '@velo-sci/notebook-core';\n\nfunction MobileNotebook({ engine }) {\n  const containerRef = useRef(null);\n\n  useEffect(() => {\n    if (!MobileAdapter.isTouchDevice()) return;\n    const adapter = new MobileAdapter(containerRef.current, engine);\n    return () => adapter.destroy();\n  }, [engine]);\n\n  return <div ref={containerRef}>...</div>;\n}",
      metadata: { language: "tsx" },
    },
  ],
  metadata: { author: "sci-notebook-docs" },
  version: 1,
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};
