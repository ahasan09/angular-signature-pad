# Angular Signature Pad — 1.x (Angular 13–15)

This is the `release/v1` branch of [`@raju_hasan09/ngx-signature-pad`](https://www.npmjs.com/package/@raju_hasan09/ngx-signature-pad). It maintains the **1.x** line for **Angular 13–15** with **signature_pad 4.x**.

The newest line (3.x, Angular 19–22) is on `main`, which also documents all release lines and the release process.

For installation, usage and the API, see the [library README](projects/ngx-signature-pad/README.md). It is also the README published to npm for 1.x.

## Development

Use Node 16 (`nvm use` reads `.nvmrc`). The library is built with Angular 13.4, the oldest version in its range, so the package works on every Angular version in 13–15.

```bash
npm ci
npm test         # Karma + Jasmine in headless Chrome, with coverage gate
npm run build    # production (partial-Ivy) build to dist/ngx-signature-pad
npm run audit    # audits the published runtime dependencies (signature_pad, tslib)
```

CI also runs `.github/workflows/compat.yml`: it installs the packed library into a fresh app on each Angular version in this range, builds it with strict type checking, and draws on it in Chromium (`scripts/compat`).

The Angular 13–15 build toolchain is past end-of-life and `npm audit` reports advisories in it that have no fix. They don't ship: the published package depends only on `signature_pad` (peer) and `tslib`.

## Releasing

1. Bump `version` in `projects/ngx-signature-pad/package.json` (it must stay 1.x) and add a `CHANGELOG.md` entry.
2. Commit on this branch, tag `v1.Y.Z`, and push the tag.
3. The `Publish` workflow tests, builds and publishes with npm provenance under the `angular13-15` dist-tag.

## License

MIT
