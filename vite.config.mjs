import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    outDir: "assets",
    emptyOutDir: false,
    rollupOptions: {
      input: "src/main.js",
      output: {
        entryFileNames: "tailwind.js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith(".css")) {
            return "tailwind.css";
          }

          return "asset-[name][extname]";
        },
      },
    },
  },
});
