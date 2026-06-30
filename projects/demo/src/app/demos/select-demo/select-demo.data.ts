import { PropRow, TokenGroup } from '../../shared/doc-types';

/** Inputs/outputs publics de `kt-select` (hérités de `KtBaseSelect` + propres au single).
    Les inputs booléens n'ont PAS de `booleanAttribute` → liaison de propriété requise (`[disabled]="true"`). */
export const SELECT_PROPS: readonly PropRow[] = [
  {
    name: 'options',
    type: 'readonly T[]',
    default: '— (requis)',
    description: 'Source de vérité : liste des options affichées.',
  },
  {
    name: 'value',
    type: 'V | null',
    default: 'null',
    description: 'Valeur sélectionnée (two-way `[(value)]`). Clé extraite si `optionValue`, sinon objet entier.',
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
    description: "Dérive la valeur émise ET l'identité. Omis → la `value` est l'objet entier.",
  },
  {
    name: 'optionDisabled',
    type: 'keyof T | ((o: T) => boolean)',
    default: 'undefined',
    description: 'Désactivation par option : clé ou prédicat. Défaut : aucune désactivée.',
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
    description: 'Affiche un champ de recherche en tête du popup (listes longues).',
  },
  {
    name: 'filterFn',
    type: '(option: T, query: string) => boolean',
    default: 'libellé, insensible casse/accents',
    description: 'Prédicat de filtre personnalisé.',
  },
  {
    name: 'maxVisibleOptions',
    type: 'number',
    default: '100',
    description: "Nombre maximal d'options rendues dans le DOM en mode filtrable.",
  },
  {
    name: 'placeholder',
    type: 'string',
    default: 'KT_SELECT_CONFIG.placeholder',
    description: "Texte affiché quand rien n'est sélectionné.",
  },
  {
    name: 'filterPlaceholder',
    type: 'string',
    default: 'KT_SELECT_CONFIG.filterPlaceholder',
    description: 'Placeholder du champ de recherche du popup.',
  },
  {
    name: 'filterLabel',
    type: 'string',
    default: `'Filter options'`,
    description: 'Libellé accessible (aria-label) du champ de recherche.',
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
    name: 'helpText',
    type: 'string | TemplateRef',
    default: 'undefined',
    description: 'Aide contextuelle riche rendue dans une infobulle.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: 'Champ désactivé (trigger inerte). Poussé par `[formField]`.',
  },
  {
    name: 'readonly',
    type: 'boolean',
    default: 'false',
    description: 'Lecture seule : sélection figée, valeur affichée.',
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
    name: 'touched',
    type: 'boolean',
    default: 'false',
    description: 'Champ visité (two-way). Passe à `true` à la première sélection.',
  },
  {
    name: 'errors',
    type: 'ValidationError[]',
    default: '[]',
    description: 'Erreurs de validation à afficher.',
  },
  {
    name: 'errorMatcher',
    type: 'KtFieldErrorMatcher',
    default: 'invalid && touched',
    description: "Quand afficher l'erreur ; surcharge KT_FIELD_CONFIG.",
  },
  {
    name: 'id',
    type: 'string',
    default: 'auto-généré',
    description: 'id imposé (sélecteurs de test stables).',
  },
  {
    name: 'selectionChange',
    type: 'output<{ value, option }>',
    default: '—',
    description: 'Émis à chaque sélection (`value` = clé/objet, `option` = objet ou `null`).',
  },
  {
    name: 'helpClick',
    type: 'output<MouseEvent>',
    default: '—',
    description: "Émis au clic sur le bouton d'aide contextuelle.",
  },
];

/** Tokens CSS de `kt-select` (panneau partagé `styles/select-panel.css` + boîte de champ héritée). */
export const SELECT_TOKENS: readonly TokenGroup[] = [
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
      { name: '--field-border-color', default: 'var(--kt-outline)', description: 'Couleur de bordure de la boîte.' },
      { name: '--field-bg', default: 'var(--kt-surface)', description: 'Fond de la boîte du trigger.' },
      { name: '--field-icon-color', default: 'var(--kt-muted)', description: 'Couleur du chevron et des icônes.' },
    ],
  },
  {
    title: 'Popup (dropdown desktop)',
    tokens: [
      { name: '--select-popup-bg', default: 'var(--kt-surface, #fff)', description: 'Fond du panneau flottant.' },
      { name: '--select-popup-shadow', default: '0 4px 12px rgb(0 0 0 / 12%)', description: 'Ombre du panneau.' },
      {
        name: '--select-popup-border-width',
        default: 'var(--field-border-width, 1px)',
        description: 'Bordure du popup (utile si les champs passent en underline).',
      },
      { name: '--select-popup-max-height', default: '16rem', description: 'Hauteur max. avant scroll de la liste.' },
      {
        name: '--select-popup-backdrop-filter',
        default: 'none',
        description: 'Effet de flou (verre) — non déclaré par défaut.',
      },
      {
        name: '--select-popup-enter-animation',
        default: 'none',
        description: "Animation d'entrée du dropdown (transform/opacity/filter uniquement).",
      },
    ],
  },
  {
    title: 'Chevron & options',
    tokens: [
      {
        name: '--select-arrow-transition',
        default: 'transform 120ms ease',
        description: "Rotation du chevron à l'ouverture.",
      },
      {
        name: '--select-option-min-height',
        default: '44px',
        description: "Hauteur min. d'une option (cible tactile AAA).",
      },
      {
        name: '--select-option-selected-bg',
        default: 'color-mix(… primary 14%)',
        description: "Fond de l'option sélectionnée.",
      },
      {
        name: '--select-option-selected-color',
        default: 'inherit',
        description: 'Couleur du texte sélectionné (si fond plein).',
      },
      { name: '--select-option-selected-weight', default: '600', description: "Graisse de l'option sélectionnée." },
      {
        name: '--select-option-hover-bg',
        default: 'color-mix(… currentColor 8%)',
        description: "Fond de l'option survolée/active.",
      },
    ],
  },
  {
    title: 'Bottom-sheet (téléphone)',
    tokens: [
      { name: '--kt-sheet-radius', default: '16px', description: 'Rayon des coins hauts de la feuille.' },
      { name: '--kt-sheet-shadow', default: '0 -4px 16px rgb(0 0 0 / 12%)', description: 'Ombre de la feuille.' },
      { name: '--kt-sheet-max-block-size', default: '85svh', description: 'Hauteur max. de la feuille.' },
      { name: '--kt-sheet-anim-duration', default: '120ms', description: "Durée du glissement d'entrée + scrim." },
      { name: '--kt-sheet-exit-duration', default: '90ms', description: 'Durée de la fermeture.' },
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
export const SELECT_TS_SNIPPET = `import { Component, signal } from '@angular/core';
import { KtSelect } from '@ktortu/aaa/forms';

@Component({
  imports: [KtSelect],
  // ...
})
export class MyComponent {
  protected readonly countries = ['France', 'Belgique', 'Suisse', 'Canada'];
  protected readonly country = signal<string | null>(null);

  protected readonly users = [
    { id: 1, name: 'Ada Lovelace' },
    { id: 2, name: 'Alan Turing' },
  ];
  protected readonly userId = signal<number | null>(null);
}`;

export const SELECT_HTML_SNIPPET = `<!-- Options simples (valeur = chaîne) -->
<kt-select label="Pays" [options]="countries" [(value)]="country" />

<!-- Options objets : clé extraite via optionValue -->
<kt-select
  label="Responsable"
  [options]="users"
  optionLabel="name"
  optionValue="id"
  [(value)]="userId"
/>

<!-- Liste longue : champ de recherche (input booléen → liaison de propriété) -->
<kt-select label="Ville" [options]="cities" [filterable]="true" [(value)]="city" />

<!-- Template d'option personnalisé (T inféré via [ktSelectOption]) -->
<kt-select [options]="users" optionValue="id" [(value)]="userId">
  <ng-template [ktSelectOption]="users" let-user let-selected="selected">
    {{ user.name }} @if (selected) { ✓ }
  </ng-template>
</kt-select>

<!-- État désactivé -->
<kt-select label="Indisponible" [options]="countries" [disabled]="true" />`;
