/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'url'
import vueI18n from '@intlify/vite-plugin-vue-i18n'

// Vuetify
import vuetify from 'vite-plugin-vuetify'

// https://vitejs.dev/config/
export default defineConfig(() => {
  const isDesktop = !!process.env.DESKTOP_MODE

  return {
    plugins: [
      vue(),
      vuetify({ autoImport: true }),
      vueI18n({
        // Vue I18n resources (REAL path)
        include: fileURLToPath(
          new URL('./src/locales/**', import.meta.url)
        ),
      }),
    ],

    resolve: {
      alias: {
        '#': fileURLToPath(new URL('./src', import.meta.url)),
        '@': fileURLToPath(new URL('./src/components', import.meta.url)),
      },
    },

    // Desktop uses root, web uses simulator path
    base: isDesktop ? '/' : '/simulatorvue/',

    build: {
      outDir: './dist',
      assetsDir: 'assets',
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        input: {
          main: fileURLToPath(
            new URL('./index.html', import.meta.url)
          ),
        },
        output: {
          entryFileNames: 'simulator-[name].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
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
    },

    preview: {
      port: 4173,
    },
  }
})
