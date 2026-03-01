import React, { useState } from 'react';
import { SciNotebook } from '@velo-sci/notebook-react';
import '@velo-sci/notebook-core/styles/index.css';

const initialData = {
  id: 'doc-1',
  title: 'Untitled Notebook',
  version: 1,
  cells: [
    { id: '1', type: 'markdown', source: '# Hello Sci-Notebook', metadata: {} },
    { id: '2', type: 'code', source: 'console.log("Executable cell");', metadata: { language: 'javascript' } }
  ]
};

export function NotebookApp() {
  const [notebook, setNotebook] = useState(initialData);

  const handleSave = async (updatedNotebook) => {
    setNotebook(updatedNotebook);
    // Pretend to save to a database
    await fetch('/api/notebooks/' + updatedNotebook.id, {
        method: 'POST',
        body: JSON.stringify(updatedNotebook)
    });
  };

  return (
    <div className="editor-layout">
      <SciNotebook
        notebook={notebook}
        onChange={handleSave}
        theme="dark"
        readOnly={false}
      />
    </div>
  );
}
