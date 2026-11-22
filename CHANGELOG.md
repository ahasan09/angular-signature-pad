# Changelog — @raju_hasan09/ngx-signature-pad 2.x (Angular 16–18)

This branch (`release/v2`) maintains the 2.x line for Angular 16–18 with signature_pad 5.x. It publishes to npm under the `angular16-18` dist-tag; the newest line (3.x, Angular 19–22) lives on `main` and is `latest`.

## 2.0.0 - Unreleased

First release of the 2.x line. Replaces `ahasan-angular2-signaturepad` for apps on Angular 16–18.

- Same features, fixes and template API as 3.0.0 (see `main`), using `@Input()` / `@Output()` decorators instead of signal inputs/outputs.
- Standalone `SignaturePadComponent` plus `SignaturePadModule`.
- `beginStroke` / `endStroke` emit signature_pad 5's `SignatureStrokeEvent` (`{ event, type, x, y, pressure }`).
- Built with Angular 16.2 (partial compilation); verified in apps on Angular 16, 17 and 18.
- Tests: Karma + Jasmine in headless Chrome against the real signature_pad (coverage gate ≥95% lines).
