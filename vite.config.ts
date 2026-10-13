import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "url";
import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite";

// https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
import vuetify from "vite-plugin-vuetify";

import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

// Drop legacy icon-font formats (eot/woff/ttf) so Vite only emits woff2.
// All supported browsers read woff2; the icon class rules are untouched.
function woff2OnlyFontsPlugin() {
  return {
    name: "woff2-only-fonts",
    enforce: "pre" as const,
    transform(code: string, id: string) {
      if (id.endsWith("@mdi/font/css/materialdesignicons.css")) {
        return {
          code: code
            .replace(/\s*src:\s*url\([^)]*\.eot\?v=[^)]*\)\s*;/g, "")
            .replace(/\s*url\([^)]*\.eot\?#iefix[^)]*\)\s*format\("embedded-opentype"\),/g, "")
            .replace(/,\s*url\([^)]*\.woff\?v=[^)]*\)\s*format\("woff"\)/g, "")
            .replace(/,\s*url\([^)]*\.ttf\?v=[^)]*\)\s*format\("truetype"\)/g, ""),
          map: null,
        };
      }
      if (id.includes("@fortawesome/fontawesome-free/css/")) {
        return {
          code: code.replace(/,\s*url\([^)]*\.ttf[^)]*\)\s*format\("truetype"\)/g, ""),
          map: null,
        };
      }
      return null;
    },
  };
}

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
      woff2OnlyFontsPlugin(),
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
    root: fileURLToPath(new URL(`./${version}`, import.meta.url)),
    base: process.env.VITE_BASE || (isDesktop ? "/" : `/simulatorvue/${version}/`),
    build: {
      outDir: fileURLToPath(new URL(`./dist/simulatorvue/${version}/`, import.meta.url)),
      assetsDir: "assets",
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          entryFileNames: `simulator-${version}.js`,
          chunkFileNames: `assets/[name]-[hash].js`,
          assetFileNames: `assets/[name]-[hash].[ext]`,
        },
      },
    },
    server: {
      port: 4000,
      ...(process.env.DEV_CONTAINER === "true"
        ? {
            host: true,
            strictPort: true,
            ...(process.env.CODESPACES === "true" && process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN
              ? { allowedHosts: [`.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`] }
              : {}),
          }
        : {}),
      watch: {
        ignored: ["**/src-tauri/target/**"],
      },
    },
    preview: {
      port: 4173,
    },
  };
});
