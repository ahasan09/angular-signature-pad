# @raju_hasan09/ngx-signature-pad

Angular component wrapping [szimek/signature_pad](https://github.com/szimek/signature_pad) for canvas signature capture. This branch (`main`) is the 3.x line.

## Release lines
| Line | Angular | signature_pad | Branch | npm dist-tag | Build toolchain |
| --- | --- | --- | --- | --- | --- |
| 3.x | 19–22 | 5.x | `main` | `latest` | Angular 22, Node 22, Vitest |
| 2.x | 16–18 | 5.x | `release/v2` | `angular16-18` | Angular 16, Node 18, Karma |
| 1.x | 13–15 | 4.x | `release/v1` | `angular13-15` | Angular 13, Node 16, Karma |

- Each line builds with the oldest Angular in its range, so the partial-compiled package works on every version in it.
- Fixes land on `main` first, then get ported. The template API (selector, inputs, outputs, methods) is identical across lines.
- Only 3.x is `latest`; older lines publish under their own dist-tag.

## Structure
```
projects/ngx-signature-pad/   # published library
  src/lib/signature-pad.component.ts   # SignaturePadComponent (alias SignaturePad) + SignaturePadModule
  package.json                         # published name/version
  README.md                            # npm README
projects/demo/                # demo app; imports the library source via tsconfig paths
scripts/compat/               # builds a real app on a given Angular version and draws on it
.github/workflows/            # ci, compat (Angular version matrix), publish (tags), demo (GitHub Pages)
```

## Commands
```bash
npm ci && npx playwright install chromium
npm start           # demo at http://localhost:4200
npm test            # Vitest browser mode in Chromium; coverage thresholds in angular.json
npm run lint
npm run build       # partial-Ivy build -> dist/ngx-signature-pad
npm run build:demo
npm run audit
```
- Angular 22's CLI needs Node ^22.22.3, ^24.15 or ≥26.
- Compat check for one version: `npm pack ./dist/ngx-signature-pad --pack-destination <dir>` (the dir must exist), then `bash scripts/compat/make-app.sh <ng> "<ts>" <app-dir> <tgz> "<signature_pad>" <signals|standalone|standalone-module|module> <zone|zoneless>` and `node scripts/compat/check-app.cjs <app-dir>/dist`.

## Conventions
- Library code uses only APIs stable in Angular 19: signal `input()`/`output()`/`viewChild()`/`computed()`, explicit `ChangeDetectionStrategy.OnPush`.
- signature_pad is an EventTarget: listen to `beginStroke`/`endStroke`; its canvas is private, so use the component's `canvasRef`. Event `x`/`y` are viewport (`clientX`/`clientY`) coordinates.
- Tests drive the real signature_pad with dispatched PointerEvents; never mock it. Test hosts use signals (Angular 22 defaults to OnPush and zoneless); one block covers zone.js via `provideZoneChangeDetection()`.
- Keep each branch's compat matrix in sync with its peerDependencies.

## Releasing
1. Bump `version` in `projects/ngx-signature-pad/package.json` and root `package.json`, run `npm install --package-lock-only`, add a CHANGELOG entry; squash-merge the PR.
2. Tag `vX.Y.Z` on the line's branch and push the tag. `publish.yml` checks tag = version = line, then publishes with npm trusted publishing (OIDC; publish step on Node 24 + npm 11).
3. Verify: `npm view @raju_hasan09/ngx-signature-pad@X.Y.Z _npmUser` shows `GitHub Actions`.

- npm account `raju_hasan09`; the trusted publisher is repo `ahasan09/angular-signature-pad`, workflow `publish.yml`. Publishing access disallows tokens.
- Publish with `npm publish ./dist/ngx-signature-pad`: the `./` keeps npm from reading the path as a GitHub shorthand.
- Version `0.0.0-stage` on npm is npm's staged-publishing placeholder.
- `demo.yml` deploys the demo to https://ahasan09.github.io/angular-signature-pad/ on every push to `main`.
- PRs are squash-merged and head branches are auto-deleted. Pull local `release/vN` before porting.
