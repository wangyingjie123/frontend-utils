import { fileURLToPath } from 'url';
import path from 'path';
import parser from '@typescript-eslint/parser'; // Import the TypeScript parser
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import prettierPlugin from 'eslint-plugin-prettier';
import airbnbBaseConfig from 'eslint-config-airbnb-base';
import prettierConfig from 'eslint-config-prettier';

// Resolve __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = [
  {
    files: ['**/*.{jsx,ts,tsx}'],
    ignores: ['dist/**', 'node_modules', 'coverage', '!.*rc.cjs', 'index.html'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      parser: parser,
      parserOptions: {
        project: [path.resolve(__dirname, 'tsconfig.json')],
      },
      globals: {
        browser: true,
        es6: true,
        node: true,
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      'max-len': [
        'error',
        {
          code: 120,
          tabWidth: 2,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreRegExpLiterals: true,
          ignoreTemplateLiterals: true,
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.mjs', '.jsx', '.ts', '.tsx'],
        },
      },
    },
    // ...airbnbBaseConfig,
    // ...typescriptPlugin.configs.recommended,
    // ...prettierConfig,
  },
];

export default config;
