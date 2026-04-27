# ahasan-angular2-signaturepad

Angular 13 library workspace that wraps szimek/signature_pad as a reusable Angular component for canvas-based signature capture.

## Tech Stack
- Angular 13 / TypeScript
- signature_pad 2.x (canvas drawing library)
- ng-packagr (library build tooling)
- Karma + Jasmine (unit tests)
- RxJS 6

## Project Structure
```
ahasan-angular2-signaturepad/
  projects/
    ahasan-angular2-signaturepad/   # Angular library source
      src/lib/                      # SignaturePad component/module
      public-api.ts                 # Public exports
      ng-package.json
  signature-pad.ts                  # Legacy root-level component (not active)
  index.ts                          # Legacy root-level export (not active)
  angular.json
  package.json
```

## Development
```bash
# Install dependencies
npm install

# Run demo app
npm start

# Build the library
npm run build

# Run unit tests
npm test
```

## Key Notes
- Active library source is under `projects/ahasan-angular2-signaturepad/`; root-level `signature-pad.ts` and `index.ts` are legacy files.
- Published to npm as `angular2-signaturepad` — import `SignaturePadModule` to use.
- Library is no longer actively maintained upstream; expect potential compatibility issues with newer Angular versions.
