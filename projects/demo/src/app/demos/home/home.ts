import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CodeBlock } from '../../shared/code-block/code-block';
import { COMPONENT_NAV_ITEMS } from '../../shared/nav';

/** Page d'accueil : présentation courte de la librairie + index des composants. */
@Component({
  selector: 'kt-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CodeBlock],
  template: `
    <div class="home">
      <header class="home__hero">
        <p class="home__eyebrow">@ktortu/aaa</p>
        <h1 class="home__title">Un design system Angular simple, accessible et thémable</h1>
        <p class="home__lead">
          À l'origine, j'ai développé cette librairie pour mon propre usage, j'en avais marre de me battre avec Angular
          Material. l'objectif était d'avoir des composants pratiques, accessibles et facilement thémables.
        </p>
        <p>
          C'est un projet personnel sans grande prétention, mais n'hésitez pas à vous en servir s'il peut vous être
          utile.
        </p>
      </header>

      <section class="home__install">
        <h2 class="home__h2">Mise en route</h2>

        <p class="home__install-step">1. Installation</p>
        <kt-doc-code language="bash" code="npm install @ktortu/aaa" />

        <p class="home__install-step">2. Intégration des styles & composants</p>
        <kt-doc-code language="ts" [code]="installSnippet" />
      </section>

      <section class="home__index">
        <h2 class="home__h2">Composants</h2>
        <ul class="home__grid">
          @for (item of components; track item.link) {
            <li class="home__card">
              <a class="home__card-link" [routerLink]="item.link">
                <span class="home__card-label">{{ item.label }}</span>
                <span class="home__card-state">Documenté</span>
              </a>
            </li>
          }
        </ul>
      </section>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .home__hero {
      padding: 1rem 0 2.5rem;
    }
    .home__eyebrow {
      margin: 0 0 0.75rem;
      font:
        600 0.8125rem/1 ui-monospace,
        monospace;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--kt-primary);
    }
    .home__title {
      margin: 0;
      font-size: clamp(1.75rem, 4vw, 2.5rem);
      font-weight: 700;
      letter-spacing: -0.02em;
      line-height: 1.1;
      color: var(--kt-on-surface);
    }
    .home__lead {
      margin: 1rem 0 0;

      font-size: 1.0625rem;
      line-height: 1.6;
      color: var(--kt-muted);
    }
    .home__lead code {
      font-family: ui-monospace, monospace;
      font-size: 0.9375em;
      color: var(--kt-on-surface);
    }
    .home__cta {
      margin-top: 1.75rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .home__h2 {
      margin: 0 0 1rem;
      font-size: 1.125rem;
      font-weight: 650;
      color: var(--kt-on-surface);
    }
    .home__install {
      margin-bottom: 3rem;
    }
    .home__install-step {
      margin: 1.25rem 0 0.5rem;
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--kt-on-surface);
    }
    .home__install-step:first-of-type {
      margin-top: 0;
    }
    .home__grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
      gap: 0.75rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .home__card-link {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      padding: 1rem 1.1rem;
      border: 1px solid var(--kt-outline);
      border-radius: var(--kt-control-radius, 8px);
      text-decoration: none;
      background: var(--kt-surface);
      transition: border-color 0.15s ease;
    }
    a.home__card-link:hover {
      border-color: var(--kt-primary);
    }
    .home__card-label {
      font-size: 1rem;
      font-weight: 600;
      color: var(--kt-on-surface);
    }
    .home__card-state {
      font-size: 0.8125rem;
      color: var(--kt-primary);
    }
  `,
})
export class Home {
  protected readonly installSnippet = `// Styles (socle + composants) dans votre styles.css
@import '@ktortu/aaa/styles.css';

// Dans un composant standalone
import { KtButton } from '@ktortu/aaa/button';

@Component({
  imports: [KtButton],
  template: \`<button ktButton>Valider</button>\`,
})`;

  /** Index des composants — dérivé de la navigation partagée (plus de liste à resynchroniser). */
  protected readonly components = COMPONENT_NAV_ITEMS;
}
