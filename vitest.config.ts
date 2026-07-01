import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "url";

import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";
import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

const synthesisSpecs = ["v1/src/simulator/spec/synthesis.spec.js"];

const createProjectConfig = (version: string) => ({
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
      "#": fileURLToPath(
        new URL(version === "src" ? "./src" : `./${version}/src`, import.meta.url),
      ),
      "@": fileURLToPath(
        new URL(
          version === "src" ? "./src/components" : `./${version}/src/components`,
          import.meta.url,
        ),
      ),
    },
  },

  test: {
    name: version,
    globals: true,
    environment: "jsdom" as const,
    environmentOptions: {
      jsdom: {
        url: "http://localhost:8080",
      },
    },

    include: [
      version === "src"
        ? "src/**/*.{spec,test}.{js,ts}"
        : `${version}/src/**/*.{spec,test}.{js,ts}`,
    ],

    exclude:
      version === "src"
        ? ["v0/**/*", "v1/**/*", ...synthesisSpecs]
        : ["src/**/*", version === "v0" ? "v1/**/*" : "v0/**/*", ...synthesisSpecs],

    setupFiles: [
      version === "src"
        ? "./src/simulator/spec/vitestSetup.ts"
        : `./${version}/src/simulator/spec/vitestSetup.ts`,
    ],

    server: {
      deps: {
        inline: ["vuetify"],
      },
    },
  },
});

const synthesisProject = {
  test: {
    name: "synthesis",
    environment: "node" as const,
    include: synthesisSpecs,
  },
};

export default defineConfig({
  test: {
    projects: [createProjectConfig("src"), createProjectConfig("v1"), synthesisProject],
  },
});
