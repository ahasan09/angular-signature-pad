# Changelog — @raju_hasan09/ngx-signature-pad 1.x (Angular 13–15)

This branch (`release/v1`) maintains the 1.x line for Angular 13–15 with signature_pad 4.x. It publishes to npm under the `angular13-15` dist-tag; the newest line (3.x, Angular 19–22) lives on `main` and is `latest`.

## 1.0.0 - Unreleased

First release of the 1.x line. Replaces `ahasan-angular2-signaturepad` for apps on Angular 13–15.

- Same features, fixes and template API as 3.0.0 (see `main`), adapted to Angular 13 and signature_pad 4:
  - `SignaturePadComponent` is declared in `SignaturePadModule` (Angular 13 has no standalone components). On Angular 14+ the module can go in a standalone component's `imports`.
  - `beginStroke` / `endStroke` emit signature_pad 4's raw `PointerEvent | MouseEvent | Touch`.
  - `Point` is derived from `PointGroup` (signature_pad 4 does not export `BasicPoint`).
- Built with Angular 13.4 (partial compilation); verified in apps on Angular 13, 14 and 15.
- Tests: Karma + Jasmine in headless Chrome against the real signature_pad (coverage gate ≥95% lines).
- The workspace pins `@types/node` 12 (as Angular 13 projects did): rxjs 7.5 references Node types, and newer `@types/node` does not compile on TypeScript 4.6.
