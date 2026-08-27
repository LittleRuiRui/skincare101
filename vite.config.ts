import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const buildVersion = process.env.GITHUB_SHA || `${Date.now()}`;

export default defineConfig({
  base: "/skincare101/",
  plugins: [react()],
  define: {
    __BUILD_VERSION__: JSON.stringify(buildVersion),
  },
});
