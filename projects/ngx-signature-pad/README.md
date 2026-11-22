# @raju_hasan09/ngx-signature-pad

Angular component for capturing handwritten signatures on a `<canvas>`, powered by [szimek/signature_pad](https://www.npmjs.com/package/signature_pad).

**[Live demo](https://ahasan09.github.io/angular-signature-pad/)**: draw, undo, export PNG/SVG and watch the stroke events.

- Standalone component (plus `SignaturePadModule` for NgModule apps), OnPush, SSR-safe (does nothing on the server)
- Pointer, mouse and touch input; export as PNG, JPEG, SVG or point data
- Drawing runs outside the Angular zone, so strokes don't trigger change detection; works in zoneless apps

## Versions

Pick the version that matches your Angular version:

| Package | Angular | signature_pad | Install |
| --- | --- | --- | --- |
| **3.x** | 19, 20, 21, 22 | 5.x | `npm i @raju_hasan09/ngx-signature-pad@3 signature_pad@5` |
| 2.x | 16, 17, 18 | 5.x | `npm i @raju_hasan09/ngx-signature-pad@2 signature_pad@5` |
| 1.x | 13, 14, 15 | 4.x | `npm i @raju_hasan09/ngx-signature-pad@1 signature_pad@4` |

All three have the same template API (`<signature-pad>`, inputs, outputs and methods below). Differences:

- **3.x** uses signal inputs (bind them in templates as usual; from code, use `ComponentRef.setInput()` or `set()`).
- **1.x** is NgModule-only (import `SignaturePadModule`), and `beginStroke` / `endStroke` emit signature_pad 4's raw `PointerEvent | MouseEvent | Touch`.

This README describes **3.x**.

## Install

```bash
npm install @raju_hasan09/ngx-signature-pad signature_pad
```

`signature_pad` is a peer dependency and must be installed alongside the component.

## Usage

```typescript
import { Component, ViewChild } from '@angular/core';
import {
  SignaturePad,
  SignaturePadComponent,
  SignaturePadConfig,
  SignatureStrokeEvent,
} from '@raju_hasan09/ngx-signature-pad';

@Component({
  selector: 'app-sign',
  imports: [SignaturePad],
  template: `
    <signature-pad
      [options]="options"
      [penColor]="'#1a237e'"
      (beginStroke)="drawStart($event)"
      (endStroke)="drawComplete()"
    />
    <button (click)="pad.clear()">Clear</button>
    <button (click)="save()" [disabled]="pad.isEmpty()">Save</button>
  `,
})
export class SignComponent {
  @ViewChild(SignaturePad) pad!: SignaturePadComponent;

  options: SignaturePadConfig = {
    minWidth: 1,
    maxWidth: 3,
    canvasWidth: 500,
    canvasHeight: 200,
    backgroundColor: 'rgb(255, 255, 255)', // needed for JPEG, otherwise transparent
  };

  drawStart(e: SignatureStrokeEvent): void {
    console.log(e.event.type, e.x, e.y, e.pressure);
  }

  drawComplete(): void {
    console.log(this.pad.toData());
  }

  save(): void {
    const png = this.pad.toDataURL(); // 'data:image/png;base64,...'
    const svg = this.pad.toSVG();
  }
}
```

Using NgModules? Import `SignaturePadModule` instead of `SignaturePad`.

## Inputs

| Input | Type | Description |
| --- | --- | --- |
| `options` | `SignaturePadConfig` | Any [signature_pad option](https://github.com/szimek/signature_pad#options) plus `canvasWidth` / `canvasHeight`. |
| `minWidth`, `maxWidth`, `penColor`, `dotSize`, `minDistance`, `throttle`, `velocityFilterWeight`, `backgroundColor` | | Override the matching key in `options`. Changes apply to the live pad. |
| `canvasWidth`, `canvasHeight` | `number` | Canvas size in pixels. Changing it keeps the current signature. |
| `ariaLabel` | `string` | Accessible label for the canvas (default `"Signature drawing area"`). |

## Outputs

| Output | Description |
| --- | --- |
| `beginStroke` | Emits a `SignatureStrokeEvent` when a stroke starts: `{ event, type, x, y, pressure }`. `event` is the original pointer, mouse or touch event; `x`/`y` are viewport (`clientX`/`clientY`) coordinates. |
| `endStroke` | Same payload, emitted when a stroke ends. |
| `onBeginEvent` / `onEndEvent` | **Deprecated.** Emit `true`; kept for compatibility with `ahasan-angular2-signaturepad`. Use `beginStroke` / `endStroke`. |

## Methods

| Method | Description |
| --- | --- |
| `toDataURL(type?, quality?)` | Image as a data URL. `type` is `'image/png'` (default), `'image/jpeg'` or `'image/svg+xml'`. |
| `toSVG(options?)` | Signature as an SVG string. |
| `fromDataURL(url, options?)` | Draws an image. Returns a `Promise<void>`. Width and height default to the canvas size. |
| `toData()` / `fromData(groups, { clear }?)` | Read or restore strokes as `PointGroup[]`. |
| `clear()` / `isEmpty()` | Clear the pad, or check whether anything has been drawn. |
| `off()` / `on()` | Disable or re-enable input (for example, a read-only view). |
| `set(option, value)` | Change one option on the live pad, including `canvasWidth` / `canvasHeight`. |
| `resizeCanvas()` | Match the canvas to its CSS size × `devicePixelRatio`, keeping the signature. Strokes keep their pixel positions; they are not scaled. Call it after layout changes. |
| `queryPad()` | The underlying `signature_pad` instance, or `null` before init or on the server. |

### Responsive / HiDPI canvas

Give the element a CSS size, then call `resizeCanvas()` once it is laid out and on window resize:

```typescript
ngAfterViewInit(): void {
  this.pad.resizeCanvas();
}

@HostListener('window:resize')
onResize(): void {
  this.pad.resizeCanvas();
}
```

## Migrating from `ahasan-angular2-signaturepad`

This package replaces `ahasan-angular2-signaturepad` (last release 1.0.0, Angular 12–13, signature_pad 2).

1. `npm uninstall ahasan-angular2-signaturepad` and install the version for your Angular version (table above), with the matching `signature_pad`.
2. Change imports from `'ahasan-angular2-signaturepad'` to `'@raju_hasan09/ngx-signature-pad'`. `SignaturePadModule` and the `<signature-pad>` tag still work.
3. `PointGroup` is now signature_pad's `{ points, penColor, ... }` instead of `Point[]`. Signatures saved with the old `toData()` must be converted before `fromData()`.
4. `fromDataURL()` returns a `Promise<void>`.
5. Optional: switch from `onBeginEvent` / `onEndEvent` to `beginStroke` / `endStroke`.

## License

MIT
