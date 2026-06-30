import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Scène de démo : encadré « theme-aware » qui présente le rendu vivant des composants. */
@Component({
  selector: 'kt-doc-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (label(); as text) {
      <p class="doc-example__label">{{ text }}</p>
    }
    <div class="doc-example__stage"><ng-content /></div>
  `,
  styles: `
    :host {
      display: block;
      margin-bottom: 1.25rem;
    }
    .doc-example__label {
      margin: 0 0 0.5rem;
      font-size: 0.8125rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--kt-muted);
    }
    .doc-example__stage {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: var(--example-align-items, flex-start);
      padding: 1.5rem;
      border: 1px solid var(--kt-outline);
      border-radius: var(--kt-control-radius, 8px);
      background: var(--kt-surface);
    }
  `,
})
export class DocExample {
  /** Libellé optionnel de la scène (ex. « Modes »). */
  readonly label = input<string>();
}
