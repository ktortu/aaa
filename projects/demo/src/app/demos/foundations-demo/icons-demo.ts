import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocSection } from '../../shared/doc-section/doc-section';
import { DocExample } from '../../shared/example/example';
import { CodeBlock } from '../../shared/code-block/code-block';
import { KtButton } from '@ktortu/aaa/button';
import { KtTextField } from '@ktortu/aaa/forms';
import { FOUNDATIONS_ICONS_SNIPPET } from './foundations-demo.data';

@Component({
  selector: 'kt-icons-demo',
  imports: [DocSection, DocExample, CodeBlock, KtButton, KtTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './foundations-demo.css',
  template: `
    <article class="page">
      <header class="page__head">
        <p class="page__eyebrow">Fondations</p>
        <h1 class="page__title">Gestion des icônes</h1>
        <p class="page__lead">
          Fonctionnement par défaut (ligatures), personnalisation par variables CSS ou intégration libre d'autres sets
          d'icônes.
        </p>
      </header>

      <kt-doc-section
        title="Rendu vivant & intégration"
        subtitle="Démonstration des différents modes d'affichage des icônes."
      >
        <p class="page__lead">
          Par défaut, les icônes de la librairie s'affichent par ligatures CSS (Material Symbols Outlined). Cependant,
          vous pouvez configurer une autre police d'icônes à ligatures ou projeter directement vos propres icônes (ex.
          Font Awesome, SVG) sans utiliser la propriété <code>icon</code>.
        </p>

        <kt-doc-example label="Sur des boutons" style="--example-align-items: center;">
          <button ktButton icon="download">Télécharger (Ligature)</button>

          <button ktButton>
            <i class="fa-solid fa-download"></i>
            Télécharger (Projeté)
          </button>

          <button ktButton iconOnly ariaLabel="Fermer (Projeté)">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </kt-doc-example>
        <kt-doc-example label="Sur des champs" style="--example-align-items: center;">
          <kt-text-field label="Recherche (Ligature)" icon="search" />
          <kt-text-field label="Lien de profil (Projeté)" [prefix]="faIcon">
            <ng-template #faIcon>
              <i class="fa-solid fa-user" style="color: var(--field-icon-color)"></i>
            </ng-template>
          </kt-text-field>
        </kt-doc-example>

        <kt-doc-code language="html" [code]="iconsSnippet" />
      </kt-doc-section>
    </article>
  `,
})
export class IconsDemo {
  protected readonly iconsSnippet = FOUNDATIONS_ICONS_SNIPPET;
}
