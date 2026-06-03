import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  root: path.resolve(__dirname),
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src/renderer"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: "build/renderer",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        /* Main React app */
        main:   path.resolve(__dirname, "index.html"),
        /* Splash screen — standalone, no bundling needed */
        splash: path.resolve(__dirname, "src/renderer/splash.html"),
      },
    },
  },
});
