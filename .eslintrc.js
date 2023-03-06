const tsParser = require('@typescript-eslint/parser')
const espree = require('espree')

module.exports = {
    env: {
        node: true,
        browser: true,
        commonjs: true,
        es6: true,
        jquery: true,
    },
    extends: ['eslint:recommended', 'prettier'],
    parser: 'vue-eslint-parser',
    parserOptions: {
        // Multiple parser
        parser: {
            js: espree,
            ts: tsParser,
        },
    },
    rules: {
        // override/add rules settings here, such as:
        // 'vue/no-unused-vars': 'error'
    },
    // true -> writable global variables
    // false -> readable global variables
    globals: {
        lightMode: true,
        Array: true,
        restrictedElements: true,
        globalScope: true,
        projectId: true,
        id: true,
        loading: true,
        embed: true,
        width: true,
        height: true,
        DPR: true,
    },
}
