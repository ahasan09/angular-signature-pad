# @raju_hasan09/ngx-signature-pad — 1.x (branch `release/v1`)

Maintenance line for Angular 13–15 with signature_pad 4.x. The newest line, the release overview and the full release checklist live on `main`.

## Commands
```bash
npm ci           # Node 16 (.nvmrc); Node 20 also works locally
npm test         # Karma + Jasmine in headless Chrome, coverage gate
npm run build    # partial-Ivy build with Angular 13.4 -> dist/ngx-signature-pad
npm run audit    # runtime deps only (signature_pad, tslib)
```

## Conventions
- Built with Angular 13.4 (oldest in range); peer range Angular 13–15, signature_pad 4.x.
- Template API (selector, inputs, outputs, methods) matches `main`; fixes are ported from `main`.
- Angular 13: no standalone components (the component is declared in `SignaturePadModule`), constructor injection instead of `inject()`, test entry `src/test.ts`.
- signature_pad 4: `beginStroke`/`endStroke` emit the raw `MouseEvent | Touch | PointerEvent`; `BasicPoint` and `FromDataUrlOptions` aren't exported.
- `@types/node` is pinned to 12.20.55 via `overrides` (rxjs 7.5 references Node types; newer typings need TypeScript 5).
- `npm audit --omit=dev` stays clean; the end-of-life Angular 13 toolchain has known dev-only advisories.
- Tests drive the real signature_pad with dispatched PointerEvents; never mock it.
- `compat.yml` builds real apps on Angular 13, 14 and 15; keep it in sync with peerDependencies.

## Releasing
- Bump `projects/ngx-signature-pad/package.json` and root `package.json` (+ `npm install --package-lock-only`), add a CHANGELOG entry, squash-merge the PR into `release/v1`, then push tag `v1.Y.Z` on `release/v1`.
- `publish.yml` publishes under the `angular13-15` dist-tag with npm trusted publishing (publish step on Node 24 + npm 11).
