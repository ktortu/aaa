import { PropRow, TokenGroup } from '../../shared/doc-types';

/** Propriétés communes héritées de `KtBaseInputField` (cf. `base-input.ts`). */
export const FORMS_COMMON_PROPS: readonly PropRow[] = [
  {
    name: 'label',
    type: 'string | undefined',
    default: '',
    description: 'Libellé du champ, associé au contrôle via `<label for>`.',
  },
  {
    name: 'hint',
    type: 'string | undefined',
    default: '',
    description: "Texte d'aide affiché sous le champ quand il est valide.",
  },
  {
    name: 'placeholder',
    type: 'string | undefined',
    default: '',
    description: 'Texte indicatif affiché dans le champ vide.',
  },
  {
    name: 'icon',
    type: 'string | undefined',
    default: '',
    description: 'Nom Material Symbols affiché en tête de champ.',
  },
  {
    name: 'prefix',
    type: 'string | TemplateRef',
    default: '',
    description: 'Contenu décoratif en tête de champ (texte ou template).',
  },
  {
    name: 'suffix',
    type: 'string | TemplateRef',
    default: '',
    description: 'Contenu décoratif en fin de champ (texte ou template).',
  },
  {
    name: 'clearable',
    type: 'boolean',
    default: 'false',
    description: 'Affiche un bouton « effacer » quand le champ a une valeur (seul input avec `booleanAttribute`).',
  },
  {
    name: 'clearLabel',
    type: 'string',
    default: `'Clear'`,
    description: 'Libellé a11y du bouton effacer (défaut via `KT_FIELD_CONFIG`).',
  },
  {
    name: 'helpText',
    type: 'string | TemplateRef',
    default: '',
    description: 'Aide contextuelle riche, projetée dans une infobulle.',
  },
  {
    name: 'helpLabel',
    type: 'string',
    default: `'Help'`,
    description: "Libellé a11y du bouton d'aide (défaut via `KT_FIELD_CONFIG`).",
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: 'Désactive la saisie et le focus.',
  },
  {
    name: 'readonly',
    type: 'boolean',
    default: 'false',
    description: 'Lecture seule : valeur visible, non modifiable.',
  },
  {
    name: 'required',
    type: 'boolean',
    default: 'false',
    description: "Champ requis : ajoute `aria-required` et l'astérisque.",
  },
  {
    name: 'invalid',
    type: 'boolean',
    default: 'false',
    description: "État d'erreur (fourni par la validation).",
  },
  {
    name: 'errors',
    type: 'readonly ValidationError[]',
    default: '[]',
    description: 'Erreurs à afficher : chaque `message` est rendu sous le champ.',
  },
  {
    name: 'touched',
    type: 'boolean',
    default: 'false',
    description: "Champ « visité » (two-way) ; conditionne l'affichage des erreurs.",
  },
  {
    name: 'dirty',
    type: 'boolean',
    default: 'false',
    description: 'Champ modifié depuis sa valeur initiale.',
  },
  {
    name: 'errorMatcher',
    type: 'KtFieldErrorMatcher | undefined',
    default: '',
    description: "Quand afficher l'erreur ; surcharge le défaut `invalid && touched`.",
  },
  {
    name: 'name',
    type: 'string',
    default: '',
    description: 'Attribut `name` natif du contrôle.',
  },
  {
    name: 'id',
    type: 'string | undefined',
    default: '',
    description: 'id imposé (sélecteurs de test) ; auto-généré sinon.',
  },
  {
    name: 'autocomplete',
    type: 'AutoFill | undefined',
    default: '',
    description: "Indice d'autoremplissage natif (ex. `'email'`, `'off'`).",
  },
  {
    name: 'customDescribedBy',
    type: 'string | undefined',
    default: '',
    description: 'Force la valeur de `aria-describedby`.',
  },
  {
    name: 'helpClick',
    type: 'output<MouseEvent>',
    default: '',
    description: "Émis au clic sur le bouton d'aide contextuelle.",
  },
  {
    name: 'hideLabel',
    type: 'boolean',
    default: 'false',
    description: 'Masque visuellement le label (le garde dans le DOM pour a11y).',
  },
  {
    name: 'hideErrors',
    type: 'boolean',
    default: 'false',
    description: "Masque visuellement le bloc d'erreur (le garde dans le DOM pour a11y).",
  },
];

/** Propriétés spécifiques à `KtTextField` (cf. `text-field.ts`). */
export const FORMS_TEXT_PROPS: readonly PropRow[] = [
  {
    name: 'value',
    type: 'string',
    default: `''`,
    description: 'Valeur saisie (two-way).',
  },
  {
    name: 'type',
    type: `'text' | 'email' | 'password' | 'search' | 'tel' | 'url'`,
    default: `'text'`,
    description: 'Variante HTML : pilote le `type` natif et le clavier mobile.',
  },
  {
    name: 'suggestions',
    type: 'readonly KtSuggestion<string>[] | undefined',
    default: '',
    description: "Suggestions d'autocomplétion via `<datalist>` natif (saisie libre).",
  },
];

/** Propriétés spécifiques à `KtTextArea` (cf. `text-area.ts`). */
export const FORMS_TEXTAREA_PROPS: readonly PropRow[] = [
  {
    name: 'value',
    type: 'string',
    default: `''`,
    description: 'Valeur saisie (two-way).',
  },
  {
    name: 'rows',
    type: 'number',
    default: '3',
    description: 'Hauteur initiale en lignes ; autosize CSS via `field-sizing: content`.',
  },
  {
    name: 'maxLength',
    type: 'number | undefined',
    default: '',
    description: 'Plafond de caractères (attribut `maxlength` natif).',
  },
];

/** Propriétés spécifiques à `KtNumberField` (cf. `number-field.ts`). */
export const FORMS_NUMBER_PROPS: readonly PropRow[] = [
  {
    name: 'value',
    type: 'number | null',
    default: 'null',
    description: 'Valeur (two-way) ; `null` = champ vide (jamais `NaN`).',
  },
  {
    name: 'min',
    type: 'number | undefined',
    default: '',
    description: 'Borne minimale (attribut `min` natif).',
  },
  {
    name: 'max',
    type: 'number | undefined',
    default: '',
    description: 'Borne maximale (attribut `max` natif).',
  },
  {
    name: 'step',
    type: 'number | undefined',
    default: '',
    description: "Pas d'incrément des flèches ↑/↓ (défaut effectif `1`).",
  },
  {
    name: 'suggestions',
    type: 'readonly KtSuggestion<number>[] | undefined',
    default: '',
    description: "Suggestions d'autocomplétion via `<datalist>` natif (saisie libre).",
  },
];

/** Tokens CSS partagés par les trois champs, groupés selon `forms/styles/tokens.css`. */
export const FORMS_TOKENS: readonly TokenGroup[] = [
  {
    title: 'Couleurs',
    tokens: [
      { name: '--field-color', default: 'var(--kt-on-surface)', description: 'Couleur du texte saisi.' },
      { name: '--field-bg', default: 'var(--kt-surface)', description: 'Fond du contrôle.' },
      { name: '--field-border-color', default: 'var(--kt-outline)', description: 'Bordure au repos.' },
      {
        name: '--field-border-color-hover',
        default: 'var(--kt-outline-strong)',
        description: 'Bordure au survol.',
      },
      { name: '--field-border-color-focus', default: 'var(--kt-primary)', description: 'Bordure au focus.' },
      { name: '--field-label-color', default: 'var(--kt-on-surface)', description: 'Couleur du libellé.' },
      { name: '--field-hint-color', default: 'var(--kt-muted)', description: "Couleur de l'indice et des affixes." },
      { name: '--field-error-color', default: 'var(--kt-danger)', description: "Couleur du message d'erreur." },
      { name: '--field-required-color', default: 'var(--kt-danger)', description: "Couleur de l'astérisque requis." },
      { name: '--field-icon-color', default: 'var(--kt-muted)', description: "Couleur de l'icône." },
      {
        name: '--field-disabled-bg',
        default: 'color-mix(… on-surface 6%)',
        description: 'Fond du champ désactivé.',
      },
    ],
  },
  {
    title: 'Géométrie',
    tokens: [
      {
        name: '--field-width',
        default: 'auto',
        description:
          'Largeur du champ : un seul réglage les pilote tous (remplit le conteneur en bloc, au contenu en flex).',
      },
      { name: '--field-radius', default: 'var(--kt-control-radius)', description: 'Rayon des coins.' },
      {
        name: '--field-min-height',
        default: 'var(--kt-control-height)',
        description: 'Hauteur min. (cible 44px AAA).',
      },
      {
        name: '--field-border-width',
        default: '1px',
        description: 'Largeur de bordure (1–4 longhands pour des effets « underline »).',
      },
      { name: '--field-padding-x', default: '0.75rem', description: 'Padding horizontal du contrôle.' },
      { name: '--field-padding-y', default: '0.5rem', description: 'Padding vertical du contrôle.' },
      { name: '--field-gap', default: '0.375rem', description: 'Écart label / contrôle / indice / erreur.' },
      { name: '--field-control-gap', default: '0.5rem', description: 'Écart icône / affixes dans le contrôle.' },
    ],
  },
  {
    title: 'Typographie',
    tokens: [
      { name: '--field-font-size', default: 'var(--kt-control-font)', description: 'Taille du texte saisi.' },
      { name: '--field-label-font-size', default: '0.875rem', description: 'Taille du libellé.' },
      { name: '--field-hint-font-size', default: '0.8125rem', description: "Taille de l'indice et de l'erreur." },
      { name: '--field-label-weight', default: '500', description: 'Graisse du libellé.' },
      { name: '--field-label-transform', default: 'none', description: 'Transformation du libellé (ex. `uppercase`).' },
      { name: '--field-label-letter-spacing', default: 'normal', description: 'Interlettrage du libellé.' },
    ],
  },
  {
    title: 'Focus & motion',
    tokens: [
      {
        name: '--field-focus-ring-width',
        default: 'var(--kt-focus-ring-width)',
        description: 'Largeur du halo de focus.',
      },
      {
        name: '--field-focus-ring',
        default: 'color-mix(… focus 35%)',
        description: 'Couleur translucide du halo de focus.',
      },
      { name: '--field-focus-ring-style', default: 'solid', description: 'Style du contour de focus.' },
      { name: '--field-focus-ring-offset', default: '1px', description: 'Décalage du contour de focus.' },
      { name: '--field-shadow', default: 'none', description: 'Ombre au repos.' },
      { name: '--field-shadow-hover', default: 'var(--field-shadow)', description: 'Ombre au survol.' },
      { name: '--field-shadow-focus', default: 'var(--field-shadow)', description: 'Ombre au focus.' },
      { name: '--field-transition', default: 'none', description: "Transition lors des changements d'état." },
      { name: '--field-caret-color', default: 'auto', description: 'Couleur du curseur de saisie.' },
      { name: '--field-backdrop-filter', default: 'none', description: "Filtre d'arrière-plan (effet givré)." },
      { name: '--field-error-animation', default: 'none', description: "Animation d'apparition du message d'erreur." },
    ],
  },
];

/** Extrait d'import + usage type, affiché dans la page. */
export const FORMS_TS_SNIPPET = `import { KtTextField, KtTextArea, KtNumberField } from '@ktortu/aaa/forms';

@Component({
  imports: [KtTextField, KtTextArea, KtNumberField],
  // ...
})
export class MyComponent {
  protected readonly email = signal('');
  protected readonly bio = signal('');
  protected readonly quantity = signal<number | null>(null);
}`;

export const FORMS_HTML_SNIPPET = `<!-- Champ texte (valeur string) -->
<kt-text-field label="E-mail" type="email" [(value)]="email" required />

<!-- Icône, effaçable et indice -->
<kt-text-field
  label="Recherche"
  type="search"
  icon="search"
  [clearable]="true"
  hint="Entrée pour valider"
/>

<!-- Zone de texte multi-ligne (autosize) -->
<kt-text-area label="Biographie" [(value)]="bio" [rows]="4" [maxLength]="280" />

<!-- Champ numérique (valeur number | null) -->
<kt-number-field label="Quantité" [(value)]="quantity" [min]="0" [max]="99" [step]="1" suffix="kg" />`;
