import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocSection } from '../../shared/doc-section/doc-section';
import { DocExample } from '../../shared/example/example';
import { CodeBlock } from '../../shared/code-block/code-block';
import { KtButton } from '@ktortu/aaa/button';
import { KtTextField } from '@ktortu/aaa/forms';
import { KtIcon, provideKtIcon } from '@ktortu/aaa/icon';

/**
 * Registre de polices de la démo : UNE source qui type ET fournit les alias (recette d'autocomplétion).
 * Les deux polices sont chargées dans `index.html` (Material Symbols Outlined + Rounded).
 */
export const ICONS_DEMO_FONTS = {
  outlined: { family: 'Material Symbols Outlined' },
  rounded: { family: 'Material Symbols Rounded', variationSettings: "'FILL' 0, 'wght' 400" },
} as const;

// Augmente le registre : l'input [font] s'autocomplète en 'outlined' | 'rounded' dans ce projet.
declare module '@ktortu/aaa/icon' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface KtIconFontRegistry extends Record<keyof typeof ICONS_DEMO_FONTS, unknown> {}
}

@Component({
  selector: 'kt-icons-demo',
  imports: [DocSection, DocExample, CodeBlock, KtButton, KtTextField, KtIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './foundations-demo.css',
  providers: [provideKtIcon({ fonts: ICONS_DEMO_FONTS, defaultFont: 'outlined' })],
  template: `
    <article class="page">
      <header class="page__head">
        <p class="page__eyebrow">Fondations</p>
        <h1 class="page__title">Gestion des icônes</h1>
        <p class="page__lead">
          Deux familles de polices, un seul réflexe. Les polices à <strong>ligatures</strong> (le nom devient le glyphe,
          ex. Material Symbols) et les polices à <strong>classes</strong> (une classe CSS rend le glyphe, ex. Font
          Awesome). La primitive <code>[ktIcon]</code> couvre les deux, seule ou dans un bouton / un champ. Chaque
          exemple ci-dessous est suivi de son code.
        </p>
      </header>

      <!-- ============================ LIGATURE AUTONOME ============================ -->
      <kt-doc-section
        title="Icône autonome — ligature"
        subtitle="Une icône seule, là où le bouton et les champs ne suffisent pas. Le nom devient le glyphe."
      >
        <p class="page__lead">
          Posez <code>[ktIcon]</code> sur un élément et donnez-lui un nom. La couleur suit le texte
          (<code>currentColor</code>), la taille se règle avec <code>size</code>.
        </p>

        <kt-doc-example label="Quelques icônes (police par défaut : Material Symbols Outlined)">
          <span ktIcon="home"></span>
          <span ktIcon="search"></span>
          <span ktIcon="favorite"></span>
          <span ktIcon="settings"></span>
          <span ktIcon="delete"></span>
          <span ktIcon="calendar_month"></span>
        </kt-doc-example>
        <kt-doc-code language="html" [code]="basicSnippet" />

        <kt-doc-example label="Taille — attribut size (longueur CSS)" style="--example-align-items: baseline;">
          <span ktIcon="favorite" size="1rem"></span>
          <span ktIcon="favorite" size="1.5rem"></span>
          <span ktIcon="favorite" size="2rem"></span>
          <span ktIcon="favorite" size="3rem"></span>
        </kt-doc-example>
        <kt-doc-code language="html" [code]="sizeSnippet" />

        <kt-doc-example label="Couleur — héritée du texte (currentColor)">
          <span ktIcon="circle"></span>
          <span ktIcon="circle" style="color: var(--kt-primary)"></span>
          <span ktIcon="circle" style="color: var(--kt-danger)"></span>
          <span ktIcon="circle" style="color: var(--kt-success)"></span>
        </kt-doc-example>
        <kt-doc-code language="html" [code]="colorSnippet" />

        <kt-doc-example label="Rempli ou contour — attribut fill (polices variables)">
          <button ktButton mode="text" (click)="isFavorite = !isFavorite">
            <span
              ktIcon="favorite"
              [fill]="isFavorite"
              size="1.5rem"
              [style.color]="isFavorite ? 'var(--kt-danger)' : 'currentColor'"
            ></span>
            Favori
          </button>
          <button ktButton mode="text" (click)="isRating = !isRating">
            <span
              ktIcon="star"
              [fill]="isRating"
              size="1.5rem"
              [style.color]="isRating ? 'var(--kt-warning)' : 'currentColor'"
            ></span>
            Note
          </button>
        </kt-doc-example>
        <kt-doc-code language="html" [code]="fillSnippet" />
      </kt-doc-section>

      <!-- ============================ CHOIX DE POLICE ============================ -->
      <kt-doc-section
        title="Choisir la police — registre + [font]"
        subtitle="Déclarez vos polices une fois (provider), choisissez-les par alias, avec autocomplétion typée."
      >
        <p class="page__lead">
          Enregistrez vos polices via <code>provideKtIcon</code> et sélectionnez-les par alias. Ici, la même icône en
          <em>outlined</em> (défaut) puis en <em>rounded</em>.
        </p>

        <kt-doc-example label="Même icône, deux polices (coins francs → la différence saute aux yeux)">
          <span style="display: inline-flex; flex-direction: column; align-items: center; gap: 0.35rem;">
            <span ktIcon="dashboard" size="2.75rem"></span>
            <small style="color: var(--kt-muted)">outlined (défaut)</small>
          </span>
          <span style="display: inline-flex; flex-direction: column; align-items: center; gap: 0.35rem;">
            <span ktIcon="dashboard" font="rounded" size="2.75rem"></span>
            <small style="color: var(--kt-muted)">rounded</small>
          </span>
          <span style="display: inline-flex; flex-direction: column; align-items: center; gap: 0.35rem;">
            <span ktIcon="chat" size="2.75rem"></span>
            <small style="color: var(--kt-muted)">outlined</small>
          </span>
          <span style="display: inline-flex; flex-direction: column; align-items: center; gap: 0.35rem;">
            <span ktIcon="chat" font="rounded" size="2.75rem"></span>
            <small style="color: var(--kt-muted)">rounded</small>
          </span>
        </kt-doc-example>
        <kt-doc-code language="html" [code]="fontSnippet" />

        <p class="page__lead">
          La mise en place, à source unique (le même objet type <strong>et</strong> fournit le registre) — l'input
          <code>[font]</code> s'autocomplète alors, avec repli gracieux sur chaîne libre si le registre n'est pas
          augmenté :
        </p>
        <kt-doc-code language="ts" [code]="registrySnippet" />
      </kt-doc-section>

      <!-- ============================ SET À CLASSES (PROJECTION) ============================ -->
      <kt-doc-section
        title="Icône autonome — set à classes (Font Awesome, SVG…)"
        subtitle="Une police à classes ne se pilote pas par un nom : on projette le markup, la primitive l'habille."
      >
        <p class="page__lead">
          Laissez <code>ktIcon</code> vide et projetez votre markup. La primitive gère la taille (<code>size</code>),
          l'alignement et la couleur héritée — exactement comme pour une ligature.
        </p>

        <kt-doc-example label="Font Awesome, projeté">
          <span ktIcon><i class="fa-solid fa-user"></i></span>
          <span ktIcon><i class="fa-solid fa-heart" style="color: var(--kt-danger)"></i></span>
          <span ktIcon><i class="fa-brands fa-github"></i></span>
          <span ktIcon><i class="fa-solid fa-download" style="color: var(--kt-primary)"></i></span>
        </kt-doc-example>
        <kt-doc-code language="html" [code]="faSnippet" />

        <kt-doc-example label="Taille — size pilote aussi le contenu projeté" style="--example-align-items: baseline;">
          <span ktIcon size="1rem"><i class="fa-solid fa-star"></i></span>
          <span ktIcon size="1.5rem"><i class="fa-solid fa-star"></i></span>
          <span ktIcon size="2rem"><i class="fa-solid fa-star"></i></span>
          <span ktIcon size="3rem"><i class="fa-solid fa-star"></i></span>
        </kt-doc-example>
        <kt-doc-code language="html" [code]="faSizeSnippet" />

        <kt-doc-example label="SVG en ligne, projeté">
          <span ktIcon size="2rem" style="color: var(--kt-primary)">
            <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2 L2 7 l10 5 l10 -5 z M2 17 l10 5 l10 -5 M2 12 l10 5 l10 -5" />
            </svg>
          </span>
        </kt-doc-example>
        <kt-doc-code language="html" [code]="svgSnippet" />
      </kt-doc-section>

      <!-- ============================ ACCESSIBILITÉ ============================ -->
      <kt-doc-section
        title="Décorative ou porteuse de sens"
        subtitle="Décorative par défaut (aria-hidden). Un [ariaLabel] rend l'icône annoncée (role=img)."
      >
        <p class="page__lead">
          Une icône posée à côté d'un texte reste <strong>décorative</strong> (masquée aux lecteurs d'écran, pour éviter
          la redite). Une icône <strong>seule et porteuse de sens</strong> reçoit un <code>ariaLabel</code> : elle
          devient un <code>role="img"</code> nommé.
        </p>

        <kt-doc-example label="Décorative (à côté d'un texte) vs porteuse de sens (icône seule)">
          <span style="display: inline-flex; align-items: center; gap: 0.4rem;">
            <span ktIcon="download"></span> Télécharger
          </span>
          <span style="display: inline-flex; align-items: center; gap: 0.4rem; color: var(--kt-success);">
            <span ktIcon="check_circle"></span> Terminé
          </span>
          <span ktIcon="warning" ariaLabel="Attention" style="color: var(--kt-danger)"></span>
        </kt-doc-example>
        <kt-doc-code language="html" [code]="a11ySnippet" />
      </kt-doc-section>

      <!-- ============================ DANS LES BOUTONS ============================ -->
      <kt-doc-section
        title="Dans les boutons"
        subtitle="Rappel : le bouton porte sa propre API icon (ligature) et accepte aussi le contenu projeté (classe)."
      >
        <kt-doc-example label="Ligature (attribut icon) vs classe (projetée)" style="--example-align-items: center;">
          <button ktButton icon="download">Télécharger (ligature)</button>
          <button ktButton>
            <i class="fa-solid fa-download"></i>
            Télécharger (classe)
          </button>
          <button ktButton iconOnly ariaLabel="Fermer">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </kt-doc-example>
        <kt-doc-code language="html" [code]="buttonSnippet" />
      </kt-doc-section>

      <!-- ============================ DANS LES CHAMPS ============================ -->
      <kt-doc-section
        title="Dans les champs"
        subtitle="Ligature via l'attribut icon ; set à classes via un template de préfixe / suffixe."
      >
        <kt-doc-example label="Ligature vs classe" style="--example-align-items: center;">
          <kt-text-field label="Recherche (ligature)" icon="search" />
          <kt-text-field label="Profil (classe)" [prefix]="faUser">
            <ng-template #faUser>
              <i class="fa-solid fa-user" style="color: var(--field-icon-color)"></i>
            </ng-template>
          </kt-text-field>
        </kt-doc-example>
        <kt-doc-code language="html" [code]="fieldSnippet" />
      </kt-doc-section>
    </article>
  `,
})
export class IconsDemo {
  isFavorite = false;
  isRating = false;

  protected readonly basicSnippet = `<span ktIcon="home"></span>
<span ktIcon="search"></span>
<span ktIcon="favorite"></span>
<span ktIcon="settings"></span>`;

  protected readonly sizeSnippet = `<span ktIcon="favorite" size="1rem"></span>
<span ktIcon="favorite" size="1.5rem"></span>
<span ktIcon="favorite" size="2rem"></span>
<span ktIcon="favorite" size="3rem"></span>`;

  protected readonly colorSnippet = `<!-- La couleur suit le texte courant (currentColor). -->
<span ktIcon="circle"></span>
<span ktIcon="circle" style="color: var(--kt-primary)"></span>
<span ktIcon="circle" style="color: var(--kt-danger)"></span>`;

  protected readonly fillSnippet = `<!-- Contour par défaut ; ajoutez fill pour la version remplie
     (axe FILL des polices variables — Material Symbols). Les autres axes sont préservés. -->
<button ktButton mode="text" (click)="isFavorite = !isFavorite">
  <span ktIcon="favorite" [fill]="isFavorite"
        [style.color]="isFavorite ? 'var(--kt-danger)' : 'currentColor'"></span>
  Favori
</button>`;

  protected readonly fontSnippet = `<!-- Police par défaut (outlined) vs police enregistrée (rounded). -->
<span ktIcon="dashboard"></span>
<span ktIcon="dashboard" font="rounded"></span>`;

  protected readonly registrySnippet = `// app-icons.ts — UNE seule source : cet objet TYPE et FOURNIT le registre.
export const APP_ICON_FONTS = {
  outlined: { family: 'Material Symbols Outlined' },
  rounded: { family: 'Material Symbols Rounded', variationSettings: "'FILL' 0, 'wght' 400" },
} as const;

// Augmente le registre → [font] s'autocomplète ('outlined' | 'rounded') dans les templates.
declare module '@ktortu/aaa/icon' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface KtIconFontRegistry extends Record<keyof typeof APP_ICON_FONTS, unknown> {}
}

// app.config.ts — fournit le registre + la police par défaut (typo de defaultFont = erreur TS).
import { provideKtIcon } from '@ktortu/aaa/icon';
providers: [provideKtIcon({ fonts: APP_ICON_FONTS, defaultFont: 'outlined' })];`;

  protected readonly faSnippet = `<!-- Set à classes : ktIcon reste VIDE, on projette le markup. -->
<span ktIcon><i class="fa-solid fa-user"></i></span>
<span ktIcon><i class="fa-brands fa-github"></i></span>`;

  protected readonly faSizeSnippet = `<!-- size pilote aussi le contenu projeté. -->
<span ktIcon size="1rem"><i class="fa-solid fa-star"></i></span>
<span ktIcon size="2rem"><i class="fa-solid fa-star"></i></span>
<span ktIcon size="3rem"><i class="fa-solid fa-star"></i></span>`;

  protected readonly svgSnippet = `<!-- SVG en ligne projeté (currentColor). -->
<span ktIcon size="2rem" style="color: var(--kt-primary)">
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none"
       stroke="currentColor" stroke-width="2"> … </svg>
</span>`;

  protected readonly a11ySnippet = `<!-- Décorative (à côté d'un texte) : par défaut, aria-hidden. -->
<span ktIcon="download"></span> Télécharger

<!-- Porteuse de sens (icône SEULE, sans texte redondant) : ariaLabel → role="img". -->
<span ktIcon="warning" ariaLabel="Attention"></span>`;

  protected readonly buttonSnippet = `<!-- Ligature (attribut icon) vs classe (projetée dans le bouton). -->
<button ktButton icon="download">Télécharger</button>
<button ktButton><i class="fa-solid fa-download"></i> Télécharger</button>
<button ktButton iconOnly ariaLabel="Fermer"><i class="fa-solid fa-xmark"></i></button>`;

  protected readonly fieldSnippet = `<!-- Ligature (attribut icon) vs classe (template de préfixe). -->
<kt-text-field label="Recherche" icon="search" />
<kt-text-field label="Profil" [prefix]="faUser">
  <ng-template #faUser><i class="fa-solid fa-user"></i></ng-template>
</kt-text-field>`;
}
