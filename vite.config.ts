/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'url'
import vueI18n from '@intlify/vite-plugin-vue-i18n'

const proxyUrl = 'http://localhost:3000'
const isDesktop = process.env.DESKTOP_MODE === 'true'

export default defineConfig(() => ({
  plugins: [
    vue(),
    vueI18n({
      include: fileURLToPath(
        new URL('./v0/src/locales/**', import.meta.url)
      ),
    }),
  ],

  resolve: {
    alias: {
      '#': fileURLToPath(new URL('./v0/src', import.meta.url)),
      '@': fileURLToPath(new URL('./v0/src/components', import.meta.url)),
    },
  },

  // 🔥 THIS IS CORRECT
  base: isDesktop ? '/' : '/simulatorvue/',

  build: {
    outDir: isDesktop ? './dist' : '../public/simulatorvue/v0/',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1600,
  },

  test: {
    globals: true,
    environment: 'jsdom',
    server: {
      deps: {
        inline: ['vuetify'],
      },
    },
    setupFiles: './src/simulator/spec/vitestSetup.ts',
  },

  server: {
    port: 4000,

    // 🔥 PROXY ONLY FOR WEB, NEVER FOR TAURI
    proxy: isDesktop
      ? undefined
      : {
          '^/(?!(simulatorvue)).*': {
            target: proxyUrl,
            changeOrigin: true,
            headers: {
              origin: proxyUrl,
            },
          },
        },
  },
}))
