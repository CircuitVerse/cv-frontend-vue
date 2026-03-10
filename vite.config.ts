/// <reference types="vitest" />
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "url";
import vueI18n from "@intlify/vite-plugin-vue-i18n";
import vuetify from "vite-plugin-vuetify";
import { createHtmlPlugin } from "vite-plugin-html";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig(() => {
  const version = process.env.VITE_SIM_VERSION || "v0";
  const isDesktop = !!process.env.DESKTOP_MODE;

  return {
    plugins: [
      vue(),
      vuetify({ autoImport: true }),
      cssInjectedByJsPlugin(),
      vueI18n({
        include: fileURLToPath(new URL(`./${version}/src/locales/**`, import.meta.url)),
      }),
    ],
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
          chunkFileNames: `assets/[name].js`,
          assetFileNames: `assets/[name].[ext]`,
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
