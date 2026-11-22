# Changelog

`@raju_hasan09/ngx-signature-pad` replaces `ahasan-angular2-signaturepad` (last release 1.0.0, Angular 12–13, signature_pad 2).
It is published in three release lines, one per Angular range:

| Line | Angular | signature_pad | Branch | npm dist-tag |
| --- | --- | --- | --- | --- |
| 3.x | 19–22 | 5.x | `main` | `latest` |
| 2.x | 16–18 | 5.x | `release/v2` | `angular16-18` |
| 1.x | 13–15 | 4.x | `release/v1` | `angular13-15` |

## 3.0.0 - Unreleased

First release of `@raju_hasan09/ngx-signature-pad` 3.x (Angular 19–22).

### Fixed (compared with `ahasan-angular2-signaturepad`)
- `onBeginEvent` / `onEndEvent` fire again. signature_pad 4+ removed the `onBegin`/`onEnd` callbacks the old wrapper relied on.
- `resizeCanvas()` and `set('canvasWidth' | 'canvasHeight')` no longer throw. They used signature_pad's removed private `_canvas` field.
- The canvas size from `[options]` is no longer reset to 300×150 by the template's `width`/`height` attribute bindings.
- Destroying the component unbinds signature_pad's document-level listeners (memory leak).
- `PointGroup`, `fromData()`, `fromDataURL()` and `toDataURL()` types match signature_pad 5.
- Production builds use partial compilation, which npm publishing requires.

### Added
- `beginStroke` / `endStroke` outputs carrying signature_pad's `SignatureStrokeEvent` (original event, position, pressure).
- `toSVG()`; `toDataURL('image/svg+xml', options)`; `fromData(groups, { clear })`.
- Inputs `dotSize`, `minDistance` and `backgroundColor`. A new `[options]` object and canvas-size inputs apply to the live pad, and the drawing is kept.
- `resizeCanvas()` keeps the existing signature.
- `SignaturePadModule` for NgModule-based apps, alongside the standalone component.
- SSR support: the pad is only created in the browser.
- Drawing runs outside the Angular zone (no change detection per pointer move); works in zoneless apps.
- Demo app (`npm start`).
- Tests run in Vitest browser mode against the real signature_pad with pointer events, under both zoneless and zone.js change detection (coverage gate ≥95% lines).

### Changed
- Peer dependencies: Angular `^19 || ^20 || ^21 || ^22`, signature_pad `^5.0.0`.
- Inputs are signal inputs (`input()`), and outputs use `output()`. Template usage is unchanged.
- `onBeginEvent` / `onEndEvent` are deprecated in favour of `beginStroke` / `endStroke`.
- `fromDataURL()` returns `Promise<void>`.
- `PointGroup` is signature_pad 5's `{ points, ...penOptions }`; `SignaturePadConfig` extends signature_pad's `Options` and no longer accepts arbitrary keys.
- `queryPad()` returns `SignaturePad | null` (typed) instead of `any`.
- Component uses `ChangeDetectionStrategy.OnPush` explicitly.
- Workspace on Angular 22.3, TypeScript 6, `@angular/build`, ESLint flat config; `npm audit` reports 0 vulnerabilities.
- CI runs on `main` with Node 22 (audit, lint, tests, library and demo builds, package check). Publishing verifies tag, version and release line, and adds npm provenance.

## 2.0.0 - Unreleased (branch `release/v2`)

First release of the 2.x line for Angular 16–18 with signature_pad 5. Same features and template API as 3.0.0, using `@Input` / `@Output` decorators. See the `release/v2` branch's CHANGELOG.

## 1.0.0 - Unreleased (branch `release/v1`)

First release of the 1.x line for Angular 13–15 with signature_pad 4. NgModule-based (`SignaturePadModule`); `beginStroke` / `endStroke` emit signature_pad 4's raw `PointerEvent | MouseEvent | Touch`. See the `release/v1` branch's CHANGELOG.
