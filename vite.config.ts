import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'url';

// https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
import vuetify from 'vite-plugin-vuetify';

const proxyUrl: string = 'http://localhost:3000';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
  ],
  resolve: {
    alias: {
      '#': fileURLToPath(new URL('./src', import.meta.url)),
      '@': fileURLToPath(new URL('./src/components', import.meta.url)),
    },
  },
  base: '/simulatorvue/',
  build: {
    outDir: '../public/simulatorvue',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1600,
  },
  server: {
    port: 4000,
    proxy: {
      // ...(process.env.NODE_ENV === 'development' && {
      '^/(?!(simulatorvue)).*': {
        target: proxyUrl,
        changeOrigin: true,
        headers: {
          origin: proxyUrl,
        },
      },
      // }),
    },
  },
});
