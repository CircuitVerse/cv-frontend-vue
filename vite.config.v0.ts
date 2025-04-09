import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'url'
import vueI18n from '@intlify/vite-plugin-vue-i18n'

// https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
import vuetify from 'vite-plugin-vuetify'
import { createHtmlPlugin } from 'vite-plugin-html'

const proxyUrl: string = 'http://localhost:3000'


// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        vuetify({ autoImport: true }),
        vueI18n({
            // if you want to use Vue I18n Legacy API, you need to set `compositionOnly: false`
            // compositionOnly: false,

            // you need to set i18n resource including paths !
            include: fileURLToPath(
                new URL(`./v0/src/locales/**`, import.meta.url)
            ),
        }),
        createHtmlPlugin({
            minify: true,
            inject: {
              data: {
                injectScript: '<script type="module" src="/v0/src/main.ts"></script>',
              },
            },
          }),
    ],
    resolve: {
        alias: {
            '#': fileURLToPath(new URL(`./v0/src`, import.meta.url)),
            '@': fileURLToPath(new URL(`./v0/src/components`, import.meta.url)),
        },
    },
    base: process.env.DESKTOP_MODE ? '/' : '/simulatorvue/v0/',
    build: {
        outDir: process.env.DESKTOP_MODE ? './dist' : '../public/simulatorvue/v1/',
        assetsDir: 'assets',
        chunkSizeWarningLimit: 1600,
        rollupOptions: {
            input: {
                main: fileURLToPath(new URL('index-cv.html', import.meta.url))
            }
        }

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
})
