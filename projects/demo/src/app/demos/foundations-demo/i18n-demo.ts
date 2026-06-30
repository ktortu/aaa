import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocSection } from '../../shared/doc-section/doc-section';
import { CodeBlock } from '../../shared/code-block/code-block';
import { FOUNDATIONS_I18N_SNIPPET } from './foundations-demo.data';

@Component({
  selector: 'kt-i18n-demo',
  imports: [DocSection, CodeBlock],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './foundations-demo.css',
  template: `
    <article class="page">
      <header class="page__head">
        <p class="page__eyebrow">Fondations</p>
        <h1 class="page__title">Internationalisation</h1>
        <p class="page__lead">
          Traduire la librairie (neutre en anglais par défaut) en français ou dans n'importe quelle autre langue.
        </p>
      </header>

      <kt-doc-section
        title="Traductions & Configuration"
        subtitle="Lib neutre : défauts anglais, surchargeables globalement (provideKtDefaultFR / provideKtTranslations) ou par token KT_*_CONFIG."
      >
        <kt-doc-code language="ts" [code]="i18nSnippet" />
      </kt-doc-section>
    </article>
  `,
})
export class I18nDemo {
  protected readonly i18nSnippet = FOUNDATIONS_I18N_SNIPPET;
}
