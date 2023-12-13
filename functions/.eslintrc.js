module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
  ],
  plugins: [
    "@typescript-eslint",
    "import",
  ],
  rules: {
    "quotes": ["warn", "double"], // Change to warn
    "import/no-unresolved": 0,
    "indent": ["warn", 2], // Change to warn
    "max-len": ["warn", 120], // Change to warn
    "object-curly-spacing": ["warn", "always"], // Change to warn
    "require-jsdoc": 0,
    "no-unused-vars": 0,
    "no-invalid-this": 0,
    "camelcase": 0,
    "new-cap": 0,
    "no-var": 0,
    "prefer-rest-params": 0,
    "prefer-spread": 0,
    "prefer-template": 0,
  },
};
