import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

const buildVersion = process.env.GITHUB_SHA || `${Date.now()}`;

export default defineConfig({
  base: "/",
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^react\/jsx-runtime$/, replacement: fileURLToPath(new URL("./src/lib/legacySkinJsxRuntime.ts", import.meta.url)) },
      { find: /^react\/jsx-dev-runtime$/, replacement: fileURLToPath(new URL("./src/lib/legacySkinJsxDevRuntime.ts", import.meta.url)) },
    ],
  },
  define: {
    __BUILD_VERSION__: JSON.stringify(buildVersion),
  },
});
