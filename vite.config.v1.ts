import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'url'
import vueI18n from '@intlify/vite-plugin-vue-i18n'

import vuetify from 'vite-plugin-vuetify'
import { createHtmlPlugin } from 'vite-plugin-html'

const PROXY_URL = 'http://localhost:3000'
const PORT = 4000
const CHANGE_ORIGIN = true

export default defineConfig({
    plugins: [
        vue(),
        vuetify({ autoImport: true }),
        vueI18n({
            include: fileURLToPath(
                new URL(`./v1/src/locales/**`, import.meta.url)
            ),
        }),
        createHtmlPlugin({
            minify: true,
            inject: {
                data: {
                    injectScript:
                        '<script type="module" src="/v1/src/main.ts"></script>',
                },
            },
        }),
    ],
    resolve: {
        alias: {
            '#': fileURLToPath(new URL(`./v1/src`, import.meta.url)),
            '@': fileURLToPath(new URL(`./v1/src/components`, import.meta.url)),
        },
    },
    base: '/simulatorvue/v1/',
    build: {
        outDir: `../public/simulatorvue/v1/`,
        assetsDir: 'assets',
        chunkSizeWarningLimit: 1600,
        rollupOptions: {
            input: {
                main: fileURLToPath(new URL('index-cv.html', import.meta.url)),
            },
        },
    },
    server: {
        port: PORT,
        proxy: {
            '^/(?!(simulatorvue)).*': {
                target: PROXY_URL,
                changeOrigin: CHANGE_ORIGIN,
                headers: {
                    origin: PROXY_URL,
                },
            },
        },
    },
})
