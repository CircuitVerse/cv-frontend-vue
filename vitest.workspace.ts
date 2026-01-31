import { defineWorkspace, defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'url'

import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { vueI18n } from '@intlify/vite-plugin-vue-i18n'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

const createWorkspaceConfig = (version) =>
    defineConfig({
        plugins: [
            vue(),
            vuetify({ autoImport: true }),
            cssInjectedByJsPlugin(),
            vueI18n({
                include: fileURLToPath(
                    new URL(
                        version === 'src'
                            ? './src/locales/**'
                            : `./${version}/src/locales/**`,
                        import.meta.url
                    )
                ),
            }),
        ],

        resolve: {
            alias: {
                '#': fileURLToPath(
                    new URL(
                        version === 'src' ? './src' : `./${version}/src`,
                        import.meta.url
                    )
                ),
                '@': fileURLToPath(
                    new URL(
                        version === 'src'
                            ? './src/components'
                            : `./${version}/src/components`,
                        import.meta.url
                    )
                ),
            },
        },

        test: {
            name: version,
            globals: true,
            environment: 'jsdom',

            include: [
                version === 'src'
                    ? 'src/**/*.{spec,test}.{js,ts}'
                    : `${version}/src/**/*.{spec,test}.{js,ts}`,
            ],

            exclude:
                version === 'src'
                    ? ['v0/**/*', 'v1/**/*']
                    : ['src/**/*', version === 'v0' ? 'v1/**/*' : 'v0/**/*'],

            setupFiles: [
                version === 'src'
                    ? './src/simulator/spec/vitestSetup.ts'
                    : `./${version}/src/simulator/spec/vitestSetup.ts`,
            ],

            server: {
                deps: {
                    inline: ['vuetify'],
                },
            },
        },
    })

export default defineWorkspace([
    createWorkspaceConfig('src'),
    createWorkspaceConfig('v1'),
])
