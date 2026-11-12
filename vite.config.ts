import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Relative base: the build works at any path (GitHub Pages project sites,
  // a domain root, even opening dist/index.html from disk).
  base: "./",
  server: {
    port: 5173,
  },
  build: { outDir: "dist", sourcemap: false },
});
