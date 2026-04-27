# Improvement Plan: ahasan-angular2-signaturepad

## Overview
Angular 13 library wrapping signature_pad 2.x. Listed as no longer actively maintained upstream. Angular 13 is several major versions behind current (19+). Low test coverage.

## Improvements

### Modernization (High Priority)
- Upgrade from Angular 13 to Angular 19+: adopt standalone component API (remove `NgModule`), use the new library build targets
- Upgrade `signature_pad` from v2.x to the latest v5.x — v2 is very old and has known issues
- Update `ng-packagr` to the version compatible with Angular 19

### Testing
- Add unit tests for the `SignaturePadComponent`: test `clear()`, `isEmpty()`, `fromDataURL()`, and `toDataURL()` methods
- Add tests for input bindings (`options`, `minWidth`, `maxWidth`, etc.)
- Target ≥80% statement coverage

### API & Documentation
- Export proper TypeScript types for signature pad options so consumers get type safety
- Add a live Stackblitz demo link to the README
- Add JSDoc comments to all public component inputs/outputs

### Code Quality
- Enable TypeScript `strict` mode in the library project
- Add ESLint with Angular rules

### Accessibility
- Add `role="img"` and `aria-label` to the canvas element
- Document keyboard alternatives (the library is inherently pointer-based but should note the accessibility limitation)

### Publishing
- Update the npm package version to reflect the Angular 19 upgrade
- Add a CHANGELOG.md
- Add GitHub Actions CI to publish to npm automatically on version tag push
