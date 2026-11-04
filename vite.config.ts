import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "url";
import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite";
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

// Fallback resolver for v0 where ./src is symlinked inside ./v0
function v0SymlinkFallbackPlugin(version: string) {
  return {
    name: "v0-symlink-fallback",
    resolveId(id: string) {
      if (version === "v0") {
        if (
          id === "/src/main.ts" ||
          id === "./src/main.ts" ||
          id.startsWith("/src/") ||
          id.startsWith("./src/")
        ) {
          return fileURLToPath(
            new URL(id.replace(/^\.?\/src\//, "./src/"), import.meta.url)
          );
        }
      }
      return null;
    },
  };
}

export default defineConfig(() => {
  const version = process.env.VITE_SIM_VERSION || "v0";
  const isDesktop = !process.env.DESKTOP_MODE;
  return {
    plugins: [
      stripShebangPlugin(),
      wasmMimePlugin(),
      v0SymlinkFallbackPlugin(version),
      vue(),
      vuetify({ autoImport: true }),
      cssInjectedByJsPlugin(),
      VueI18nPlugin({
        strictMessage: false,
      }),
    ],
    optimizeDeps: {
      exclude: ["@yowasp/yosys", "vue"],
    },
    resolve: {
      alias: {
        "#": fileURLToPath(
          new URL(version === "v0" ? "./src" : `./${version}/src`, import.meta.url)
        ),
        "@": fileURLToPath(
          new URL(
            version === "v0" ? "./src/components" : `./${version}/src/components`,
            import.meta.url
          )
        ),
      },
    },
    root: fileURLToPath(new URL(`./${version}`, import.meta.url)),
    base: process.env.VITE_BASE || (isDesktop ? "/" : `/simulatorvue/${version}/`),
    build: {
      outDir: fileURLToPath(
        new URL(`./dist/simulatorvue/${version}/`, import.meta.url)
      ),
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
      fs: {
        allow: [".."],
      },
      watch: {
        ignored: ["**/src-tauri/target/**"],
      },
    },
    preview: {
      port: 4173,
    },
  };
});
