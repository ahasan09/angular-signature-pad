import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignaturePad } from './angular2-signaturepad.component';

describe('Angular2SignaturepadComponent', () => {
  let component: SignaturePad;
  let fixture: ComponentFixture<SignaturePad>;
  let constructorCalls = 0;
  let signaturePadMock: {
    _canvas: HTMLCanvasElement;
    clear: jasmine.Spy;
    isEmpty: jasmine.Spy;
    toDataURL: jasmine.Spy;
    fromDataURL: jasmine.Spy;
    toData: jasmine.Spy;
    fromData: jasmine.Spy;
    off: jasmine.Spy;
    on: jasmine.Spy;
    minWidth?: number;
    maxWidth?: number;
  };

  const signaturePadCtor = function (this: unknown, canvas: HTMLCanvasElement) {
      constructorCalls += 1;
      signaturePadMock = {
        _canvas: canvas,
        clear: jasmine.createSpy('clear'),
        isEmpty: jasmine.createSpy('isEmpty').and.returnValue(false),
        toDataURL: jasmine.createSpy('toDataURL').and.returnValue('data:image/png;base64,test'),
        fromDataURL: jasmine.createSpy('fromDataURL'),
        toData: jasmine.createSpy('toData').and.returnValue([]),
        fromData: jasmine.createSpy('fromData'),
        off: jasmine.createSpy('off'),
        on: jasmine.createSpy('on'),
      };

      return signaturePadMock;
    } as unknown as new (canvas: HTMLCanvasElement, options: unknown) => unknown;

  beforeEach(async () => {
    constructorCalls = 0;
    (window as any).devicePixelRatio = 1;
    (window as any).SignaturePad = signaturePadCtor;

    await TestBed.configureTestingModule({
      imports: [SignaturePad],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SignaturePad);
    component = fixture.componentInstance;
    component.options = { canvasWidth: 500, canvasHeight: 200 };
    fixture.detectChanges();

    // Replace runtime constructor with test double for deterministic assertions.
    (component as any).signaturePad = signaturePadMock;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(constructorCalls).toBe(1);
  });

  it('should clear the signature pad', () => {
    component.clear();

    expect(signaturePadMock.clear).toHaveBeenCalled();
  });

  it('should return empty state from signature pad', () => {
    signaturePadMock.isEmpty.and.returnValue(true);

    expect(component.isEmpty()).toBeTrue();
  });

  it('should return data URL from signature pad', () => {
    const result = component.toDataURL('image/jpeg', 0.8);

    expect(result).toBe('data:image/png;base64,test');
    expect(signaturePadMock.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.8);
  });

  it('should apply default width and height in fromDataURL', () => {
    component.fromDataURL('data:image/png;base64,test');

    expect(signaturePadMock.fromDataURL).toHaveBeenCalledWith(
      'data:image/png;base64,test',
      { width: 500, height: 200 }
    );
  });

  it('should update signature pad bindings via ngOnChanges', () => {
    component.minWidth = 2;
    component.maxWidth = 7;

    component.ngOnChanges({
      minWidth: {
        currentValue: 2,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
      maxWidth: {
        currentValue: 7,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });

    expect(signaturePadMock.minWidth).toBe(2);
    expect(signaturePadMock.maxWidth).toBe(7);
  });

  it('should forward toData and fromData', () => {
    const payload = [[{ x: 1, y: 2, time: 3 }]];

    component.fromData(payload as any);
    const data = component.toData();

    expect(signaturePadMock.fromData).toHaveBeenCalledWith(payload as any);
    expect(data).toEqual([]);
  });

  it('should forward off and on calls', () => {
    component.off();
    component.on();

    expect(signaturePadMock.off).toHaveBeenCalled();
    expect(signaturePadMock.on).toHaveBeenCalled();
  });

  it('should set canvas dimensions and generic options', () => {
    component.set('canvasWidth', 320);
    component.set('canvasHeight', 180);
    component.set('minWidth', 4);

    expect(signaturePadMock._canvas.width).toBe(320);
    expect(signaturePadMock._canvas.height).toBe(180);
    expect((signaturePadMock as any)['minWidth']).toBe(4);
  });

  it('should emit begin and end events', () => {
    const beginSpy = jasmine.createSpy('begin');
    const endSpy = jasmine.createSpy('end');

    component.onBeginEvent.subscribe(beginSpy);
    component.onEndEvent.subscribe(endSpy);

    component.onBegin();
    component.onEnd();

    expect(beginSpy).toHaveBeenCalledWith(true);
    expect(endSpy).toHaveBeenCalledWith(true);
  });

  it('should expose the native signature pad instance', () => {
    expect(component.queryPad()).toBe(signaturePadMock as any);
  });

  it('should resize the canvas and clear content', () => {
    const contextScale = jasmine.createSpy('scale');
    spyOnProperty(signaturePadMock._canvas, 'offsetWidth', 'get').and.returnValue(100);
    spyOnProperty(signaturePadMock._canvas, 'offsetHeight', 'get').and.returnValue(50);
    spyOn(signaturePadMock._canvas, 'getContext').and.returnValue({
      scale: contextScale,
    } as any);

    component.resizeCanvas();

    expect(signaturePadMock._canvas.width).toBe(100);
    expect(signaturePadMock._canvas.height).toBe(50);
    expect(contextScale).toHaveBeenCalledWith(1, 1);
    expect(signaturePadMock.clear).toHaveBeenCalled();
  });

  it('should return safe defaults when signaturePad is unavailable', () => {
    (component as any).signaturePad = null;

    expect(component.toData()).toEqual([]);
    expect(component.toDataURL()).toBe('');
    expect(component.isEmpty()).toBeTrue();

    component.clear();
    component.off();
    component.on();
  });
});
