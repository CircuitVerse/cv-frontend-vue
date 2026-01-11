/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'url'
import vueI18n from '@intlify/vite-plugin-vue-i18n'

// https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
import vuetify from 'vite-plugin-vuetify'
import { createHtmlPlugin } from 'vite-plugin-html'


// https://vitejs.dev/config/
export default defineConfig(() => {
    const version = process.env.VITE_SIM_VERSION || 'v0'
    const isDesktop = !!process.env.DESKTOP_MODE

    return {
        plugins: [
            vue(),
            vuetify({ autoImport: true }),
            vueI18n({
                // if you want to use Vue I18n Legacy API, you need to set `compositionOnly: false`
                // compositionOnly: false,

                // you need to set i18n resource including paths !
                include: fileURLToPath(
                    new URL(`./${version}/src/locales/**`, import.meta.url)
                ),
            }),
        ],
        resolve: {
            alias: {
                '#': fileURLToPath(new URL(`./${version}/src`, import.meta.url)),
                '@': fileURLToPath(
                    new URL(`./${version}/src/components`, import.meta.url)
                ),
            },
        },
        base: isDesktop ? '/' : `/simulatorvue/${version}/`,
        build: {
            outDir: `./dist/simulatorvue/${version}/`,
            assetsDir: 'assets',
            chunkSizeWarningLimit: 1600,
            rollupOptions: {
                input: {
                    [version]: fileURLToPath(
                        new URL(`./${version}/index.html`, import.meta.url)
                    ),
                },
                output: {
                    entryFileNames: `simulator-[name].js`,
                    chunkFileNames: `assets/[name]-[hash].js`,
                    assetFileNames: `assets/[name]-[hash].[ext]`,
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