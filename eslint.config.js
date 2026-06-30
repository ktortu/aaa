// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const playwright = require('eslint-plugin-playwright');
// Désactive les règles ESLint qui pourraient entrer en conflit avec Prettier (le formatage est
// la responsabilité de Prettier seul). DOIT rester en DERNIER pour écraser les règles précédentes.
const eslintConfigPrettier = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'kt',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'kt',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      '@angular-eslint/template/elements-content': [
        'error',
        {
          allowList: [
            'aria-label',
            'ariaLabel',
            'innerHtml',
            'innerHTML',
            'innerText',
            'outerHTML',
            'textContent',
            'title',
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.spec.ts/*.html'],
    rules: {
      '@typescript-eslint/no-empty-function': 'off',
      '@angular-eslint/template/elements-content': 'off',
      '@angular-eslint/template/role-has-required-aria': 'off',
    },
  },
  // Tests e2e Playwright : règles anti-flake / anti-pièges (await manquant, attentes fixes, etc.).
  {
    ...playwright.configs['flat/recommended'],
    files: ['e2e/**/*.ts'],
  },
  {
    files: ['e2e/**/*.ts'],
    rules: {
      // Interdit les barrières temporelles fixes (waitForTimeout) : source #1 de flakiness sous CI
      // chargée. Synchroniser sur un signal réel (locator web-first, getAnimations().finished, etc.).
      'playwright/no-wait-for-timeout': 'error',
    },
  },
  // En DERNIER : neutralise les règles de formatage au profit de Prettier.
  eslintConfigPrettier,
]);
