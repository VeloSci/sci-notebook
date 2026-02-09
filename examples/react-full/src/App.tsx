import React, { useState } from "react";
import { SciNotebook } from "@sci-notebook/react";
import { latexPlugin } from "@sci-notebook/plugin-latex";
import { aiPlugin } from "@sci-notebook/plugin-ai";
import "@sci-notebook/core/src/styles/index.css";

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
    <div style={{ padding: "40px" }}>
      <h1>Scientific Notebook Demo</h1>
      <SciNotebook
        notebook={notebook as any}
        onChange={(nb) => setNotebook(nb as any)}
        theme="light"
      />
    </div>
  );
}
