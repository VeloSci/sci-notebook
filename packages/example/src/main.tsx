import React from "react";
import ReactDOM from "react-dom/client";
import katex from "katex";
import "katex/dist/katex.min.css";
import mermaid from "mermaid";
import App from "./App";
import "./index.css";

// Expose KaTeX globally so the render pipeline can use it
(globalThis as any).katex = katex;

// Initialize Mermaid globally
(globalThis as any).mermaid = mermaid;
mermaid.initialize({ startOnLoad: false, theme: "default", securityLevel: "loose" });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
