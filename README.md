# Angular Signature Pad

Source for **[`@raju_hasan09/ngx-signature-pad`](https://www.npmjs.com/package/@raju_hasan09/ngx-signature-pad)**, an Angular component wrapping [szimek/signature_pad](https://www.npmjs.com/package/signature_pad). It replaces `ahasan-angular2-signaturepad`.

**[Live demo](https://ahasan09.github.io/angular-signature-pad/)**: built from `main` and deployed to GitHub Pages on every push (`.github/workflows/demo.yml`).

For installation, usage and the API, see the [library README](projects/ngx-signature-pad/README.md). It is also the README published to npm.

## Release lines

| Line | Angular | signature_pad | Branch | npm dist-tag | Build / test toolchain |
| --- | --- | --- | --- | --- | --- |
| **3.x** | 19–22 | 5.x | `main` | `latest` | Angular 22, Node 22, Vitest |
| 2.x | 16–18 | 5.x | `release/v2` | `angular16-18` | Angular 16, Node 18, Karma |
| 1.x | 13–15 | 4.x | `release/v1` | `angular13-15` | Angular 13, Node 16, Karma |

Each line is built with the **oldest** Angular version in its range, so the compiled package works on every newer version in that range. Bug fixes land on `main` first and are ported to the release branches.

## Development (3.x, this branch)

Requires Node.js `^22.22.3 || ^24.15.0 || >=26` (same as Angular 22).

```bash
npm ci
npx playwright install chromium   # once: browser for the tests

npm start          # demo app at http://localhost:4200 (uses the library source, no build needed)
npm test           # Vitest in headless Chromium, with coverage gate
npm run test:watch
npm run lint
npm run build      # production (partial-Ivy) build to dist/ngx-signature-pad
npm run build:demo
npm run audit
```

The tests use Vitest browser mode (Playwright Chromium) through Angular's `@angular/build:unit-test` builder. They drive the real `signature_pad` with pointer events, because canvas rendering is part of what they check.

The demo app (`projects/demo`) shows pen colour and width, undo, read-only mode, PNG/SVG export and the live `beginStroke`/`endStroke` events.

### Compatibility check

CI (`.github/workflows/compat.yml`) installs the packed library into a fresh app on every Angular version this line supports, builds it with strict type checking, and draws on it in Chromium. To run one version locally:

```bash
npm run build && npm pack ./dist/ngx-signature-pad --pack-destination /tmp
bash scripts/compat/make-app.sh 20 "~5.8.0" /tmp/app-ng20 /tmp/raju_hasan09-ngx-signature-pad-3.0.0.tgz "^5.0.0" signals zone
node scripts/compat/check-app.cjs /tmp/app-ng20/dist
```

Each release branch has the same check for its own Angular range.

## Releasing

1. On the line's branch, bump `version` in `projects/ngx-signature-pad/package.json` and add a `CHANGELOG.md` entry.
2. Commit, then tag `vX.Y.Z` on that branch (it must match the version) and push the tag.
3. That branch's `Publish` workflow tests, builds and publishes with npm provenance, under the line's dist-tag. It refuses to publish if the tag, version or release line don't match.

`latest` must always point to the newest line, which is why the older lines publish under their own dist-tags.

### Trusted publishing

All three publish workflows use npm [trusted publishing](https://docs.npmjs.com/trusted-publishers/): npm exchanges the workflow's GitHub identity token for a short-lived publish credential, so no npm token is stored in the repository. Each line builds and tests on its own Node version, then publishes with Node 24 and npm 11 (trusted publishing needs npm 11.5.1+ and Node 22.14+).

It is configured once on npmjs.com, under the package's settings: a GitHub Actions trusted publisher for `ahasan09/angular-signature-pad` with workflow `publish.yml`, allowed to publish directly. All three branches share that workflow file name, so the one entry covers every line.

## License

MIT
