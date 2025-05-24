// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';

// tseslint sets the TypeScript parser and reads the tsconfig.json file,
// so there is no need to set languageOptions.parser and languageOptions.parserOptions.project.
export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  // eslint-plugin-prettier comes with the eslint-plugin-prettier/recommended config that sets up 
  // both eslint-plugin-prettier and eslint-config-prettier in one go.
  eslintPluginPrettier,
  {
    languageOptions: {
      sourceType: 'module',
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
);