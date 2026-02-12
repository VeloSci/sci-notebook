import { createApp } from "vue";
import katex from "katex";
import "katex/dist/katex.min.css";
import mermaid from "mermaid";
import App from "./App.vue";
import "../../../packages/core/src/styles/index.css";
import "./index.css";

(globalThis as any).katex = katex;
(globalThis as any).mermaid = mermaid;
mermaid.initialize({ startOnLoad: false, theme: "default", securityLevel: "loose" });

createApp(App).mount("#app");
