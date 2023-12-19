module.exports = {
  root: true,
  env: { browser: false, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    // Existing rule
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    // Added overrides
    'react-hooks/exhaustive-deps': 'off', // Disable react-hooks/exhaustive-deps rule
    '@typescript-eslint/no-unused-vars': 'off', // Disable @typescript-eslint/no-unused-vars rule
    'no-unused-vars': 'off', // Disable no-unused-vars rule
    'no-undef': 'off', // Disable no-undef rule
    '@typescript-eslint/no-empty-function': 'off', // Disable @typescript-eslint/no-empty-function rule
    '@typescript-eslint/no-explicit-any': 'off', // Disable @typescript-eslint/no-explicit-any rule
  },
}

