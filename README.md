# Angular Signature Pad — 2.x (Angular 16–18)

This is the `release/v2` branch of [`@ahasan09/ngx-signature-pad`](https://www.npmjs.com/package/@ahasan09/ngx-signature-pad). It maintains the **2.x** line for **Angular 16–18** with **signature_pad 5.x**.

The newest line (3.x, Angular 19–22) is on `main`, which also documents all release lines and the release process.

For installation, usage and the API, see the [library README](projects/ngx-signature-pad/README.md). It is also the README published to npm for 2.x.

## Development

Use Node 18 (`nvm use` reads `.nvmrc`). The library is built with Angular 16.2, the oldest version in its range, so the package works on every Angular version in 16–18.

```bash
npm ci
npm test         # Karma + Jasmine in headless Chrome, with coverage gate
npm run build    # production (partial-Ivy) build to dist/ngx-signature-pad
npm run audit    # audits the published runtime dependencies (signature_pad, tslib)
```

CI also runs `.github/workflows/compat.yml`: it installs the packed library into a fresh app on each Angular version in this range, builds it with strict type checking, and draws on it in Chromium (`scripts/compat`).

The Angular 16–18 build toolchain is past end-of-life and `npm audit` reports advisories in it that have no fix. They don't ship: the published package depends only on `signature_pad` (peer) and `tslib`.

## Releasing

1. Bump `version` in `projects/ngx-signature-pad/package.json` (it must stay 2.x) and add a `CHANGELOG.md` entry.
2. Commit on this branch, tag `v2.Y.Z`, and push the tag.
3. The `Publish` workflow tests, builds and publishes with npm provenance under the `angular16-18` dist-tag.

## License

MIT
