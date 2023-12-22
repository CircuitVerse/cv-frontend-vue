module.exports = {
  env: {
    node: true,
    browser: true,
    commonjs: true,
    es6: true,
    jquery: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/vue3-recommended',
    'google',
  ],
  rules: {
    'curly': [2, 'all'],
    'semi': [1, 'always'],
  },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  // true -> writable global variables
  // false -> readable global variables
  globals: {
    lightMode: true,
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
};
