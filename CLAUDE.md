# @ahasan09/ngx-signature-pad — 2.x line (branch release/v2)

Maintenance branch for Angular 16–18 with signature_pad 5.x. The newest line (3.x, Angular 19–22) and the release overview live on `main`.

## Key Notes
- Build with Angular 16.2 (oldest in range) so the partial-compiled package works on all of 16–18. Peer range: Angular 16–18, signature_pad 5.x.
- Node 18 (`.nvmrc`); it also builds on Node 20 locally.
- Publishes under the `angular16-18` dist-tag, never `latest`. `publish.yml` checks that the tag, the version and the 2.x line match.
- Fixes land on `main` first, then get ported here. Keep the template API (selector, inputs, outputs, methods) identical to main.
- Tests use the real signature_pad with dispatched PointerEvents (Karma + Jasmine). Don't mock the library.
- `npm audit --omit=dev` must stay clean (runtime deps are only signature_pad + tslib); the EOL toolchain's dev advisories are expected.
- `scripts/compat` + `.github/workflows/compat.yml` verify the packed tarball in real apps on every Angular version of this line. Keep the matrix in sync with peerDependencies.
