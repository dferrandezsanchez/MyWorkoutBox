import js from '@eslint/js';
import globals from 'globals';
import sonarjs from 'eslint-plugin-sonarjs';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      'eslint.config.mjs',
      'prisma/migrations/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  sonarjs.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'sonarjs/cognitive-complexity': ['error', 20],
      'sonarjs/different-types-comparison': 'off',
      'sonarjs/no-hardcoded-passwords': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/no-nested-functions': 'off',
      'sonarjs/no-undefined-argument': 'off',
      'sonarjs/reduce-initial-value': 'off',
      'sonarjs/todo-tag': 'off',
    },
  },
  {
    files: ['**/*.test.ts', 'prisma/**/*.ts'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      'sonarjs/cognitive-complexity': 'off',
      'sonarjs/assertions-in-tests': 'off',
      'sonarjs/no-hardcoded-credentials': 'off',
      'sonarjs/no-identical-functions': 'off',
      'sonarjs/pseudo-random': 'off',
    },
  },
);
