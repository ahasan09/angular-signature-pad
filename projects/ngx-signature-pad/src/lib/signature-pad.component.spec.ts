import {
  Component,
  NgModule,
  NgZone,
  PLATFORM_ID,
  provideZoneChangeDetection,
  signal,
  viewChild,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import SignaturePadLib from 'signature_pad';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  PointGroup,
  SignatureStrokeEvent,
  SignaturePad,
  SignaturePadComponent,
  SignaturePadConfig,
  SignaturePadModule,
} from './signature-pad.component';

@Component({
  imports: [SignaturePadComponent],
  template: `
    @if (show()) {
      <signature-pad
        [options]="options()"
        [penColor]="penColor()"
        [minWidth]="minWidth()"
        [canvasWidth]="canvasWidth()"
        [canvasHeight]="canvasHeight()"
        [ariaLabel]="ariaLabel()"
        (onBeginEvent)="begins.set(begins() + 1)"
        (onEndEvent)="ends.set(ends() + 1)"
        (beginStroke)="strokeEvents.push($event)"
        (endStroke)="strokeEvents.push($event)"
      />
    }
  `,
})
class HostComponent {
  readonly padRef = viewChild(SignaturePadComponent);
  show = signal(true);
  options = signal<SignaturePadConfig>({ canvasWidth: 300, canvasHeight: 150, minWidth: 1 });
  penColor = signal<string | undefined>(undefined);
  minWidth = signal<number | undefined>(undefined);
  canvasWidth = signal<number | undefined>(undefined);
  canvasHeight = signal<number | undefined>(undefined);
  ariaLabel = signal('Sign here');
  begins = signal(0);
  ends = signal(0);
  strokeEvents: SignatureStrokeEvent[] = [];
}

/** Draws one stroke across the canvas using real pointer events. */
function drawStroke(
  canvas: HTMLCanvasElement,
  from = { x: 20, y: 20 },
  to = { x: 120, y: 80 },
): void {
  const rect = canvas.getBoundingClientRect();
  const fire = (type: string, x: number, y: number, buttons: number) =>
    canvas.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true,
        button: 0,
        buttons,
        clientX: rect.left + x,
        clientY: rect.top + y,
        pressure: 0.5,
      }),
    );

  fire('pointerdown', from.x, from.y, 1);
  const steps = 10;
  for (let i = 1; i <= steps; i++) {
    fire('pointermove', from.x + ((to.x - from.x) * i) / steps, from.y + ((to.y - from.y) * i) / steps, 1);
  }
  fire('pointerup', to.x, to.y, 0);
}

function createHost(setup?: (host: HostComponent) => void): ComponentFixture<HostComponent> {
  const fixture = TestBed.createComponent(HostComponent);
  setup?.(fixture.componentInstance);
  document.body.appendChild(fixture.nativeElement);
  fixture.detectChanges();
  return fixture;
}

describe('SignaturePadComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let pad: SignaturePadComponent;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    fixture = createHost();
    host = fixture.componentInstance;
    pad = host.padRef()!;
    canvas = fixture.nativeElement.querySelector('canvas');
  });

  afterEach(() => {
    fixture.destroy();
    fixture.nativeElement.remove();
    vi.restoreAllMocks();
  });

  describe('initialisation', () => {
    it('exports SignaturePad as an alias of SignaturePadComponent', () => {
      expect(SignaturePad).toBe(SignaturePadComponent);
    });

    it('creates a real signature_pad instance bound to its canvas', () => {
      expect(pad.queryPad()).toBeInstanceOf(SignaturePadLib);
      expect(pad.isEmpty()).toBe(true);
    });

    it('sizes the canvas from options and keeps the size after change detection', () => {
      fixture.detectChanges();

      expect(canvas.width).toBe(300);
      expect(canvas.height).toBe(150);
    });

    it('lets individual inputs override [options]', () => {
      const other = createHost((h) => {
        h.canvasWidth.set(410);
        h.minWidth.set(3);
        h.penColor.set('rgb(255, 0, 0)');
      });
      const native = other.componentInstance.padRef()!.queryPad()!;
      const el: HTMLCanvasElement = other.nativeElement.querySelector('canvas');

      expect(el.width).toBe(410);
      expect(el.height).toBe(150);
      expect(native.minWidth).toBe(3);
      expect(native.penColor).toBe('rgb(255, 0, 0)');
      other.destroy();
      other.nativeElement.remove();
    });

    it('sets an accessible role and label on the canvas', () => {
      expect(canvas.getAttribute('role')).toBe('img');
      expect(canvas.getAttribute('aria-label')).toBe('Sign here');

      host.ariaLabel.set('Customer signature');
      fixture.detectChanges();

      expect(canvas.getAttribute('aria-label')).toBe('Customer signature');
    });
  });

  describe('drawing', () => {
    it('records a stroke drawn with pointer events', () => {
      drawStroke(canvas);

      expect(pad.isEmpty()).toBe(false);
      expect(pad.toData()).toHaveLength(1);
      expect(pad.toData()[0].points.length).toBeGreaterThan(1);
    });

    it('emits beginStroke/endStroke with the event, position and pressure', () => {
      drawStroke(canvas);

      expect(host.strokeEvents).toHaveLength(2);
      const [begin, end] = host.strokeEvents;
      expect(begin.event).toBeInstanceOf(PointerEvent);
      expect(begin.event.type).toBe('pointerdown');
      expect(end.event.type).toBe('pointerup');
      const rect = canvas.getBoundingClientRect();
      expect(begin.x).toBeCloseTo(rect.left + 20, 0);
      expect(begin.y).toBeCloseTo(rect.top + 20, 0);
      expect(begin.pressure).toBe(0.5);
    });

    it('still emits the legacy onBeginEvent/onEndEvent once per stroke', () => {
      drawStroke(canvas);
      drawStroke(canvas, { x: 30, y: 100 }, { x: 200, y: 100 });

      expect(host.begins()).toBe(2);
      expect(host.ends()).toBe(2);
    });

    it('clear() empties the pad', () => {
      drawStroke(canvas);
      pad.clear();

      expect(pad.isEmpty()).toBe(true);
      expect(pad.toData()).toEqual([]);
    });

    it('off() stops input and on() restores it', () => {
      pad.off();
      drawStroke(canvas);
      expect(pad.isEmpty()).toBe(true);
      expect(host.begins()).toBe(0);

      pad.on();
      drawStroke(canvas);
      expect(pad.isEmpty()).toBe(false);
      expect(host.begins()).toBe(1);
    });
  });

  describe('export and import', () => {
    it('toDataURL() returns PNG by default and honours the requested type', () => {
      drawStroke(canvas);

      expect(pad.toDataURL()).toMatch(/^data:image\/png;base64,/);
      expect(pad.toDataURL('image/jpeg', 0.8)).toMatch(/^data:image\/jpeg;base64,/);
      expect(pad.toDataURL('image/svg+xml')).toMatch(/^data:image\/svg\+xml;base64,/);
    });

    it('toSVG() returns SVG markup', () => {
      drawStroke(canvas);

      expect(pad.toSVG()).toContain('<svg');
    });

    it('round-trips strokes through toData()/fromData()', () => {
      drawStroke(canvas);
      const data: PointGroup[] = pad.toData();
      pad.clear();

      pad.fromData(data);

      expect(pad.isEmpty()).toBe(false);
      expect(pad.toData()).toEqual(data);
    });

    it('fromData() appends when clear is false', () => {
      drawStroke(canvas);

      pad.fromData(pad.toData(), { clear: false });

      expect(pad.toData()).toHaveLength(2);
    });

    it('fromDataURL() draws the image and resolves', async () => {
      drawStroke(canvas);
      const url = pad.toDataURL();
      pad.clear();

      await pad.fromDataURL(url);

      expect(pad.isEmpty()).toBe(false);
      expect(pad.toDataURL()).toBe(url);
    });

    it('fromDataURL() defaults width/height to the canvas size but allows overrides', async () => {
      const spy = vi.spyOn(pad.queryPad()!, 'fromDataURL').mockResolvedValue();

      await pad.fromDataURL('data:image/png;base64,x');
      await pad.fromDataURL('data:image/png;base64,x', { width: 10, ratio: 1 });

      expect(spy).toHaveBeenNthCalledWith(1, 'data:image/png;base64,x', { width: 300, height: 150 });
      expect(spy).toHaveBeenNthCalledWith(2, 'data:image/png;base64,x', {
        width: 10,
        height: 150,
        ratio: 1,
      });
    });
  });

  describe('live updates', () => {
    it('applies changed inputs to the live pad without recreating it', () => {
      const native = pad.queryPad();
      host.penColor.set('blue');
      host.minWidth.set(4);
      fixture.detectChanges();

      expect(pad.queryPad()).toBe(native);
      expect(native!.penColor).toBe('blue');
      expect(native!.minWidth).toBe(4);
    });

    it('applies a new [options] object to the live pad', () => {
      host.options.set({ canvasWidth: 250, canvasHeight: 120, dotSize: 7, penColor: 'green' });
      fixture.detectChanges();
      const native = pad.queryPad()!;

      expect(native.dotSize).toBe(7);
      expect(native.penColor).toBe('green');
      expect(canvas.width).toBe(250);
      expect(canvas.height).toBe(120);
    });

    it('keeps the signature when canvas size inputs change', () => {
      drawStroke(canvas);
      const data = pad.toData();

      host.canvasWidth.set(500);
      host.canvasHeight.set(200);
      fixture.detectChanges();

      expect(canvas.width).toBe(500);
      expect(canvas.height).toBe(200);
      expect(pad.toData()).toEqual(data);
    });

    it('set() updates pen options and canvas size', () => {
      pad.set('penColor', 'purple');
      pad.set('maxWidth', 9);
      pad.set('canvasWidth', 320);
      pad.set('canvasHeight', 180);

      expect(pad.queryPad()!.penColor).toBe('purple');
      expect(pad.queryPad()!.maxWidth).toBe(9);
      expect(canvas.width).toBe(320);
      expect(canvas.height).toBe(180);
    });

    it('resizeCanvas() scales for devicePixelRatio and keeps strokes', () => {
      vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(2);
      canvas.style.width = '200px';
      canvas.style.height = '100px';
      drawStroke(canvas);
      const data = pad.toData();

      pad.resizeCanvas();

      expect(canvas.width).toBe(400);
      expect(canvas.height).toBe(200);
      expect(pad.toData()).toEqual(data);
    });

    it('resizeCanvas() never uses a ratio below 1', () => {
      vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(0.5);
      canvas.style.width = '200px';
      canvas.style.height = '100px';

      pad.resizeCanvas();

      expect(canvas.width).toBe(200);
      expect(canvas.height).toBe(100);
    });
  });

  describe('teardown', () => {
    it('unbinds signature_pad listeners when destroyed', () => {
      const offSpy = vi.spyOn(pad.queryPad()!, 'off');

      host.show.set(false);
      fixture.detectChanges();
      drawStroke(canvas);

      expect(offSpy).toHaveBeenCalled();
      expect(host.begins()).toBe(0);
      expect(pad.queryPad()).toBeNull();
    });
  });
});

describe('SignaturePadModule', () => {
  @Component({
    // eslint-disable-next-line @angular-eslint/prefer-standalone -- this test covers NgModule-based apps
    standalone: false,
    template: '<signature-pad [options]="{ canvasWidth: 120, canvasHeight: 60 }" />',
  })
  class ModuleHostComponent {}

  @NgModule({ declarations: [ModuleHostComponent], imports: [SignaturePadModule] })
  class ModuleHostModule {}

  it('lets NgModule-based components use <signature-pad>', () => {
    TestBed.configureTestingModule({ imports: [ModuleHostModule] });
    const fixture = TestBed.createComponent(ModuleHostComponent);
    fixture.detectChanges();
    const canvas: HTMLCanvasElement = fixture.nativeElement.querySelector('canvas');

    expect(canvas.width).toBe(120);
    expect(canvas.height).toBe(60);
    fixture.destroy();
  });
});

describe('SignaturePadComponent with zone.js change detection', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZoneChangeDetection()] });
  });

  it('emits stroke events inside the Angular zone', () => {
    const fixture = createHost();
    const pad = fixture.componentInstance.padRef()!;
    const canvas: HTMLCanvasElement = fixture.nativeElement.querySelector('canvas');
    const zones: boolean[] = [];
    pad.beginStroke.subscribe(() => zones.push(NgZone.isInAngularZone()));
    pad.onEndEvent.subscribe(() => zones.push(NgZone.isInAngularZone()));

    drawStroke(canvas);

    expect(zones).toEqual([true, true]);
    expect(fixture.componentInstance.begins()).toBe(1);
    fixture.destroy();
    fixture.nativeElement.remove();
  });
});

describe('SignaturePadComponent on the server', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
  });

  it('does not create signature_pad and returns safe defaults', async () => {
    const server = TestBed.createComponent(SignaturePadComponent);
    server.detectChanges();
    const cmp = server.componentInstance;

    expect(cmp.queryPad()).toBeNull();
    expect(cmp.isEmpty()).toBe(true);
    expect(cmp.toData()).toEqual([]);
    expect(cmp.toDataURL()).toBe('');
    expect(cmp.toSVG()).toBe('');
    await expect(cmp.fromDataURL('data:,')).resolves.toBeUndefined();
    expect(() => {
      cmp.clear();
      cmp.on();
      cmp.off();
      cmp.fromData([]);
      cmp.set('penColor', 'red');
      cmp.resizeCanvas();
    }).not.toThrow();
    server.destroy();
  });
});
