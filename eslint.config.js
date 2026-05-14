// Minimal lint baseline: JS recommended rules + React hooks rules. Unused
// vars are warnings, not errors, so this never blocks a build — it's here to
// catch the next class of bugs (bad hook deps, dead imports), not to enforce
// a fully clean tree today.

import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

export default [
  {
    ignores: [
      'dist',
      'node_modules',
      'scripts/archive',
      'src/data/saunas-prebuilt.json',
    ],
  },
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...js.configs.recommended.rules,
      // Classic react-hooks rules, kept as warnings so the baseline never
      // blocks a build. The plugin's newer v6 advisory rules are left off
      // for now — revisit when doing the B2 UI cleanup.
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'no-unused-vars': 'warn',
    },
  },
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      // node globals + browser globals: prerender/scrape scripts run
      // Puppeteer, whose page-context callbacks reference window/document.
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': 'warn',
      'no-useless-escape': 'warn',
    },
  },
]
