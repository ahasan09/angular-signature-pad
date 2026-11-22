# @raju_hasan09/ngx-signature-pad — 1.x line (branch release/v1)

Maintenance branch for Angular 13–15 with signature_pad 4.x. The newest line (3.x, Angular 19–22) and the release overview live on `main`.

## Key Notes
- Build with Angular 13.4 (oldest in range) so the partial-compiled package works on all of 13–15. Peer range: Angular 13–15, signature_pad 4.x.
- Node 16 (`.nvmrc`); it also builds on Node 20 locally.
- Publishes under the `angular13-15` dist-tag, never `latest`. `publish.yml` checks that the tag, the version and the 1.x line match.
- Fixes land on `main` first, then get ported here. Keep the template API (selector, inputs, outputs, methods) identical to main.
- Tests use the real signature_pad with dispatched PointerEvents (Karma + Jasmine). Don't mock the library.
- `npm audit --omit=dev` must stay clean (runtime deps are only signature_pad + tslib); the EOL toolchain's dev advisories are expected.
- Angular 13 specifics: no standalone components (the component is declared in `SignaturePadModule`), no field `inject()` (use constructor injection), `polyfills`/test entry is `src/test.ts`.
- `@types/node` is pinned to 12.20.55 via `overrides`: rxjs 7.5 references Node types, and newer versions don't compile on TypeScript 4.6.
- signature_pad 4: `beginStroke`/`endStroke` detail is the raw `MouseEvent | Touch | PointerEvent`; `BasicPoint` and `FromDataUrlOptions` aren't exported.
- `scripts/compat` + `.github/workflows/compat.yml` verify the packed tarball in real apps on every Angular version of this line. Keep the matrix in sync with peerDependencies.
- Publishing uses npm trusted publishing (OIDC, no token). The publish step switches to Node 24 + npm 11 after building on the line's own Node.
