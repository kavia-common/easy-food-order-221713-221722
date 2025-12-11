import js from '@eslint/js'
import ts from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'

/**
 * ESLint Flat Config compatible with ESLint 9.
 * Avoids spread pitfalls by composing a single flat array.
 * Applies:
 *  - JS recommended
 *  - Vue essential (flat)
 *  - TS recommended
 * And then project rules.
 */
export default [
  // Base JS config
  {
    ...js.configs.recommended,
  },
  // Vue essential rules
  {
    ...pluginVue.configs['flat/essential'],
  },
  // TS recommended rules
  ...ts.configs.recommended,

  // Project-specific overrides
  {
    name: 'app/config',
    files: ['**/*.{ts,mts,tsx,vue}'],
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
]
