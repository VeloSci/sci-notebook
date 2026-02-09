import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@sci-notebook/core": path.resolve(__dirname, "packages/core/src"),
      "@sci-notebook/renderer": path.resolve(__dirname, "packages/renderer/src"),
      "@sci-notebook/react": path.resolve(__dirname, "packages/react/src"),
      "@sci-notebook/plugin-latex": path.resolve(__dirname, "packages/plugin-latex/src"),
      "@sci-notebook/plugin-ai": path.resolve(__dirname, "packages/plugin-ai/src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["packages/**/*.spec.ts", "packages/**/*.spec.tsx"],
  },
});
