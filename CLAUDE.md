# @raju_hasan09/ngx-signature-pad

Angular library workspace that wraps szimek/signature_pad as an Angular component for canvas-based signature capture. This branch (`main`) is the 3.x line.

## Release lines
| Line | Angular | signature_pad | Branch | dist-tag |
| --- | --- | --- | --- | --- |
| 3.x | 19–22 | 5.x | `main` | `latest` |
| 2.x | 16–18 | 5.x | `release/v2` | `angular16-18` |
| 1.x | 13–15 | 4.x | `release/v1` | `angular13-15` |

Each line is built with the oldest Angular in its range. Fixes land on `main` first, then get ported; keep the template API (selector, inputs, outputs, methods) identical across lines.

## Tech Stack (3.x)
- Angular 22 / TypeScript 6 workspace; library peerDependencies Angular ^19–^22
- signature_pad 5.x (peer dependency)
- ng-packagr via `@angular/build:ng-packagr`
- Vitest browser mode (Playwright Chromium) via `@angular/build:unit-test`

## Project Structure
```
projects/ngx-signature-pad/   # the published library
  src/lib/signature-pad.component.ts   # SignaturePadComponent (alias SignaturePad) + SignaturePadModule
  src/lib/signature-pad.component.spec.ts
  src/public-api.ts
  package.json        # published package metadata/version (source of truth for releases)
  README.md           # published to npm
projects/demo/        # demo app (`npm start`), compiles the library from source via tsconfig paths
angular.json
package.json          # private workspace (dev tooling only)
```

## Development
```bash
npm ci
npx playwright install chromium
npm start       # demo app
npm test        # Vitest + Chromium; coverage thresholds in angular.json
npm run lint
npm run build   # production/partial build -> dist/ngx-signature-pad
npm run audit
```

## Key Notes
- Published as `@raju_hasan09/ngx-signature-pad`; it replaces `ahasan-angular2-signaturepad` (1.0.0, Angular 12–13). Publish from the npm account `raju_hasan09`; the old package belongs to the npm account `ahasan09`, which the owner can no longer access, so it is not deprecated. Not `angular2-signaturepad`, which is a different author's package.
- Releases: bump the library package.json version on the line's branch, then push a `vX.Y.Z` tag. Each branch's `publish.yml` checks tag = version and the major = that branch's line, and publishes under its dist-tag. Only 3.x may be `latest`. Publishing uses npm trusted publishing (OIDC, no token): the publish step runs on Node 24 + npm 11 even on old lines; the npm trusted publisher is configured for workflow `publish.yml`.
- Supporting Angular 19–22 means using only APIs stable in 19 in the library (input/output/viewChild/computed are fine).
- signature_pad 5 is an EventTarget: use `addEventListener('beginStroke' | 'endStroke')`, not `onBegin`/`onEnd`. Its canvas is private; use the component's own `canvasRef`.
- signature_pad 5 types need TypeScript ≥5.0 (Angular 16+); that's why 1.x uses signature_pad 4.
- Angular 22 defaults to OnPush and zoneless. The component uses signal inputs and `output()`, and sets OnPush explicitly. Test hosts use signals; one test block uses `provideZoneChangeDetection()` to cover zone.js apps.
- signature_pad `SignatureEvent.x/y` are `clientX/clientY` (viewport), not canvas coordinates.
- Tests use the real signature_pad with dispatched PointerEvents. Don't mock the library; mocks hid the v5 API breakage before.
- `scripts/compat` + `.github/workflows/compat.yml` verify the packed tarball in real apps on every Angular version of the line (strict build + drawing in Chromium). Keep each branch's matrix in sync with its peerDependencies.
