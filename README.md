# Angular Signature Pad

An Angular component that provides a signature drawing canvas powered by [szimek/signature_pad](https://www.npmjs.com/package/signature_pad). Allows users to draw, capture, and export handwritten signatures as base64 images.

## Features

- Smooth signature drawing on a `<canvas>` element
- Configurable canvas dimensions
- Export signature as PNG/JPEG data URL
- Clear the canvas programmatically
- Angular 19+ compatible

## Tech Stack

- Angular 19+
- TypeScript
- signature_pad

## Prerequisites

- [Node.js](https://nodejs.org/) v10+
- Angular CLI: `npm install -g @angular/cli`

## Getting Started

```bash
git clone https://github.com/ahasan09/angular-signature-pad
cd angular-signature-pad
npm install
ng serve
```

Open [http://localhost:4200](http://localhost:4200).

## Usage in Your Project

### 1. Install

```bash
npm install angular2-signaturepad --save
```

### 2. Import the standalone component

```typescript
import { SignaturePad } from 'angular2-signaturepad';

@Component({
  standalone: true,
  imports: [ SignaturePad ],
})
export class AppComponent {}
```

### 3. Use in a component

```typescript
import { Component, ViewChild } from '@angular/core';
import { SignaturePad } from 'angular2-signaturepad/signature-pad';

@Component({
  template: `
    <signature-pad
      [options]="signaturePadOptions"
      (onBeginEvent)="drawStart()"
      (onEndEvent)="drawComplete()">
    </signature-pad>
    <button (click)="clear()">Clear</button>
    <button (click)="save()">Save</button>
  `
})
export class MyComponent {
  @ViewChild(SignaturePad) signaturePad: SignaturePad;

  signaturePadOptions = {
    minWidth: 2,
    canvasWidth: 500,
    canvasHeight: 300
  };

  drawComplete() {
    console.log(this.signaturePad.toDataURL()); // base64 PNG
  }

  clear() {
    this.signaturePad.clear();
  }

  save() {
    const dataURL = this.signaturePad.toDataURL('image/jpeg');
    // upload or use dataURL
  }
}
```

## Commands

| Command | Description |
|---------|-------------|
| `ng serve` | Start dev server on port 4200 |
| `ng build --prod` | Production build |
| `ng test` | Run unit tests |

## Additional Resources

- Changelog: `CHANGELOG.md`
- Library README: `projects/ahasan-angular2-signaturepad/README.md`
- StackBlitz demo: https://stackblitz.com/edit/angular-signature-pad-demo
