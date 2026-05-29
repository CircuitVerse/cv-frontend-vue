import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "url";
import fs from "fs";
import path from "path";
import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite";

// https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
import vuetify from "vite-plugin-vuetify";

import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

function stripShebangPlugin() {
  return {
    name: "strip-shebang",
    transform(code: string, id: string) {
      if (id.includes("yosys2digitaljs") && code.startsWith("#!")) {
        return { code: code.replace(/^#!.*/, ""), map: null };
      }
      return null;
    },
  };
}

const yowaspAssetFiles = [
  "yosys.core.wasm",
  "yosys.core2.wasm",
  "yosys.core3.wasm",
  "yosys.core4.wasm",
  "yosys-resources.tar",
];

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

function copyYowaspAssets() {
  const yowaspGenDir = path.resolve(projectRoot, "node_modules/@yowasp/yosys/gen");

  function copyFiles(destDir: string, label: string) {
    fs.mkdirSync(destDir, { recursive: true });

    for (const file of yowaspAssetFiles) {
      const src = path.join(yowaspGenDir, file);
      const dest = path.join(destDir, file);

      if (!fs.existsSync(src)) {
        console.warn(`[copy-yowasp-assets] ${file} not found in ${yowaspGenDir}`);
        continue;
      }

      if (fs.existsSync(dest) && fs.statSync(src).size === fs.statSync(dest).size) {
        continue;
      }

      fs.copyFileSync(src, dest);
      const sizeMb = (fs.statSync(dest).size / 1024 / 1024).toFixed(2);
      console.log(`[copy-yowasp-assets] ${label}: copied ${file} (${sizeMb} MB)`);
    }
  }

  return {
    name: "copy-yowasp-assets",
    configureServer() {
      copyFiles(path.resolve(projectRoot, "public/assets"), "dev");
    },
    closeBundle() {
      const version = process.env.VITE_SIM_VERSION || "v0";
      copyFiles(path.resolve(projectRoot, `dist/simulatorvue/${version}/assets`), "build");
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(() => {
  const version = process.env.VITE_SIM_VERSION || "v0";
  const isDesktop = !!process.env.DESKTOP_MODE;

  return {
    plugins: [
      stripShebangPlugin(),
      copyYowaspAssets(),
      vue(),
      vuetify({ autoImport: true }),
      cssInjectedByJsPlugin(),
      VueI18nPlugin({
        strictMessage: false,
        // if you want to use Vue I18n Legacy API, you need to set `compositionOnly: false`
        // compositionOnly: false,

        // you need to set i18n resource including paths !
        include: fileURLToPath(new URL(`./${version}/src/locales/**/*.json`, import.meta.url)),
      }),
    ],
    optimizeDeps: {
      exclude: ["@yowasp/yosys"],
    },
    resolve: {
      alias: {
        "#": fileURLToPath(new URL(`./${version}/src`, import.meta.url)),
        "@": fileURLToPath(new URL(`./${version}/src/components`, import.meta.url)),
      },
    },
    base: process.env.VITE_BASE || (isDesktop ? "/" : `/simulatorvue/${version}/`),
    build: {
      outDir: `./dist/simulatorvue/${version}/`,
      assetsDir: "assets",
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        input: {
          main: fileURLToPath(new URL(`./${version}/index.html`, import.meta.url)),
        },
        output: {
          entryFileNames: `simulator-${version}.js`,
          chunkFileNames: `assets/[name]-[hash].js`,
          assetFileNames: `assets/[name]-[hash].[ext]`,
        },
      },
    },
    server: {
      port: 4000,
    },
    preview: {
      port: 4173,
    },
  };
});
