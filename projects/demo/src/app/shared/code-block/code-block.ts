import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

/** Bloc de code stylé (sans coloration syntaxique) avec bouton « Copier ». */
@Component({
  selector: 'kt-doc-code',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="doc-code">
      <figcaption class="doc-code__bar">
        <span class="doc-code__lang">{{ language() }}</span>
        <button type="button" class="doc-code__copy" (click)="copy()" [attr.data-copied]="copied() ? '' : null">
          {{ copied() ? 'Copié ✓' : 'Copier' }}
        </button>
      </figcaption>
      <pre class="doc-code__pre"><code>{{ code() }}</code></pre>
    </figure>
  `,
  styles: `
    :host {
      display: block;
      /* Autorise le rétrécissement en contexte grid/flex pour que le <pre> scrolle
         horizontalement au lieu d'élargir la page. */
      min-width: 0;
    }
    .doc-code {
      margin: 0;
      border: 1px solid var(--kt-outline);
      border-radius: var(--kt-control-radius, 8px);
      overflow: hidden;
      background: color-mix(in oklab, var(--kt-on-surface) 4%, var(--kt-surface));
    }
    .doc-code__bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.4rem 0.4rem 0.4rem 0.85rem;
      border-bottom: 1px solid var(--kt-outline);
    }
    .doc-code__lang {
      font:
        600 0.75rem/1 ui-monospace,
        monospace;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--kt-muted);
    }
    .doc-code__copy {
      appearance: none;
      border: 1px solid var(--kt-outline);
      border-radius: 6px;
      padding: 0.3rem 0.7rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--kt-on-surface);
      background: var(--kt-surface);
      cursor: pointer;
    }
    .doc-code__copy:hover {
      border-color: var(--kt-primary);
    }
    .doc-code__copy[data-copied] {
      color: var(--kt-primary);
      border-color: var(--kt-primary);
    }
    .doc-code__pre {
      margin: 0;
      padding: 1rem 1.1rem;
      overflow-x: auto;
      font:
        0.875rem/1.6 ui-monospace,
        'SF Mono',
        'Cascadia Code',
        monospace;
      color: var(--kt-on-surface);
    }
  `,
})
export class CodeBlock {
  /** Source à afficher / copier. */
  readonly code = input.required<string>();
  /** Langage indiqué dans la barre. */
  readonly language = input<string>('html');

  /** État transitoire du retour visuel après copie. */
  readonly copied = signal(false);

  async copy(): Promise<void> {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(this.code());
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1500);
  }
}
