<script setup>
import { mobileSupportNotebook } from '../.vitepress/theme/notebooks/mobile-support'
</script>

# Mobile & Touch Support

<InteractiveDoc :notebook="mobileSupportNotebook" title="Mobile & Touch — Interactive Notebook" />

The `MobileAdapter` provides touch-optimized interactions for notebooks on mobile devices.

---

## Quick Start

```typescript
import { MobileAdapter, getMobileCSS } from "@velo-sci/notebook-core";

// Inject mobile CSS
const style = document.createElement("style");
style.textContent = getMobileCSS();
document.head.appendChild(style);

// Create adapter
const adapter = new MobileAdapter(container, engine, {
  longPressDuration: 500,
  swipeThreshold: 80,
  enableHaptic: true,
});

// Clean up
adapter.destroy();
```

---

## Touch Gestures

| Gesture | Action |
|---------|--------|
| **Tap** | Focus cell |
| **Double-tap** | Enter edit mode |
| **Long press** (500ms) | Open context menu |
| **Swipe left** | Delete cell (with confirmation) |
| **Swipe right** | Duplicate cell |

---

## Haptic Feedback

On supported devices, the adapter provides haptic feedback via `navigator.vibrate()`:

- **Long press**: Short vibration (50ms)
- **Swipe action**: Medium vibration (100ms)

Disable with:

```typescript
const adapter = new MobileAdapter(container, engine, {
  enableHaptic: false,
});
```

---

## Responsive CSS

`getMobileCSS()` returns CSS with 3 breakpoints:

| Breakpoint | Width | Adjustments |
|------------|-------|-------------|
| **Small** | < 640px | Reduced padding, smaller fonts, stacked toolbar |
| **Medium** | < 1024px | Moderate padding, compact toolbar |
| **Large** | ≥ 1024px | Full desktop layout |

Additional features:
- **Safe area insets** for devices with notches (`env(safe-area-inset-*)`)
- **Touch-friendly hit targets** (minimum 44px)
- **Disabled hover effects** on touch devices

---

## Device Detection

```typescript
import { MobileAdapter } from "@velo-sci/notebook-core";

// Check if the device supports touch
const isTouch = MobileAdapter.isTouchDevice();

// Get viewport dimensions
const { width, height } = MobileAdapter.getViewportSize();
```

---

## Configuration

```typescript
interface MobileAdapterOptions {
  /** Duration in ms before a long press triggers (default: 500) */
  longPressDuration?: number;

  /** Minimum swipe distance in px to trigger action (default: 80) */
  swipeThreshold?: number;

  /** Enable haptic feedback via navigator.vibrate (default: true) */
  enableHaptic?: boolean;
}
```

---

## Integration with React

```tsx
import { useEffect, useRef } from "react";
import { MobileAdapter, getMobileCSS } from "@velo-sci/notebook-core";

function MobileNotebook({ engine }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!MobileAdapter.isTouchDevice()) return;

    const adapter = new MobileAdapter(containerRef.current, engine);
    return () => adapter.destroy();
  }, [engine]);

  return <div ref={containerRef}>...</div>;
}
```
