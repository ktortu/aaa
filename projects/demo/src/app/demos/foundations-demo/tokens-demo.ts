import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { DocSection } from '../../shared/doc-section/doc-section';
import { DocExample } from '../../shared/example/example';
import { CodeBlock } from '../../shared/code-block/code-block';
import { TokensTable } from '../../shared/tokens-table/tokens-table';
import { KtTheme } from '../../theme/theme';
import {
  FOUNDATIONS_COLOR_SWATCHES,
  FOUNDATIONS_SETUP_SNIPPET,
  FOUNDATIONS_THEME_SNIPPET,
  FOUNDATIONS_TOKENS,
} from './foundations-demo.data';

@Component({
  selector: 'kt-tokens-demo',
  imports: [DocSection, DocExample, CodeBlock, TokensTable],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './foundations-demo.css',
  template: `
    <article class="page">
      <header class="page__head">
        <p class="page__eyebrow">Fondations</p>
        <h1 class="page__title">Tokens CSS</h1>
        <p class="page__lead">
          Le socle <code>--kt-*</code> est le contrat racine du design system : couleurs sémantiques, surfaces &amp;
          texte, géométrie de contrôle, anneau de focus, gouttières et feuille modale partagée. Tous les tokens de
          composants (<code>--field-*</code>, <code>--btn-*</code>, <code>--checkbox-*</code>…) en
          <strong>dérivent</strong> : surcharger un seul <code>--kt-*</code> sur <code>:root</code> (ex.
          <code>--kt-primary</code>) rebrande la lib entière, sans surcharge de styles. Les thèmes (attribut
          <code>data-theme</code>) redéclarent ces variables ; un thème sombre redéclare aussi
          <code>color-scheme: dark</code>.
        </p>
      </header>

      <kt-doc-section
        title="Exemples"
        subtitle="Aperçu vivant : les pastilles et la scène lisent les tokens — changez de thème pour les voir basculer."
      >
        <kt-doc-example label="Couleurs">
          <div class="swatches">
            @for (s of resolvedSwatches(); track s.token) {
              <figure class="swatch">
                <span class="swatch__chip" [style.background]="'var(' + s.token + ')'"></span>
                <figcaption class="swatch__cap">
                  <code>{{ s.token }}</code>
                  <span class="swatch__val">{{ s.value }}</span>
                </figcaption>
              </figure>
            }
          </div>
        </kt-doc-example>

        <kt-doc-example label="Texte sur surface">
          <div class="texts">
            <p class="text-sample text-sample--on-surface">Texte principal — <code>--kt-on-surface</code></p>
            <p class="text-sample text-sample--muted">Texte secondaire / indice — <code>--kt-muted</code></p>
          </div>
        </kt-doc-example>

        <kt-doc-example label="Géométrie & focus">
          <div class="geo">
            <div class="geo__box">radius · height</div>
            <button class="geo__focusable" type="button">Focus-moi (Tab)</button>
          </div>
        </kt-doc-example>
      </kt-doc-section>

      <kt-doc-section
        title="Utilisation"
        subtitle="Importer le socle, puis rebrander sur :root ou récupérer & activer un thème."
      >
        <div class="page__codes">
          <kt-doc-code language="html" [code]="setupSnippet" />
          <kt-doc-code language="html" [code]="themeSnippet" />
        </div>
      </kt-doc-section>

      <kt-doc-section
        title="Tokens CSS"
        subtitle="Le contrat racine. Surchargez ces variables sur :root pour rebrander toute la lib."
      >
        <kt-doc-tokens [groups]="tokens" />
      </kt-doc-section>
    </article>
  `,
})
export class TokensDemo {
  private readonly doc = inject(DOCUMENT);
  private readonly theme = inject(KtTheme);

  protected readonly tokens = FOUNDATIONS_TOKENS;
  protected readonly setupSnippet = FOUNDATIONS_SETUP_SNIPPET;
  protected readonly themeSnippet = FOUNDATIONS_THEME_SNIPPET;

  /** Pastilles avec la valeur RÉSOLUE de chaque token, recalculée à chaque changement de thème. */
  protected readonly resolvedSwatches = computed(() => {
    this.theme.current();
    const styles = getComputedStyle(this.doc.documentElement);
    return FOUNDATIONS_COLOR_SWATCHES.map((swatch) => ({
      token: swatch.token,
      value: styles.getPropertyValue(swatch.token).trim() || swatch.value,
    }));
  });
}
