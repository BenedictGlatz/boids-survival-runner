import js from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

// Exported functions/classes, and non-underscore ("public") methods of an
// exported class. Plain exported constants (gameConfig.js) and underscore-
// prefixed private methods (playerController.js's _startDash) are
// intentionally out of scope, matching the project's existing private-member
// convention. Shared by every jsdoc content rule below, not just
// require-jsdoc — otherwise the completeness rules (require-param,
// require-returns, ...) validate ANY function that already happens to carry a
// one-line prose comment, private or not, which is not what should be
// machine-checked here.
const JSDOC_REQUIRED_CONTEXTS = [
  'ExportNamedDeclaration > FunctionDeclaration',
  'ExportDefaultDeclaration > FunctionDeclaration',
  'ExportNamedDeclaration > ClassDeclaration',
  'ExportDefaultDeclaration > ClassDeclaration',
  'ExportNamedDeclaration ClassDeclaration MethodDefinition[kind!="constructor"][key.name!=/^_/]',
  'ExportDefaultDeclaration ClassDeclaration MethodDefinition[kind!="constructor"][key.name!=/^_/]',
];

// Flat config (mandatory for ESLint 9+, and a natural fit since package.json
// already declares "type": "module"). See documentation/report/07-tooling.md
// §7.3 for the reasoning behind every non-obvious choice below.
export default [
  {
    ignores: [
      'src/wasm/**',
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },

  js.configs.recommended,
  jsdoc.configs['flat/recommended'],

  // Non-test source runs in the browser (canvas, keyboard, requestAnimationFrame).
  {
    files: ['src/**/*.js'],
    ignores: ['**/*.test.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    plugins: { jsdoc },
    rules: {
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

      'jsdoc/require-jsdoc': [
        'error',
        {
          require: {
            FunctionDeclaration: false,
            MethodDefinition: false,
            ClassDeclaration: false,
            ArrowFunctionExpression: false,
            FunctionExpression: false,
          },
          contexts: JSDOC_REQUIRED_CONTEXTS,
        },
      ],
      'jsdoc/require-param': ['warn', { contexts: JSDOC_REQUIRED_CONTEXTS }],
      'jsdoc/require-param-description': ['warn', { contexts: JSDOC_REQUIRED_CONTEXTS }],
      'jsdoc/require-param-type': ['warn', { contexts: JSDOC_REQUIRED_CONTEXTS }],
      'jsdoc/require-returns': ['warn', { contexts: JSDOC_REQUIRED_CONTEXTS }],
      'jsdoc/require-returns-description': ['warn', { contexts: JSDOC_REQUIRED_CONTEXTS }],
      'jsdoc/require-returns-type': ['warn', { contexts: JSDOC_REQUIRED_CONTEXTS }],
    },
  },

  // Test files: Vitest globals are imported explicitly, so no extra
  // environment is needed, and JSDoc — presence or content — is never
  // required on test helpers.
  {
    files: ['src/**/*.test.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
    rules: {
      'jsdoc/require-jsdoc': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/require-param-description': 'off',
      'jsdoc/require-param-type': 'off',
      'jsdoc/require-returns': 'off',
      'jsdoc/require-returns-description': 'off',
      'jsdoc/require-returns-type': 'off',
    },
  },

  // End-to-end tests. Same JSDoc exemption as the unit tests, but they also run in
  // Node rather than the browser: the spec drives Playwright from the outside, and
  // only code inside page.evaluate() reaches the page's own globals.
  //
  // The glob covers `e2e/**/*.js`, not only `*.spec.js`, so the shared helpers in
  // e2e/support/ are exempt too. Restricting it to spec files repeats the T-01
  // mistake exactly: the content rules would then reach helpers that already carry
  // one-line prose JSDoc and demand empty @param tags on them.
  {
    files: ['e2e/**/*.js', 'playwright.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      'jsdoc/require-jsdoc': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/require-param-description': 'off',
      'jsdoc/require-param-type': 'off',
      'jsdoc/require-returns': 'off',
      'jsdoc/require-returns-description': 'off',
      'jsdoc/require-returns-type': 'off',
    },
  },

  // Must stay last: turns off every stylistic rule that would conflict with
  // Prettier, so formatting is owned by the formatter, semantics by the linter.
  prettierConfig,
];
