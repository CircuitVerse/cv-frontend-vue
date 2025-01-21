import { includeIgnoreFile } from '@eslint/compat'
import {
    configureVueProject,
    defineConfigWithVueTs,
    vueTsConfigs,
} from '@vue/eslint-config-typescript'
import eslintConfigPrettier from 'eslint-config-prettier'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

configureVueProject({
    scriptLangs: ['ts'],
    // TODO: May have to change this to only include src
    rootDir: __dirname,
})

const gitignorePath = path.resolve(__dirname, '.gitignore')

export default [
    includeIgnoreFile(gitignorePath),
    {
        ignores: ['**/vendor'],
    },
    ...defineConfigWithVueTs(
        pluginVue.configs['flat/essential'],
        vueTsConfigs.recommendedTypeChecked
    ),
    {
        linterOptions: {
            reportUnusedDisableDirectives: true,
        },
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.es2020,
                ...globals.node,
                ...globals.commonjs,
                ...globals.jquery,
                lightMode: 'writable',
                Array: 'writable',
                restrictedElements: 'writable',
                globalScope: 'writable',
                projectId: 'writable',
                id: 'writable',
                loading: 'writable',
                embed: 'writable',
                width: 'writable',
                height: 'writable',
                DPR: 'writable',
            },
        },
    },
    // Override any rules conflicting with Prettier
    eslintConfigPrettier,
]
