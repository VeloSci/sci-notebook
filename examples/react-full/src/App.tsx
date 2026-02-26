import React, { useState } from "react";
import { SciNotebook } from "@velo-sci/notebook-react";
import { latexPlugin } from "@velo-sci/notebook-plugin-latex";
import { aiPlugin } from "@velo-sci/notebook-plugin-ai";
import "@velo-sci/notebook-core/src/styles/index.css";

const initialNotebook = {
  id: "example-nb",
  title: "Sci-Notebook Demo",
  version: 1,
  cells: [
    {
      id: "cell-1",
      type: "markdown",
      source: "# Welcome to Sci-Notebook\nThis is a scientific notebook framework.",
      metadata: {},
    },
    {
      id: "cell-2",
      type: "latex",
      source: "$$ E = mc^2 $$",
      metadata: {},
    },
    {
      id: "cell-3",
      type: "markdown",
      source: "You can use inline math too: $ \\sqrt{a^2 + b^2} = c $",
      metadata: {},
    }
  ],
  metadata: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function App() {
  const [notebook, setNotebook] = useState(initialNotebook);

  return (
    <div className="app" data-app-theme="light">
      <header className="app-header">
        <h1>
          Scientific Notebook <span className="app-framework-badge">React</span>
        </h1>
      </header>
      <SciNotebook
        notebook={notebook as any}
        onChange={(nb) => setNotebook(nb as any)}
        theme="light"
      />
    </div>
  );
}
