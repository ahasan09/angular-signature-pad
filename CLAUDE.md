# @raju_hasan09/ngx-signature-pad — 2.x (branch `release/v2`)

Maintenance line for Angular 16–18 with signature_pad 5.x. The newest line, the release overview and the full release checklist live on `main`.

## Commands
```bash
npm ci           # Node 18 (.nvmrc); Node 20 also works locally
npm test         # Karma + Jasmine in headless Chrome, coverage gate
npm run build    # partial-Ivy build with Angular 16.2 -> dist/ngx-signature-pad
npm run audit    # runtime deps only (signature_pad, tslib)
```

## Conventions
- Built with Angular 16.2 (oldest in range); peer range Angular 16–18, signature_pad 5.x.
- Template API (selector, inputs, outputs, methods) matches `main`; fixes are ported from `main`.
- Uses `@Input()`/`@Output()` decorators (signal inputs are stable only from Angular 19); standalone component plus `SignaturePadModule`.
- `npm audit --omit=dev` stays clean; the end-of-life Angular 16 toolchain has known dev-only advisories.
- Tests drive the real signature_pad with dispatched PointerEvents; never mock it.
- `compat.yml` builds real apps on Angular 16, 17 and 18; keep it in sync with peerDependencies.

## Releasing
- Bump `projects/ngx-signature-pad/package.json` and root `package.json` (+ `npm install --package-lock-only`), add a CHANGELOG entry, squash-merge the PR into `release/v2`, then push tag `v2.Y.Z` on `release/v2`.
- `publish.yml` publishes under the `angular16-18` dist-tag with npm trusted publishing (publish step on Node 24 + npm 11).
