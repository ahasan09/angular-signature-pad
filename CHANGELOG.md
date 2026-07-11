# Changelog

## 3.0.0 - 2026-07-11
- Upgrade to Angular 22 (from 19); TypeScript 6, zone.js 0.16
- signature_pad 5.1.3; ng-packagr 22
- Widen library peerDependencies to Angular >=19
- Migrate to ESLint flat config (eslint 10, angular-eslint 22, typescript-eslint 8)


## 2.0.0 - 2026-04-28

### Added
- Standalone Angular component API and typed signature configuration export.
- Accessibility attributes for the canvas (`role="img"`, configurable `aria-label`).
- Expanded unit tests for `clear`, `isEmpty`, `fromDataURL`, `toDataURL`, and input bindings.
- ESLint configuration using Angular ESLint rules.
- GitHub Actions CI for build/test/lint and npm publish on version tags.

### Changed
- Upgraded Angular toolchain to v19.
- Upgraded `signature_pad` to v5.
- Enabled strict TypeScript and Angular template checks.
- Updated package versions and README usage examples.

### Removed
- NgModule export from the public API in favor of standalone component usage.
