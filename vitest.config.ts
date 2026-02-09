import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@velo-sci/notebook-core": path.resolve(__dirname, "packages/core/src"),
      "@velo-sci/notebook-renderer": path.resolve(__dirname, "packages/renderer/src"),
      "@velo-sci/notebook-react": path.resolve(__dirname, "packages/react/src"),
      "@velo-sci/notebook-plugin-latex": path.resolve(__dirname, "packages/plugin-latex/src"),
      "@velo-sci/notebook-plugin-ai": path.resolve(__dirname, "packages/plugin-ai/src"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.spec.ts", "src/**/*.spec.tsx", "packages/**/*.spec.ts", "packages/**/*.spec.tsx"],
    passWithNoTests: true,
  },
});
