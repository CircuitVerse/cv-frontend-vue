import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "url";
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

function wasmMimePlugin() {
  return {
    name: "wasm-mime-type",
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const pathname = (req.url || "").split("?")[0];
        if (pathname.endsWith(".wasm")) {
          res.setHeader("Content-Type", "application/wasm");
        }
        next();
      });
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
      wasmMimePlugin(),
      vue(),
      vuetify({ autoImport: true }),
      cssInjectedByJsPlugin(),
      VueI18nPlugin({
        strictMessage: false,
      }),
    ],
    optimizeDeps: {
      // Vue is excluded from pre-bundling: bundling its esm-bundler runtime
      // alongside vuetify + vue-i18n triggers a runtime
      // "init_runtime_dom_esm_bundler is not defined" ReferenceError in dev.
      exclude: ["@yowasp/yosys", "vue"],
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
      watch: {
        ignored: ["**/src-tauri/target/**"],
      },
    },
    preview: {
      port: 4173,
    },
  };
});
