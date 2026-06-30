import { PropRow, TokenGroup } from '../../shared/doc-types';

/** Inputs propres à `kt-multi-select` (en plus du socle partagé `KtBaseSelect`).
    `clearable` et `selectionActions` portent `booleanAttribute` (attribut nu accepté) ; les autres
    booléens hérités (`disabled`, `readonly`, `filterable`…) exigent une liaison de propriété. */
export const MULTI_SELECT_PROPS: readonly PropRow[] = [
  {
    name: 'value',
    type: 'V[]',
    default: '[]',
    description: "Valeurs sélectionnées (two-way `[(value)]`), dans l'ordre de sélection.",
  },
  {
    name: 'clearable',
    type: 'boolean',
    default: 'false',
    description: 'Bouton « tout effacer » (×) sur le champ. Porte `booleanAttribute`.',
  },
  {
    name: 'clearLabel',
    type: 'string',
    default: `'Clear' (KT_FIELD_CONFIG)`,
    description: 'Libellé accessible du bouton « tout effacer ».',
  },
  {
    name: 'selectionActions',
    type: 'boolean',
    default: 'false',
    description: 'Barre « Tout sélectionner / Tout effacer » en tête du popup. Porte `booleanAttribute`.',
  },
  {
    name: 'maxVisibleChips',
    type: 'number',
    default: 'illimité',
    description: 'Nombre de chips affichés avant repli derrière un bouton « +N de plus ».',
  },
  {
    name: 'selectionChange',
    type: 'output<{ value, options }>',
    default: '—',
    description: 'Émis à chaque (dé)sélection (`value` = clés/objets, `options` = objets correspondants).',
  },
];

/** Inputs partagés avec `kt-select` (hérités de `KtBaseSelect`). */
export const MULTI_SELECT_COMMON_PROPS: readonly PropRow[] = [
  {
    name: 'options',
    type: 'readonly T[]',
    default: '— (requis)',
    description: 'Source de vérité : liste des options affichées.',
  },
  {
    name: 'optionLabel',
    type: 'keyof T | ((o: T) => string)',
    default: 'label / name / String(o)',
    description: "Libellé affiché d'une option : clé ou fonction.",
  },
  {
    name: 'optionValue',
    type: 'keyof T | ((o: T) => V)',
    default: 'undefined',
    description: "Dérive les valeurs émises ET l'identité. Omis → les valeurs sont les objets entiers.",
  },
  {
    name: 'optionDisabled',
    type: 'keyof T | ((o: T) => boolean)',
    default: 'undefined',
    description: 'Désactivation par option : clé ou prédicat.',
  },
  {
    name: 'compareWith',
    type: '(a: T, b: T) => boolean',
    default: 'identité (id / value)',
    description: 'Égalité des options en mode objet (présélection).',
  },
  {
    name: 'filterable',
    type: 'boolean',
    default: 'false',
    description: 'Champ de recherche en tête du popup (bascule en panneau dialog).',
  },
  {
    name: 'maxVisibleOptions',
    type: 'number',
    default: '100',
    description: "Nombre maximal d'options rendues dans le DOM en mode filtrable.",
  },
  {
    name: 'label',
    type: 'string',
    default: 'undefined',
    description: 'Libellé du champ (rendu par `Field`).',
  },
  {
    name: 'hint',
    type: 'string',
    default: 'undefined',
    description: "Texte d'aide affiché sous le champ quand il est valide.",
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: 'Champ désactivé (liaison de propriété requise).',
  },
  {
    name: 'readonly',
    type: 'boolean',
    default: 'false',
    description: 'Lecture seule : sélection figée, chips non révocables.',
  },
  {
    name: 'required',
    type: 'boolean',
    default: 'false',
    description: 'Champ obligatoire (marqueur visuel + ARIA).',
  },
  {
    name: 'invalid',
    type: 'boolean',
    default: 'false',
    description: "Pilote l'affichage des erreurs (avec `touched` / `errorMatcher`).",
  },
  {
    name: 'errors',
    type: 'ValidationError[]',
    default: '[]',
    description: 'Erreurs de validation à afficher.',
  },
];

/** Tokens CSS de `kt-multi-select` : socle du panneau (partagé avec `kt-select`) + chips révocables. */
export const MULTI_SELECT_TOKENS: readonly TokenGroup[] = [
  {
    title: 'Panneau & options (partagés avec kt-select)',
    tokens: [
      { name: '--select-popup-bg', default: 'var(--kt-surface, #fff)', description: 'Fond du panneau flottant.' },
      { name: '--select-popup-shadow', default: '0 4px 12px rgb(0 0 0 / 12%)', description: 'Ombre du panneau.' },
      { name: '--select-popup-max-height', default: '16rem', description: 'Hauteur max. avant scroll de la liste.' },
      { name: '--select-option-min-height', default: '44px', description: "Hauteur min. d'une option (AAA)." },
      {
        name: '--select-option-selected-bg',
        default: 'color-mix(… primary 14%)',
        description: "Fond de l'option cochée.",
      },
      {
        name: '--select-option-hover-bg',
        default: 'color-mix(… currentColor 8%)',
        description: "Fond de l'option survolée/active.",
      },
    ],
  },
  {
    title: 'Boîte du trigger (hérités des champs)',
    tokens: [
      {
        name: '--field-width',
        default: 'auto',
        description: 'Largeur du champ (ex. `320px`). Voir la page Formulaires.',
      },
      { name: '--field-radius', default: 'var(--kt-control-radius)', description: 'Rayon de la boîte du trigger.' },
      {
        name: '--field-min-height',
        default: 'var(--kt-control-height)',
        description: 'Hauteur min. (cible tactile AAA).',
      },
      {
        name: '--field-icon-color',
        default: 'var(--kt-muted)',
        description: 'Couleur du chevron, de la croix et des checkboxes.',
      },
    ],
  },
  {
    title: 'Chips révocables (sélection)',
    tokens: [
      { name: '--chip-radius', default: '50px', description: 'Rayon des chips.' },
      { name: '--chip-bg', default: 'color-mix(… primary 10%)', description: "Fond d'un chip." },
      { name: '--chip-bg-hover', default: 'color-mix(… primary 18%)', description: "Fond d'un chip survolé." },
      { name: '--chip-border', default: 'color-mix(… primary 20%)', description: "Bordure d'un chip." },
      { name: '--chip-color', default: 'var(--field-color)', description: "Couleur du texte d'un chip." },
      {
        name: '--chip-remove-color',
        default: 'var(--field-icon-color)',
        description: 'Couleur du bouton « retirer ».',
      },
      {
        name: '--chip-remove-color-hover',
        default: 'var(--kt-danger)',
        description: 'Couleur du « retirer » au survol.',
      },
      { name: '--chip-font-size', default: '0.875rem', description: 'Taille de police des chips.' },
    ],
  },
  {
    title: 'Bottom-sheet (téléphone)',
    tokens: [
      { name: '--kt-sheet-radius', default: '16px', description: 'Rayon des coins hauts de la feuille.' },
      { name: '--kt-sheet-max-block-size', default: '85svh', description: 'Hauteur max. de la feuille.' },
      { name: '--kt-sheet-anim-duration', default: '120ms', description: "Durée du glissement d'entrée + scrim." },
      { name: '--kt-sheet-scrim', default: 'rgb(0 0 0 / 40%)', description: "Voile d'assombrissement du fond." },
      {
        name: '--kt-sheet-grab-color',
        default: 'var(--kt-outline)',
        description: 'Couleur de la poignée de glissement.',
      },
    ],
  },
];

/** Extrait d'import + état du composant. */
export const MULTI_SELECT_TS_SNIPPET = `import { Component, signal } from '@angular/core';
import { KtMultiSelect } from '@ktortu/aaa/forms';

@Component({
  imports: [KtMultiSelect],
  // ...
})
export class MyComponent {
  protected readonly tags = ['Angular', 'TypeScript', 'RxJS', 'Signals', 'CSS', 'A11y'];
  protected readonly selectedTags = signal<string[]>(['Angular', 'Signals']);

  protected readonly skills = [
    { id: 1, name: 'Accessibilité' },
    { id: 2, name: 'Design system' },
  ];
  protected readonly selectedSkillIds = signal<number[]>([]);
}`;

export const MULTI_SELECT_HTML_SNIPPET = `<!-- Options simples (valeurs = chaînes) -->
<kt-multi-select label="Compétences" [options]="tags" [(value)]="selectedTags" />

<!-- Options objets : clés extraites via optionValue -->
<kt-multi-select
  label="Compétences"
  [options]="skills"
  optionLabel="name"
  optionValue="id"
  [(value)]="selectedSkillIds"
/>

<!-- Bouton « tout effacer » (booléen avec booleanAttribute → attribut nu) -->
<kt-multi-select label="Compétences" [options]="tags" [(value)]="selectedTags" clearable />

<!-- Filtre + actions de masse + repli des chips -->
<kt-multi-select
  label="Compétences"
  [options]="tags"
  [(value)]="selectedTags"
  [filterable]="true"
  selectionActions
  [maxVisibleChips]="2"
/>

<!-- Template de chip personnalisé -->
<kt-multi-select [options]="tags" [(value)]="selectedTags">
  <ng-template [ktMultiSelectChip]="tags" let-tag let-remove="remove">
    <kt-chip [removable]="true" (remove)="remove()">{{ tag }}</kt-chip>
  </ng-template>
</kt-multi-select>`;
