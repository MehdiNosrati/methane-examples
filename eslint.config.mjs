import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import {
  methaneEslintPlugin,
  recommendedEslintRules,
} from '@methane-ui/lint-plugin/eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '.agents/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      '@methane-ui': methaneEslintPlugin,
    },
    rules: {
      ...recommendedEslintRules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['tests/**/*.ts', 'e2e/**/*.ts'],
    rules: {
      '@methane-ui/no-raw-html': 'off',
    },
  },
);
