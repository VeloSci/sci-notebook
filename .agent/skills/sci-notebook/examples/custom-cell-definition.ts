import { CellDefinition } from '@velo-sci/notebook-core';

// Example: Defining the Data Model and Rendering logic for a Custom 'Alert' Cell
export const AlertCellDefinition: CellDefinition = {
    type: 'alert',
    
    // Abstract data structure
    create: (initialSource = '') => ({
        id: crypto.randomUUID(),
        type: 'alert',
        source: initialSource,
        metadata: {
            level: 'info' // info, warning, danger
        }
    }),

    // Default serialization for plain text or markdown export
    serialize: (cell) => {
        return `> [!${cell.metadata.level.toUpperCase()}]\\n> ${cell.source}\\n`;
    }
};

// UI Component mapping happens in the framework layer (e.g., React setup):
// <SciNotebook
//    customCells={{ 
//       alert: AlertReactComponent 
//    }}
// />
