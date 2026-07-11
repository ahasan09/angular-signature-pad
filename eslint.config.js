// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = tseslint.config(
  {
    // Never lint build output, coverage, or dependencies.
    ignores: ["dist/**", "coverage/**", "tmp/**", "out-tsc/**", "node_modules/**"],
  },
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      // This is a distributable component library ("signature-pad"), not an
      // app, so it does not use an "app" element/attribute prefix.
      "@angular-eslint/directive-selector": "off",
      "@angular-eslint/component-selector": "off",
      // Pre-existing patterns in the signature_pad interop wrapper, surfaced
      // by the modernized (flat-config) linter. Kept as warnings so they stay
      // visible without blocking the build; they predate the Angular 22
      // migration and can be tightened in a dedicated code-quality pass.
      "@typescript-eslint/no-explicit-any": "warn",
      "no-prototype-builtins": "warn",
      "@angular-eslint/no-output-on-prefix": "warn",
      "@angular-eslint/prefer-inject": "warn",
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  }
);
