---
description: Guide on how to create new cells and plugins in sci-notebook for AI Agents
---
# AI SYSTEM INSTRUCTION: Component Creation Guide

**CRITICAL DIRECTIVE**: Follow these concrete steps verbatim when tasked with creating new functional Cell types or Engine Plugins in `sci-notebook`.

---

## TASK A: Creating a New Cell Type (e.g., a "Chart" cell)

If you are asked to create a new module visually represented in the notebook (e.g., a Chart, a Video Player, a Questionnaire), you are creating a "Cell Type".

### Step 1: Define the Data Model
A Cell has this inherent structure in TypeScript:
```typescript
interface Cell {
  id: string;      // Generated UUID
  type: string;    // e.g., 'chart' (Your new type identifier)
  source: string;  // The primary data payload (could be stringified JSON)
  metadata: Record<string, any>; // Secondary data payload
}
```

### Step 2: Implement the UI Component Component
You must implement the rendering in the relevant framework library (e.g., `packages/react/src/cells/ChartCell.tsx`).

**Rules for Cell Components:**
1. **Props**: Must accept the `Cell` object and engine callbacks (`onChange`, `onFocus`, `onBlur`).
2. **Immutability**: Never mutate the `Cell` object passed via props.
3. **Communication**: To save data, call `onChange(cell.id, { source: newSourceData })`. The Engine handles the rest.
4. **Active State**: The component should visually differentiate when it is actively being edited vs. when it is read-only.

**Reference Implementation (React):**
```tsx
import React from 'react';

export function ChartCell({ cell, onChange, isEditing, onFocus, onBlur }) {
  // 1. Data parsing
  const chartConfig = JSON.parse(cell.source || '{}');

  // 2. Data modification
  const updateChartTitle = (title) => {
    const updated = { ...chartConfig, title };
    onChange(cell.id, { source: JSON.stringify(updated) });
  };

  return (
    <div 
      className={`sci-cell-chart ${isEditing ? 'sci-state-editing' : ''}`}
      onClick={onFocus} // Let the engine know this cell is active
    >
      {isEditing ? (
        <input 
          value={chartConfig.title} 
          onChange={(e) => updateChartTitle(e.target.value)} 
          onBlur={onBlur} // Let the engine know we lost focus
        />
      ) : (
        <h3>{chartConfig.title}</h3>
      )}
      <div className="sci-chart-canvas">/* Render logic */</div>
    </div>
  );
}
```

### Step 3: Register the Cell in the Engine
When the user initializes `<SciNotebook>`, they must register your rendering component against the string `type`:

```tsx
const customRenderers = {
  'chart': ChartCell, // Maps `type: 'chart'` to the ChartCell logic
};
// Passed into <SciNotebook customRenderers={customRenderers} />
```

---

## TASK B: Creating a Core Action Plugin

If you are asked to add functionality that listens to User behavior, fetches remote data globally, or modifies text outside of a specific cell UI, you are creating a "Plugin".

### Step 1: Plugin Definition
Plugins live in `packages/plugin-[name]`. They are vanilla TypeScript classes that receive the `EditorEngine` and `EventBus` instance.

### Step 2: Subscribe to the EventBus
Hook into existing events without touching the core repository.

**Reference Implementation:**
```typescript
import { EventBus, EditorEngine } from '@velo-sci/notebook-core';

export class CustomAutoSavePlugin {
  constructor(private engine: EditorEngine, private eventBus: EventBus) {
    this.mount();
  }

  mount() {
    // Listen to changes in the notebook structure or content
    this.eventBus.on('notebook:changed', (notebookState) => {
      this.triggerDebouncedSave(notebookState);
    });

    // Listen to global keystrokes
    this.eventBus.on('cell:keydown', ({ cellId, event }) => {
       if (event.ctrlKey && event.key === 's') {
          event.preventDefault();
          this.forceSave();
       }
    });
  }

  private triggerDebouncedSave(state) {
    // API Call logic goes here
  }
  
  private forceSave() {
     // API Call logic goes here
  }
}
```

### Step 3: Registration
Users instantiate the plugin and pass it to the engine configuration.

```typescript
const autoSaver = new CustomAutoSavePlugin(engine, eventBus);
```
