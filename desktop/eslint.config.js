import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import nodePlugin from 'eslint-plugin-node';
import securityPlugin from 'eslint-plugin-security';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  {
    ignores: ['dist/**/*', 'build/**/*', 'node_modules/**/*', '**/*.d.ts', '**/*.js', '**/*.mjs', '**/*.cjs'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.eslint.json',
        sourceType: 'module',
        ecmaVersion: 2022,
      },
    },
    plugins: {
      import: importPlugin,
      node: nodePlugin,
      security: securityPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      'consistent-return': 'warn',
      'no-promise-executor-return': 'error',

      // TypeScript rules
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',

      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',

      // Plugins node
      'node/no-unsupported-features/es-syntax': 'off',

      // Plugins security
      'security/detect-object-injection': 'off',

      // Prettier
      'prettier/prettier': 'warn',
    },
  },
];
