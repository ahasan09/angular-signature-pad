import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgModule,
  NgZone,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
  SimpleChanges,
  computed,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import SignaturePadLib from 'signature_pad';
import type {
  BasicPoint,
  FromDataOptions,
  FromDataUrlOptions,
  Options,
  PointGroup as NativePointGroup,
  SignatureEvent,
  ToSVGOptions,
} from 'signature_pad';

/** A single recorded point (re-exported from signature_pad). */
export type Point = BasicPoint;

/** One stroke: its points plus the pen options used to draw it. */
export type PointGroup = NativePointGroup;

/** The underlying signature_pad instance type. */
export type NativeSignaturePad = SignaturePadLib;

/** Options accepted by `[options]`: signature_pad options plus canvas size. */
export interface SignaturePadConfig extends Options {
  /** Canvas width in pixels. */
  canvasWidth?: number;
  /** Canvas height in pixels. */
  canvasHeight?: number;
}

/**
 * Payload of `beginStroke` / `endStroke`: the original DOM event (`event`), the
 * pointer position in viewport coordinates (`x`, `y` = `clientX`, `clientY`) and `pressure`.
 */
export type SignatureStrokeEvent = SignatureEvent;

/** Pen options that can be changed on a live pad through inputs or `set()`. */
const LIVE_OPTIONS = [
  'minWidth',
  'maxWidth',
  'penColor',
  'throttle',
  'velocityFilterWeight',
  'dotSize',
  'minDistance',
  'backgroundColor',
] as const;

@Component({
  selector: 'signature-pad',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<canvas #canvas role="img" [attr.aria-label]="ariaLabel()"></canvas>',
  styles: [':host { display: inline-block; } canvas { display: block; touch-action: none; }'],
})
export class SignaturePadComponent implements OnChanges, AfterViewInit, OnDestroy {
  /** Base options forwarded to signature_pad. Individual inputs take precedence. */
  public readonly options = input<SignaturePadConfig>({});
  public readonly minWidth = input<number>();
  public readonly maxWidth = input<number>();
  public readonly penColor = input<string>();
  public readonly throttle = input<number>();
  public readonly velocityFilterWeight = input<number>();
  public readonly dotSize = input<number>();
  public readonly minDistance = input<number>();
  public readonly backgroundColor = input<string>();
  public readonly canvasWidth = input<number>();
  public readonly canvasHeight = input<number>();
  /** Screen reader description for the canvas element. */
  public readonly ariaLabel = input('Signature drawing area');

  /** Emits when a stroke starts, with the originating event, position and pressure. */
  public readonly beginStroke = output<SignatureStrokeEvent>();
  /** Emits when a stroke ends, with the originating event, position and pressure. */
  public readonly endStroke = output<SignatureStrokeEvent>();
  /**
   * Emits `true` when a stroke starts.
   * @deprecated Use `beginStroke`. Kept for backward compatibility.
   */
  // eslint-disable-next-line @angular-eslint/no-output-on-prefix -- backward compatibility
  public readonly onBeginEvent = output<boolean>();
  /**
   * Emits `true` when a stroke ends.
   * @deprecated Use `endStroke`. Kept for backward compatibility.
   */
  // eslint-disable-next-line @angular-eslint/no-output-on-prefix -- backward compatibility
  public readonly onEndEvent = output<boolean>();

  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly ngZone = inject(NgZone);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private signaturePad: SignaturePadLib | null = null;

  /** `[options]` merged with the individual inputs, which take precedence. */
  private readonly mergedOptions = computed<SignaturePadConfig>(() => {
    const overrides: SignaturePadConfig = {
      minWidth: this.minWidth(),
      maxWidth: this.maxWidth(),
      penColor: this.penColor(),
      throttle: this.throttle(),
      velocityFilterWeight: this.velocityFilterWeight(),
      dotSize: this.dotSize(),
      minDistance: this.minDistance(),
      backgroundColor: this.backgroundColor(),
      canvasWidth: this.canvasWidth(),
      canvasHeight: this.canvasHeight(),
    };
    const defined = Object.entries(overrides).filter(([, value]) => value !== undefined);
    return { ...this.options(), ...Object.fromEntries(defined) };
  });

  private readonly handleBegin = (event: Event): void => {
    this.ngZone.run(() => {
      this.beginStroke.emit((event as CustomEvent<SignatureStrokeEvent>).detail);
      this.onBegin();
    });
  };
  private readonly handleEnd = (event: Event): void => {
    this.ngZone.run(() => {
      this.endStroke.emit((event as CustomEvent<SignatureStrokeEvent>).detail);
      this.onEnd();
    });
  };

  public ngAfterViewInit(): void {
    if (!this.isBrowser) {
      return; // signature_pad needs a real DOM; skip on the server.
    }

    const canvas = this.canvas;
    const { canvasWidth, canvasHeight, ...padOptions } = this.mergedOptions();
    if (canvasWidth !== undefined) {
      canvas.width = canvasWidth;
    }
    if (canvasHeight !== undefined) {
      canvas.height = canvasHeight;
    }

    // Pointer-move listeners fire very often; keep them out of change detection.
    this.signaturePad = this.ngZone.runOutsideAngular(() => {
      const pad = new SignaturePadLib(canvas, padOptions);
      pad.addEventListener('beginStroke', this.handleBegin);
      pad.addEventListener('endStroke', this.handleEnd);
      return pad;
    });
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (!this.signaturePad) {
      return;
    }

    if (changes['options']) {
      // Re-apply everything so new base options take effect on the live pad.
      const { canvasWidth, canvasHeight, ...rest } = this.mergedOptions();
      Object.assign(this.signaturePad, rest);
      this.applyCanvasSize(canvasWidth, canvasHeight);
      return;
    }

    for (const key of LIVE_OPTIONS) {
      const value = this[key]();
      if (changes[key] && value !== undefined) {
        this.set(key, value);
      }
    }
    if (changes['canvasWidth'] || changes['canvasHeight']) {
      this.applyCanvasSize(this.canvasWidth(), this.canvasHeight());
    }
  }

  public ngOnDestroy(): void {
    const pad = this.signaturePad;
    if (!pad) {
      return;
    }
    pad.removeEventListener('beginStroke', this.handleBegin);
    pad.removeEventListener('endStroke', this.handleEnd);
    pad.off();
    this.signaturePad = null;
  }

  /**
   * Resizes the canvas backing store to its displayed size times the device
   * pixel ratio (for crisp lines on HiDPI screens) and redraws the signature.
   */
  public resizeCanvas(): void {
    if (!this.signaturePad) {
      return;
    }
    // Some browsers report devicePixelRatio < 1 when zoomed out.
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const canvas = this.canvas;
    const data = this.signaturePad.toData();
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d')?.scale(ratio, ratio);
    this.signaturePad.clear(); // keeps isEmpty() correct
    if (data.length) {
      this.signaturePad.fromData(data);
    }
  }

  /** Returns the signature as an array of strokes. */
  public toData(): PointGroup[] {
    return this.signaturePad?.toData() ?? [];
  }

  /** Draws a signature from an array of strokes. */
  public fromData(pointGroups: PointGroup[], options?: FromDataOptions): void {
    this.signaturePad?.fromData(pointGroups, options);
  }

  /** Returns the signature as a data URL (PNG by default, or JPEG/SVG). */
  public toDataURL(type: 'image/svg+xml', options?: ToSVGOptions): string;
  public toDataURL(type?: string, quality?: number): string;
  public toDataURL(type?: string, qualityOrOptions?: number | ToSVGOptions): string {
    if (!this.signaturePad) {
      return '';
    }
    return type === 'image/svg+xml'
      ? this.signaturePad.toDataURL(type, qualityOrOptions as ToSVGOptions | undefined)
      : this.signaturePad.toDataURL(type, qualityOrOptions as number | undefined);
  }

  /** Returns the signature as an SVG string. */
  public toSVG(options?: ToSVGOptions): string {
    return this.signaturePad?.toSVG(options) ?? '';
  }

  /**
   * Draws a signature from a data URL. Width and height default to the
   * configured canvas size. Resolves once the image has been drawn.
   */
  public fromDataURL(dataURL: string, options: FromDataUrlOptions = {}): Promise<void> {
    if (!this.signaturePad) {
      return Promise.resolve();
    }
    const { canvasWidth, canvasHeight } = this.mergedOptions();
    return this.signaturePad.fromDataURL(dataURL, {
      width: canvasWidth,
      height: canvasHeight,
      ...options,
    });
  }

  /** Clears the canvas. */
  public clear(): void {
    this.signaturePad?.clear();
  }

  /** Returns true when nothing has been drawn. */
  public isEmpty(): boolean {
    return this.signaturePad?.isEmpty() ?? true;
  }

  /** Stops listening for input (makes the pad read-only). */
  public off(): void {
    this.signaturePad?.off();
  }

  /** Starts listening for input again after `off()`. */
  public on(): void {
    this.signaturePad?.on();
  }

  /** Sets an option on the live pad, e.g. `set('penColor', 'blue')`. */
  public set(option: keyof SignaturePadConfig, value: unknown): void {
    if (!this.signaturePad) {
      return;
    }
    switch (option) {
      case 'canvasWidth':
        this.canvas.width = value as number;
        break;
      case 'canvasHeight':
        this.canvas.height = value as number;
        break;
      default:
        (this.signaturePad as unknown as Record<string, unknown>)[option] = value;
    }
  }

  /** Notifies subscribers that a stroke started. */
  public onBegin(): void {
    this.onBeginEvent.emit(true);
  }

  /** Notifies subscribers that a stroke ended. */
  public onEnd(): void {
    this.onEndEvent.emit(true);
  }

  /** Returns the underlying signature_pad instance (null before init or on the server). */
  public queryPad(): NativeSignaturePad | null {
    return this.signaturePad;
  }

  private applyCanvasSize(width?: number, height?: number): void {
    // Changing canvas size wipes it, so preserve and redraw strokes.
    const pad = this.signaturePad;
    const canvas = this.canvas;
    const widthChanged = width !== undefined && canvas.width !== width;
    const heightChanged = height !== undefined && canvas.height !== height;
    if (!pad || (!widthChanged && !heightChanged)) {
      return;
    }
    const data = pad.toData();
    if (widthChanged) {
      canvas.width = width;
    }
    if (heightChanged) {
      canvas.height = height;
    }
    pad.clear();
    if (data.length) {
      pad.fromData(data);
    }
  }

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef().nativeElement;
  }
}

/** NgModule for apps that don't use standalone imports. */
@NgModule({
  imports: [SignaturePadComponent],
  exports: [SignaturePadComponent],
})
export class SignaturePadModule {}

/** Short alias kept for backward compatibility. */
export { SignaturePadComponent as SignaturePad };
