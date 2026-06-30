import { PropRow, TokenGroup } from '../../shared/doc-types';

/** Propriétés communes héritées de `KtBaseInputField` (cf. `base-input.ts`), partagées par les cinq
    champs Temporal. La dernière ligne (`suggestions`) vient de `KtBaseTemporalField`. */
export const TEMPORAL_COMMON_PROPS: readonly PropRow[] = [
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
    description: "Indice d'autoremplissage natif (ex. `'bday'`, `'off'`).",
  },
  {
    name: 'customDescribedBy',
    type: 'string | undefined',
    default: '',
    description: 'Force la valeur de `aria-describedby`.',
  },
  {
    name: 'suggestions',
    type: 'readonly KtSuggestion<T>[] | undefined',
    default: '',
    description: 'Suggestions via `<datalist>` natif ; le picker date/heure reste disponible.',
  },
  {
    name: 'helpClick',
    type: 'output<MouseEvent>',
    default: '',
    description: "Émis au clic sur le bouton d'aide contextuelle.",
  },
];

/** Les cinq champs : sélecteur → type de `value` (two-way, `null` = vide). Tout le reste de l'API
    est commun (cf. Propriétés communes). */
export const TEMPORAL_FIELDS_PROPS: readonly PropRow[] = [
  {
    name: 'kt-date-field',
    type: 'Temporal.PlainDate | null',
    default: 'null',
    description: 'Date civile sans heure ni fuseau (input natif `type="date"`).',
  },
  {
    name: 'kt-time-field',
    type: 'Temporal.PlainTime | null',
    default: 'null',
    description: 'Heure « au mur » sans date ni fuseau, précision minute (input natif `type="time"`).',
  },
  {
    name: 'kt-date-time-field',
    type: 'Temporal.PlainDateTime | null',
    default: 'null',
    description: 'Date + heure locale sans fuseau, précision minute (input natif `type="datetime-local"`).',
  },
  {
    name: 'kt-year-month-field',
    type: 'Temporal.PlainYearMonth | null',
    default: 'null',
    description: 'Mois + année sans jour ni fuseau, ex. expiration de carte (input natif `type="month"`).',
  },
  {
    name: 'kt-instant-field',
    type: 'Temporal.Instant | null',
    default: 'null',
    description: 'Instant absolu (UTC), saisi/affiché en heure locale via `KtClock` (input `type="datetime-local"`).',
  },
];

/** Propriété propre aux champs porteurs d'heure (`kt-time-field`, `kt-date-time-field`,
    `kt-instant-field`), définie sur `KtBaseTimeTemporalField`. */
export const TEMPORAL_TIME_PROPS: readonly PropRow[] = [
  {
    name: 'precision',
    type: `'minute' | 'second'`,
    default: `'minute'`,
    description:
      "Précision de l'heure : `'second'` affiche le sélecteur de secondes (`step=1`) et conserve les secondes à la sérialisation. Sans effet sur `kt-date-field` / `kt-year-month-field`.",
  },
];

/** Pipe d'affichage et service d'horloge (cf. `temporal-date.pipe.ts`, `clock.ts`). */
export const TEMPORAL_UTILS_PROPS: readonly PropRow[] = [
  {
    name: 'temporalDate',
    type: '(value, options?: Intl.DateTimeFormatOptions) => string',
    default: '',
    description: 'Pipe : formate une valeur Temporal selon `LOCALE_ID` (un `Instant` est rendu en zone locale).',
  },
  {
    name: 'KtClock.now()',
    type: '() => Temporal.Instant',
    default: '',
    description: "Instant courant (UTC). Point d'injection unique des lectures temporelles, testable.",
  },
  {
    name: 'KtClock.today()',
    type: '() => Temporal.PlainDate',
    default: '',
    description: 'Date du jour dans le fuseau local.',
  },
  {
    name: 'KtClock.timeZoneId()',
    type: '() => string',
    default: '',
    description: "Identifiant IANA du fuseau local (ex. `'Europe/Paris'`).",
  },
];

/** Tokens CSS du système `.kt-field-box`, partagés par tous les champs (aucun token propre au
    Temporal), groupés selon `forms/styles/tokens.css`. */
export const TEMPORAL_TOKENS: readonly TokenGroup[] = [
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
export const TEMPORAL_TS_SNIPPET = `import { Component, signal } from '@angular/core';
import {
  KtDateField,
  KtYearMonthField,
  KtInstantField,
  KtTemporalDatePipe,
  type TemporalNamespace,
} from '@ktortu/aaa/forms';

// 'temporal-polyfill/global' importé dans main.ts → \`Temporal\` global disponible.

@Component({
  imports: [KtDateField, KtYearMonthField, KtInstantField, KtTemporalDatePipe],
  // ...
})
export class MyComponent {
  protected readonly birthDate = signal<TemporalNamespace.PlainDate | null>(
    Temporal.PlainDate.from('1990-05-15'),
  );
  protected readonly cardExpiry = signal<TemporalNamespace.PlainYearMonth | null>(null);
  protected readonly recordedAt = signal<TemporalNamespace.Instant | null>(null);
}`;

export const TEMPORAL_HTML_SNIPPET = `<!-- Date civile (valeur Temporal.PlainDate) -->
<kt-date-field label="Date de naissance" [(value)]="birthDate" />

<!-- Mois / année (ex. expiration de carte) -->
<kt-year-month-field label="Expiration" [(value)]="cardExpiry" [clearable]="true" />

<!-- Instant absolu : saisi/affiché en heure locale, stocké en UTC -->
<kt-instant-field label="Horodatage" [(value)]="recordedAt" hint="Heure locale, stockée en UTC." />

<!-- Précision seconde (champs avec heure) : affiche et conserve les secondes -->
<kt-instant-field label="Horodatage précis" [(value)]="recordedAt" precision="second" />

<!-- Affichage formaté via le pipe (locale active) -->
<p>Né le {{ birthDate() | temporalDate:{ dateStyle: 'full' } }}</p>`;
