import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "url";
import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite";

// https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
import vuetify from "vite-plugin-vuetify";

import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

// https://vitejs.dev/config/
export default defineConfig(() => {
  const version = process.env.VITE_SIM_VERSION || "v0";
  const isDesktop = !!process.env.DESKTOP_MODE;

  return {
    plugins: [
      vue(),
      vuetify({ autoImport: true }),
      cssInjectedByJsPlugin(),
      VueI18nPlugin({
        strictMessage: false,
      }),
    ],
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
    },
    preview: {
      port: 4173,
    },
  };
});
