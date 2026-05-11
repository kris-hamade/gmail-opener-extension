import { defineConfig } from "vite";
import { copyFileSync, existsSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import AdmZip from "adm-zip";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const distDir = resolve(rootDir, "dist");
const zipPath = resolve(rootDir, "gmail-opener-extension.zip");

function copyIfExists(sourceName, targetName = sourceName) {
  const sourcePath = resolve(rootDir, sourceName);
  const targetPath = resolve(distDir, targetName);

  if (existsSync(sourcePath)) {
    copyFileSync(sourcePath, targetPath);
  }
}

function zipExtension() {
  const zip = new AdmZip();
  zip.addLocalFolder(distDir, "");
  zip.writeZip(zipPath);
}

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    minify: "esbuild",
    rollupOptions: {
      input: {
        background: resolve(rootDir, "background.js"),
        content: resolve(rootDir, "content.js"),
        popup: resolve(rootDir, "popup.js"),
        options: resolve(rootDir, "options.js")
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name][extname]"
      }
    }
  },
  plugins: [
    {
      name: "copy-extension-assets",
      closeBundle() {
        copyIfExists("manifest.json");
        copyIfExists("popup.html");
        copyIfExists("options.html");
        copyIfExists("icon.png");
        zipExtension();
      }
    }
  ]
});