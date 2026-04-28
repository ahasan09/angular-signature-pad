# ahasan-angular2-signaturepad
Angular 19 standalone component wrapper for [szimek/signature_pad](https://www.npmjs.com/package/signature_pad).

## Install
`npm install ahasan-angular2-signaturepad --save`

## Reference Implementation

* [Source](https://github.com/ahasan09/ahasan-angular2-signaturepad)
* [Live Demo (StackBlitz)](https://stackblitz.com/edit/angular-signature-pad-demo)

## Usage example

API is identical to [szimek/signature_pad](https://www.npmjs.com/package/signature_pad).

Options are as per [szimek/signature_pad](https://www.npmjs.com/package/signature_pad) with the following additions:
* canvasWidth: width of the canvas (px)
* canvasHeight: height of the canvas (px)
The above options are provided to avoid accessing the DOM directly from your component to adjust the canvas size.

```typescript

import { Component, ViewChild } from '@angular/core';
import { SignaturePad, SignaturePadConfig } from 'ahasan-angular2-signaturepad';

@Component({
  standalone: true,
  imports: [SignaturePad],
  template: '<signature-pad [options]="signaturePadOptions" [minWidth]="2" [maxWidth]="5" (onBeginEvent)="drawStart()" (onEndEvent)="drawComplete()"></signature-pad>'
})

export class SignaturePadPage{

  @ViewChild(SignaturePad) signaturePad: SignaturePad;

  private signaturePadOptions: SignaturePadConfig = { // passed through to szimek/signature_pad constructor
    'minWidth': 5,
    'canvasWidth': 500,
    'canvasHeight': 300
  };

  constructor() {
    // no-op
  }

  ngAfterViewInit() {
    // this.signaturePad is now available
    this.signaturePad.set('minWidth', 5); // set szimek/signature_pad options at runtime
    this.signaturePad.clear(); // invoke functions from szimek/signature_pad API
  }

  drawComplete() {
    // will be notified of szimek/signature_pad's onEnd event
    console.log(this.signaturePad.toDataURL());
  }

  drawStart() {
    // will be notified of szimek/signature_pad's onBegin event
    console.log('begin drawing');
  }
}
```

## Accessibility

The canvas is rendered with `role="img"` and a default `aria-label="Signature drawing area"`.
Because digital signing is inherently pointer-based, keyboard-only alternatives are not fully equivalent. Applications should provide an alternate non-canvas verification workflow for keyboard-only and assistive-technology users.
