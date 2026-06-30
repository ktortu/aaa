import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Section titrée d'une page de documentation. Projette son contenu sous un titre (+ sous-titre). */
@Component({
  selector: 'kt-doc-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // L'input `title` entre en collision avec l'attribut HTML natif : on retire ce dernier
  // pour éviter une infobulle native du navigateur en plus du rendu de la section.
  host: { '[attr.title]': 'null' },
  template: `
    <section class="doc-section">
      <div class="doc-section__head">
        <h2 class="doc-section__title">{{ title() }}</h2>
        @if (subtitle(); as sub) {
          <p class="doc-section__subtitle">{{ sub }}</p>
        }
      </div>
      <div class="doc-section__body"><ng-content /></div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }
    .doc-section {
      margin-block: 2.75rem;
    }
    .doc-section__title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 650;
      letter-spacing: -0.01em;
      color: var(--kt-on-surface);
    }
    .doc-section__subtitle {
      margin: 0.35rem 0 0;
      max-width: 60ch;
      color: var(--kt-muted);
      font-size: 0.9375rem;
      line-height: 1.5;
    }
    .doc-section__body {
      margin-top: 1.25rem;
    }
  `,
})
export class DocSection {
  /** Titre de la section. */
  readonly title = input.required<string>();
  /** Sous-titre optionnel (description courte). */
  readonly subtitle = input<string>();
}
