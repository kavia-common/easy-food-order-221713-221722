import pluginVue from 'eslint-plugin-vue'

/**
 * ESLint Flat Config compatible with ESLint 9.
 * Uses only installed dependencies to avoid resolution errors in CI.
 */
export default [
  {
    name: 'app/config',
    files: ['**/*.{ts,mts,tsx,vue}'],
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
    ...pluginVue.configs['flat/essential'],
  },
]
