import { EventBus, EditorEngine } from '@velo-sci/notebook-core';

export class WordCountPlugin {
  constructor(private engine: EditorEngine, private eventBus: EventBus) {
    this.mount();
  }

  mount() {
    // Listen for events emitted when cells are updated or added
    this.eventBus.on('notebook:changed', (notebookState) => {
      let totalWords = 0;
      
      notebookState.cells.forEach(cell => {
         if (cell.type === 'markdown' || cell.type === 'raw') {
            const words = cell.source.split(/\s+/).filter(w => w.length > 0).length;
            totalWords += words;
         }
      });
      console.log(`Current Document Word Count: ${totalWords}`);
    });
  }
}

// In your application root
// const engine = new EditorEngine(initialData)
// const plugin = new WordCountPlugin(engine, engine.getEventBus())
