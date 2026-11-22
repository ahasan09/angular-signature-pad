import {
  AfterViewInit,
  Component,
  ElementRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import {
  SignaturePad,
  SignaturePadComponent,
  SignaturePadConfig,
  SignatureStrokeEvent,
} from '@raju_hasan09/ngx-signature-pad';

interface LogEntry {
  id: number;
  text: string;
}

@Component({
  selector: 'app-root',
  imports: [SignaturePad],
  host: { '(window:resize)': 'fitCanvas()' },
  template: `
    <main>
      <header>
        <h1>Signature Pad</h1>
        <p>
          Demo of <code>@raju_hasan09/ngx-signature-pad</code>: an Angular standalone component
          wrapping <a href="https://github.com/szimek/signature_pad">signature_pad</a>.
        </p>
      </header>

      <section class="card" aria-labelledby="pad-heading">
        <h2 id="pad-heading" class="visually-hidden">Draw your signature</h2>
        <div class="pad-frame" #frame [class.readonly]="readOnly()">
          <signature-pad
            [options]="options"
            [penColor]="penColor()"
            [minWidth]="penWidth() * 0.4"
            [maxWidth]="penWidth()"
            ariaLabel="Signature drawing area. Draw with a mouse, pen or finger."
            (beginStroke)="onBegin($event)"
            (endStroke)="onEnd($event)"
          />
          @if (isEmpty()) {
            <span class="placeholder" aria-hidden="true">Sign here</span>
          }
        </div>

        <div class="controls">
          <label>
            Pen colour
            <input type="color" [value]="penColor()" (input)="penColor.set(asValue($event))" />
          </label>
          <label>
            Pen width <output>{{ penWidth() }}</output>
            <input
              type="range"
              min="1"
              max="8"
              step="0.5"
              [value]="penWidth()"
              (input)="penWidth.set(+asValue($event))"
            />
          </label>
          <label class="check">
            <input type="checkbox" [checked]="readOnly()" (change)="toggleReadOnly()" />
            Read-only
          </label>
        </div>

        <div class="actions">
          <button type="button" (click)="undo()" [disabled]="isEmpty()">Undo</button>
          <button type="button" (click)="clear()" [disabled]="isEmpty()">Clear</button>
          <span class="spacer"></span>
          <button type="button" (click)="save('png')" [disabled]="isEmpty()">Preview PNG</button>
          <button type="button" class="primary" (click)="save('svg')" [disabled]="isEmpty()">
            Preview SVG
          </button>
        </div>
      </section>

      @if (preview(); as img) {
        <section class="card" aria-labelledby="preview-heading">
          <h2 id="preview-heading">Preview <small>({{ img.kind.toUpperCase() }}, {{ img.size }})</small></h2>
          <img [src]="img.url" alt="Exported signature" />
          <a [href]="img.url" [download]="'signature.' + img.kind">Download</a>
        </section>
      }

      <section class="card" aria-labelledby="log-heading">
        <h2 id="log-heading">Events <small>({{ strokes() }} {{ strokes() === 1 ? 'stroke' : 'strokes' }})</small></h2>
        <ol class="log" aria-live="polite">
          @for (entry of log(); track entry.id) {
            <li>{{ entry.text }}</li>
          } @empty {
            <li class="muted">Draw on the pad to see beginStroke / endStroke events.</li>
          }
        </ol>
      </section>
    </main>
  `,
})
export class AppComponent implements AfterViewInit {
  private readonly pad = viewChild.required(SignaturePadComponent);
  private readonly frame = viewChild.required<ElementRef<HTMLElement>>('frame');

  protected readonly options: SignaturePadConfig = { minDistance: 2 };
  protected readonly penColor = signal('#1d3a8a');
  protected readonly penWidth = signal(3);
  protected readonly readOnly = signal(false);
  protected readonly strokes = signal(0);
  protected readonly isEmpty = computed(() => this.strokes() === 0);
  protected readonly preview = signal<{ kind: 'png' | 'svg'; url: string; size: string } | null>(null);
  protected readonly log = signal<LogEntry[]>([]);
  private nextId = 0;

  ngAfterViewInit(): void {
    this.fitCanvas();
  }

  /** Size the canvas to its container at the device pixel ratio (keeps the drawing). */
  protected fitCanvas(): void {
    const canvas = this.frame().nativeElement.querySelector('canvas');
    if (canvas) {
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      this.pad().resizeCanvas();
    }
  }

  protected onBegin(e: SignatureStrokeEvent): void {
    this.addLog(`beginStroke · ${e.event.type} at ${this.canvasPoint(e)}`);
  }

  protected onEnd(e: SignatureStrokeEvent): void {
    this.strokes.set(this.pad().toData().length);
    this.addLog(`endStroke · ${e.event.type} at ${this.canvasPoint(e)}`);
  }

  protected undo(): void {
    const data = this.pad().toData();
    data.pop();
    this.pad().fromData(data);
    this.strokes.set(data.length);
  }

  protected clear(): void {
    this.pad().clear();
    this.strokes.set(0);
    this.preview.set(null);
  }

  protected toggleReadOnly(): void {
    this.readOnly.update((v) => !v);
    if (this.readOnly()) {
      this.pad().off();
    } else {
      this.pad().on();
    }
  }

  protected save(kind: 'png' | 'svg'): void {
    const url = kind === 'svg' ? this.pad().toDataURL('image/svg+xml') : this.pad().toDataURL();
    const bytes = Math.round((url.length - url.indexOf(',') - 1) * 0.75);
    this.preview.set({ kind, url, size: `${(bytes / 1024).toFixed(1)} kB` });
  }

  protected asValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  /** Converts the event's viewport position to canvas-relative CSS pixels. */
  private canvasPoint(e: SignatureStrokeEvent): string {
    const rect = this.frame().nativeElement.getBoundingClientRect();
    return `(${Math.round(e.x - rect.left)}, ${Math.round(e.y - rect.top)})`;
  }

  private addLog(text: string): void {
    this.log.update((entries) => [{ id: this.nextId++, text }, ...entries].slice(0, 6));
  }
}
