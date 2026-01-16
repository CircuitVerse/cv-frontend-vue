import { defineWorkspace } from 'vitest/config'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineWorkspace([
    {
        extends: './vite.config.ts',
        test: {
            name: 'src',
            environment: 'jsdom',
            globals: true,
            include: ['src/**/*.{spec,test}.{js,ts}'],
            exclude: ['v0/**/*', 'v1/**/*'],
            setupFiles: ['./src/simulator/spec/vitestSetup.ts'],
            server: {
                deps: {
                    inline: ['vuetify'],
                },
            },
        },
        resolve: {
            alias: {
                '#': join(__dirname, 'src'),
                '@': join(__dirname, 'src/components'),
            },
        },
    },
    {
        extends: './vite.config.ts',
        test: {
            name: 'v0',
            environment: 'jsdom',
            globals: true,
            include: ['v0/src/**/*.{spec,test}.{js,ts}'],
            exclude: ['v1/**/*', 'src/**/*'],
            setupFiles: ['./v0/src/simulator/spec/vitestSetup.ts'],
            server: {
                deps: {
                    inline: ['vuetify'],
                },
            },
        },
        resolve: {
            alias: {
                '#': join(__dirname, 'v0/src'),
                '@': join(__dirname, 'v0/src/components'),
            },
        },
    },
    {
        extends: './vite.config.ts',
        test: {
            name: 'v1',
            environment: 'jsdom',
            globals: true,
            include: ['v1/src/**/*.{spec,test}.{js,ts}'],
            exclude: ['v0/**/*', 'src/**/*'],
            setupFiles: ['./v1/src/simulator/spec/vitestSetup.ts'],
            server: {
                deps: {
                    inline: ['vuetify'],
                },
            },
        },
        resolve: {
            alias: {
                '#': join(__dirname, 'v1/src'),
                '@': join(__dirname, 'v1/src/components'),
            },
        },
    },
])
