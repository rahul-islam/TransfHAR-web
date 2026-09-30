import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// BASE lets the same build serve from a GitHub Pages subpath (/TransfHAR-web/) or a custom domain root.
export default defineConfig({
  base: process.env.BASE ?? "/",
  plugins: [react()],
});
