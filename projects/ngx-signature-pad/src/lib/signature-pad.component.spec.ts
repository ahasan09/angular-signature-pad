import { Component, NgZone, PLATFORM_ID, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import SignaturePadLib from 'signature_pad';

import {
  PointGroup,
  SignaturePad,
  SignaturePadComponent,
  SignaturePadConfig,
  SignaturePadModule,
  SignatureStrokeEvent,
} from './signature-pad.component';

@Component({
  template: `
    <signature-pad
      *ngIf="show"
      [options]="options"
      [penColor]="penColor"
      [minWidth]="minWidth"
      [canvasWidth]="canvasWidth"
      [canvasHeight]="canvasHeight"
      [ariaLabel]="ariaLabel"
      (onBeginEvent)="begins = begins + 1"
      (onEndEvent)="ends = ends + 1"
      (beginStroke)="strokeEvents.push($event)"
      (endStroke)="strokeEvents.push($event)"
    ></signature-pad>
  `,
})
class HostComponent {
  @ViewChild(SignaturePadComponent) pad!: SignaturePadComponent;
  show = true;
  options: SignaturePadConfig = { canvasWidth: 300, canvasHeight: 150, minWidth: 1 };
  penColor?: string;
  minWidth?: number;
  canvasWidth?: number;
  canvasHeight?: number;
  ariaLabel = 'Sign here';
  begins = 0;
  ends = 0;
  strokeEvents: SignatureStrokeEvent[] = [];
}

/** Draws one stroke across the canvas using real pointer events. */
function drawStroke(canvas: HTMLCanvasElement, from = { x: 20, y: 20 }, to = { x: 120, y: 80 }): void {
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
    TestBed.configureTestingModule({ declarations: [HostComponent], imports: [CommonModule, SignaturePadModule] });
    fixture = createHost();
    host = fixture.componentInstance;
    pad = host.pad;
    canvas = fixture.nativeElement.querySelector('canvas');
  });

  afterEach(() => {
    fixture.destroy();
    fixture.nativeElement.remove();
  });

  describe('initialisation', () => {
    it('exports SignaturePad as an alias of SignaturePadComponent', () => {
      expect(SignaturePad).toBe(SignaturePadComponent);
    });

    it('creates a real signature_pad instance bound to its canvas', () => {
      expect(pad.queryPad()).toBeInstanceOf(SignaturePadLib);
      expect(pad.isEmpty()).toBeTrue();
    });

    it('sizes the canvas from options and keeps the size after change detection', () => {
      fixture.detectChanges();

      expect(canvas.width).toBe(300);
      expect(canvas.height).toBe(150);
    });

    it('lets individual inputs override [options]', () => {
      const other = createHost((h) => {
        h.canvasWidth = 410;
        h.minWidth = 3;
        h.penColor = 'rgb(255, 0, 0)';
      });
      const native = other.componentInstance.pad.queryPad()!;
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

      host.ariaLabel = 'Customer signature';
      fixture.detectChanges();

      expect(canvas.getAttribute('aria-label')).toBe('Customer signature');
    });
  });

  describe('drawing', () => {
    it('records a stroke drawn with pointer events', () => {
      drawStroke(canvas);

      expect(pad.isEmpty()).toBeFalse();
      expect(pad.toData().length).toBe(1);
      expect(pad.toData()[0].points.length).toBeGreaterThan(1);
    });

    it('emits beginStroke/endStroke with the originating pointer events', () => {
      drawStroke(canvas);

      expect(host.strokeEvents.length).toBe(2);
      const [begin, end] = host.strokeEvents as PointerEvent[];
      const rect = canvas.getBoundingClientRect();
      expect(begin).toBeInstanceOf(PointerEvent);
      expect(begin.type).toBe('pointerdown');
      expect(end.type).toBe('pointerup');
      expect(begin.clientX).toBeCloseTo(rect.left + 20, 0);
      expect(begin.clientY).toBeCloseTo(rect.top + 20, 0);
    });

    it('still emits the legacy onBeginEvent/onEndEvent once per stroke', () => {
      drawStroke(canvas);
      drawStroke(canvas, { x: 30, y: 100 }, { x: 200, y: 100 });

      expect(host.begins).toBe(2);
      expect(host.ends).toBe(2);
    });

    it('emits stroke events inside the Angular zone', () => {
      const zones: boolean[] = [];
      pad.beginStroke.subscribe(() => zones.push(NgZone.isInAngularZone()));
      pad.onEndEvent.subscribe(() => zones.push(NgZone.isInAngularZone()));

      drawStroke(canvas);

      expect(zones).toEqual([true, true]);
    });

    it('clear() empties the pad', () => {
      drawStroke(canvas);
      pad.clear();

      expect(pad.isEmpty()).toBeTrue();
      expect(pad.toData()).toEqual([]);
    });

    it('off() stops input and on() restores it', () => {
      pad.off();
      drawStroke(canvas);
      expect(pad.isEmpty()).toBeTrue();
      expect(host.begins).toBe(0);

      pad.on();
      drawStroke(canvas);
      expect(pad.isEmpty()).toBeFalse();
      expect(host.begins).toBe(1);
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

      expect(pad.isEmpty()).toBeFalse();
      expect(pad.toData()).toEqual(data);
    });

    it('fromData() appends when clear is false', () => {
      drawStroke(canvas);

      pad.fromData(pad.toData(), { clear: false });

      expect(pad.toData().length).toBe(2);
    });

    it('fromDataURL() draws the image and resolves', async () => {
      drawStroke(canvas);
      const url = pad.toDataURL();
      pad.clear();

      await pad.fromDataURL(url);

      expect(pad.isEmpty()).toBeFalse();
      expect(pad.toDataURL()).toBe(url);
    });

    it('fromDataURL() defaults width/height to the canvas size but allows overrides', async () => {
      const spy = spyOn(pad.queryPad()!, 'fromDataURL').and.resolveTo();

      await pad.fromDataURL('data:image/png;base64,x');
      await pad.fromDataURL('data:image/png;base64,x', { width: 10, ratio: 1 });

      expect(spy.calls.argsFor(0)).toEqual(['data:image/png;base64,x', { width: 300, height: 150 }]);
      expect(spy.calls.argsFor(1)).toEqual(['data:image/png;base64,x', { width: 10, height: 150, ratio: 1 }]);
    });
  });

  describe('live updates', () => {
    it('applies changed inputs to the live pad without recreating it', () => {
      const native = pad.queryPad();
      host.penColor = 'blue';
      host.minWidth = 4;
      fixture.detectChanges();

      expect(pad.queryPad()).toBe(native);
      expect(native!.penColor).toBe('blue');
      expect(native!.minWidth).toBe(4);
    });

    it('applies a new [options] object to the live pad', () => {
      host.options = { canvasWidth: 250, canvasHeight: 120, dotSize: 7, penColor: 'green' };
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

      host.canvasWidth = 500;
      host.canvasHeight = 200;
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
      spyOnProperty(window, 'devicePixelRatio').and.returnValue(2);
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
      spyOnProperty(window, 'devicePixelRatio').and.returnValue(0.5);
      canvas.style.width = '200px';
      canvas.style.height = '100px';

      pad.resizeCanvas();

      expect(canvas.width).toBe(200);
      expect(canvas.height).toBe(100);
    });
  });

  describe('teardown', () => {
    it('unbinds signature_pad listeners when destroyed', () => {
      const offSpy = spyOn(pad.queryPad()!, 'off').and.callThrough();

      host.show = false;
      fixture.detectChanges();
      drawStroke(canvas);

      expect(offSpy).toHaveBeenCalled();
      expect(host.begins).toBe(0);
      expect(pad.queryPad()).toBeNull();
    });
  });
});

describe('SignaturePadComponent on the server', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SignaturePadModule],
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
  });

  it('does not create signature_pad and returns safe defaults', async () => {
    const server = TestBed.createComponent(SignaturePadComponent);
    server.detectChanges();
    const cmp = server.componentInstance;

    expect(cmp.queryPad()).toBeNull();
    expect(cmp.isEmpty()).toBeTrue();
    expect(cmp.toData()).toEqual([]);
    expect(cmp.toDataURL()).toBe('');
    expect(cmp.toSVG()).toBe('');
    await expectAsync(cmp.fromDataURL('data:,')).toBeResolved();
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
