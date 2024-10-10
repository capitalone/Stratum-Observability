module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json']
  },
  plugins: ['simple-import-sort', '@typescript-eslint'],
  env: {
    jest: true
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  globals: {
    customElements: true
  },
  rules: {
    // Enforce consistent brace style for all control statements.
    curly: ['error', 'all'],
    // Require `default` cases in `switch` statements.
    'default-case': 'error',
    // Require the use of `===` and `!==`.
    eqeqeq: ['error', 'smart'],
    // Disallow duplicate module imports.
    'no-duplicate-imports': 'warn',
    // Disallow empty functions.
    'no-empty-function': 'error',
    // Disallow template literal placeholder syntax in regular strings.
    'no-template-curly-in-string': 'warn',
    // Disallow loops with a body that allows only one iteration.
    'no-unreachable-loop': 'error',
    // Enforce sorted import declarations within modules.
    'simple-import-sort/imports': 'error'
  }
};
