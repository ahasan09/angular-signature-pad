import {
  AfterContentInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  Output,
  OnDestroy,
} from '@angular/core';

import * as SignaturePadNative from 'signature_pad';

export interface Point {
  x: number;
  y: number;
  time: number;
}

export type PointGroup = Array<Point>;

export interface SignaturePadConfig {
  minWidth?: number;
  maxWidth?: number;
  penColor?: string;
  throttle?: number;
  velocityFilterWeight?: number;
  backgroundColor?: string;
  dotSize?: number;
  minDistance?: number;
  canvasWidth?: number;
  canvasHeight?: number;
  [key: string]: unknown;
}

@Component({
  template:
    '<canvas role="img" [attr.aria-label]="ariaLabel" [attr.width]="canvasWidth" [attr.height]="canvasHeight"></canvas>',
  selector: 'signature-pad',
  standalone: true,
})
export class SignaturePadComponent
  implements OnInit, OnChanges, AfterContentInit, OnDestroy
{
  /** Base options forwarded to signature_pad. */
  @Input() public options: SignaturePadConfig = {};
  /** Optional minimum line width input. */
  @Input() public minWidth?: number;
  /** Optional maximum line width input. */
  @Input() public maxWidth?: number;
  /** Optional pen color input. */
  @Input() public penColor?: string;
  /** Optional throttle input. */
  @Input() public throttle?: number;
  /** Optional velocity filter weight input. */
  @Input() public velocityFilterWeight?: number;
  /** Optional explicit canvas width input. */
  @Input() public canvasWidth?: number;
  /** Optional explicit canvas height input. */
  @Input() public canvasHeight?: number;
  /** Screen reader description for the canvas element. */
  @Input() public ariaLabel = 'Signature drawing area';

  /** Emits when drawing starts. */
  @Output() public onBeginEvent: EventEmitter<boolean>;
  /** Emits when drawing ends. */
  @Output() public onEndEvent: EventEmitter<boolean>;

  private signaturePad: {
    _canvas: HTMLCanvasElement;
    clear: () => void;
    toData: () => Array<PointGroup>;
    fromData: (points: Array<PointGroup>) => void;
    toDataURL: (imageType?: string, quality?: number) => string;
    fromDataURL: (dataURL: string, options?: Record<string, unknown>) => void;
    isEmpty: () => boolean;
    off: () => void;
    on: () => void;
    onBegin?: () => void;
    onEnd?: () => void;
    [key: string]: unknown;
  } | null = null;

  private readonly elementRef: ElementRef;

  constructor(elementRef: ElementRef) {
    this.elementRef = elementRef;
    this.onBeginEvent = new EventEmitter();
    this.onEndEvent = new EventEmitter();
  }

  public ngOnInit(): void {
    this.options = this.options || {};
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (!this.signaturePad) {
      return;
    }

    if (changes['minWidth'] && this.minWidth !== undefined) {
      this.signaturePad['minWidth'] = this.minWidth;
    }
    if (changes['maxWidth'] && this.maxWidth !== undefined) {
      this.signaturePad['maxWidth'] = this.maxWidth;
    }
    if (changes['penColor'] && this.penColor !== undefined) {
      this.signaturePad['penColor'] = this.penColor;
    }
    if (changes['throttle'] && this.throttle !== undefined) {
      this.signaturePad['throttle'] = this.throttle;
    }
    if (
      changes['velocityFilterWeight'] &&
      this.velocityFilterWeight !== undefined
    ) {
      this.signaturePad['velocityFilterWeight'] = this.velocityFilterWeight;
    }
  }

  public ngAfterContentInit(): void {
    const canvas = this.elementRef.nativeElement.querySelector(
      'canvas'
    ) as HTMLCanvasElement | null;
    if (!canvas) {
      return;
    }

    const mergedOptions = this.buildSignaturePadOptions();
    const signaturePadConstructor =
      (window as unknown as { SignaturePad?: new (canvas: HTMLCanvasElement, options: SignaturePadConfig) => any }).SignaturePad ??
      (SignaturePadNative as any).default;

    if (mergedOptions.canvasHeight) {
      canvas.height = mergedOptions.canvasHeight;
    }

    if (mergedOptions.canvasWidth) {
      canvas.width = mergedOptions.canvasWidth;
    }

    const pad = new signaturePadConstructor(canvas, mergedOptions);
    pad.onBegin = this.onBegin.bind(this);
    pad.onEnd = this.onEnd.bind(this);
    this.signaturePad = pad;
  }

  public ngOnDestroy(): void {
    const canvas = this.elementRef.nativeElement.querySelector(
      'canvas'
    ) as HTMLCanvasElement | null;
    if (!canvas) {
      return;
    }

    canvas.width = 0;
    canvas.height = 0;
  }

  public resizeCanvas(): void {
    if (!this.signaturePad) {
      return;
    }

    // When zoomed out to less than 100%, for some very strange reason,
    // some browsers report devicePixelRatio as less than 1
    // and only part of the canvas is cleared then.
    const ratio: number = Math.max(window.devicePixelRatio || 1, 1);
    const canvas: HTMLCanvasElement = this.signaturePad._canvas;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    const context = canvas.getContext('2d');
    if (context) {
      context.scale(ratio, ratio);
    }
    this.signaturePad.clear(); // otherwise isEmpty() might return incorrect value
  }

  // Returns signature image as an array of point groups
  public toData(): Array<PointGroup> {
    if (this.signaturePad) {
      return this.signaturePad.toData();
    }

    return [];
  }

  // Draws signature image from an array of point groups
  public fromData(points: Array<PointGroup>): void {
    this.signaturePad?.fromData(points);
  }

  // Returns signature image as data URL (see https://mdn.io/todataurl for the list of possible paramters)
  public toDataURL(imageType?: string, quality?: number): string {
    return this.signaturePad?.toDataURL(imageType, quality) ?? '';
  }

  // Draws signature image from data URL
  public fromDataURL(
    dataURL: string,
    options: Record<string, unknown> = {}
  ): void {
    // set default height and width on read data from URL
    const mergedOptions = this.buildSignaturePadOptions();
    if (!Object.prototype.hasOwnProperty.call(options, 'height') && mergedOptions.canvasHeight) {
      options['height'] = mergedOptions.canvasHeight;
    }
    if (!Object.prototype.hasOwnProperty.call(options, 'width') && mergedOptions.canvasWidth) {
      options['width'] = mergedOptions.canvasWidth;
    }
    this.signaturePad?.fromDataURL(dataURL, options);
  }

  // Clears the canvas
  public clear(): void {
    this.signaturePad?.clear();
  }

  // Returns true if canvas is empty, otherwise returns false
  public isEmpty(): boolean {
    return this.signaturePad?.isEmpty() ?? true;
  }

  // Unbinds all event handlers
  public off(): void {
    this.signaturePad?.off();
  }

  // Rebinds all event handlers
  public on(): void {
    this.signaturePad?.on();
  }

  // set an option on the signaturePad - e.g. set('minWidth', 50);
  public set(option: string, value: any): void {
    if (!this.signaturePad) {
      return;
    }

    switch (option) {
      case 'canvasHeight':
        this.signaturePad._canvas.height = value;
        break;
      case 'canvasWidth':
        this.signaturePad._canvas.width = value;
        break;
      default:
        this.signaturePad[option] = value;
    }
  }

  // notify subscribers on signature begin
  public onBegin(): void {
    this.onBeginEvent.emit(true);
  }

  // notify subscribers on signature end
  public onEnd(): void {
    this.onEndEvent.emit(true);
  }

  public queryPad(): any {
    return this.signaturePad;
  }

  private buildSignaturePadOptions(): SignaturePadConfig {
    const baseOptions: SignaturePadConfig = { ...this.options };

    if (this.minWidth !== undefined) {
      baseOptions.minWidth = this.minWidth;
    }
    if (this.maxWidth !== undefined) {
      baseOptions.maxWidth = this.maxWidth;
    }
    if (this.penColor !== undefined) {
      baseOptions.penColor = this.penColor;
    }
    if (this.throttle !== undefined) {
      baseOptions.throttle = this.throttle;
    }
    if (this.velocityFilterWeight !== undefined) {
      baseOptions.velocityFilterWeight = this.velocityFilterWeight;
    }
    if (this.canvasWidth !== undefined) {
      baseOptions.canvasWidth = this.canvasWidth;
    }
    if (this.canvasHeight !== undefined) {
      baseOptions.canvasHeight = this.canvasHeight;
    }

    return baseOptions;
  }
}

export { SignaturePadComponent as SignaturePad };
