import { PropRow, TokenGroup } from '../../shared/doc-types';

/** Propriétés communes au switch, à la case, au groupe de cases et au groupe radio (surface de
    contrôle de formulaire partagée + présentation). Le `kt-radio` enfant a sa propre table. */
export const CHOICE_COMMON_PROPS: readonly PropRow[] = [
  {
    name: 'label',
    type: 'string | undefined',
    default: '',
    description: 'Libellé : `<label for>` (switch, case) ou légende `aria-labelledby` (groupes).',
  },
  {
    name: 'hint',
    type: 'string | undefined',
    default: '',
    description: "Texte d'aide affiché sous le contrôle (masqué quand une erreur s'affiche).",
  },
  {
    name: 'ariaLabel',
    type: 'string | undefined',
    default: '',
    description: "Nom accessible (`aria-label`) quand aucun `label` textuel n'est fourni.",
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: 'Désactive le contrôle (attribut booléen). Sur un groupe, hérité par les enfants.',
  },
  {
    name: 'required',
    type: 'boolean',
    default: 'false',
    description: 'Astérisque + `aria-required` (attribut booléen).',
  },
  {
    name: 'invalid',
    type: 'boolean',
    default: 'false',
    description: "État d'erreur (combiné à `touched`/`dirty` via l'`errorMatcher`).",
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
    description: "Champ « modifié » (entre dans la logique d'affichage des erreurs).",
  },
  {
    name: 'errors',
    type: 'readonly ValidationError[]',
    default: '[]',
    description: 'Erreurs à afficher : chaque `message` est rendu sous le contrôle (région live).',
  },
  {
    name: 'errorMatcher',
    type: 'KtFieldErrorMatcher | undefined',
    default: '',
    description: "Quand afficher l'erreur ; surcharge le défaut (`invalid && touched`).",
  },
  {
    name: 'showAllErrors',
    type: 'boolean',
    default: 'KT_FIELD_CONFIG.showAllErrors ?? false',
    description: 'Affiche toutes les erreurs au lieu de la première seule.',
  },
  {
    name: 'name',
    type: 'string',
    default: '',
    description: 'Nom logique du contrôle (base du `name` partagé pour le groupe radio).',
  },
  {
    name: 'id',
    type: 'string | undefined',
    default: '',
    description: 'id imposé (sélecteurs de test) ; auto-généré sinon.',
  },
];

/** `kt-switch` — interrupteur à bascule (slide-toggle). */
export const CHOICE_SWITCH_PROPS: readonly PropRow[] = [
  {
    name: 'value',
    type: 'boolean',
    default: 'false',
    description: 'État de la bascule (two-way) : `true` = activé.',
  },
];

/** `kt-checkbox` — case à cocher (autonome ou enfant d\'un groupe). */
export const CHOICE_CHECKBOX_PROPS: readonly PropRow[] = [
  {
    name: 'value',
    type: 'V (boolean par défaut)',
    default: 'false',
    description: "Autonome : état coché (two-way). En groupe : la valeur d'option représentée.",
  },
  {
    name: 'indeterminate',
    type: 'boolean',
    default: 'false',
    description: 'Tri-état visuel (propriété DOM `indeterminate`) (attribut booléen).',
  },
];

/** `kt-checkbox-group` — orchestrateur à valeur tableau. */
export const CHOICE_CHECKBOX_GROUP_PROPS: readonly PropRow[] = [
  {
    name: 'value',
    type: 'V[]',
    default: '[]',
    description: "Sélection courante (two-way) : tableau des valeurs d'options cochées.",
  },
  {
    name: 'compareWith',
    type: '(a: V, b: V) => boolean | undefined',
    default: '',
    description: 'Égalité des valeurs en mode objet (défaut : identité `===`).',
  },
];

/** `kt-radio-group` — orchestrateur à valeur unique. */
export const CHOICE_RADIO_GROUP_PROPS: readonly PropRow[] = [
  {
    name: 'value',
    type: 'V | null',
    default: 'null',
    description: 'Valeur sélectionnée (two-way), ou `null` si aucune option cochée.',
  },
  {
    name: 'compareWith',
    type: '(a: V, b: V) => boolean | undefined',
    default: '',
    description: 'Égalité des valeurs en mode objet (défaut : identité `===`).',
  },
];

/** `kt-radio` — option individuelle, enfant déclaratif de `kt-radio-group`. */
export const CHOICE_RADIO_PROPS: readonly PropRow[] = [
  {
    name: 'optionValue',
    type: 'V',
    default: '(requis)',
    description: "Valeur d'option représentée (sélectionnée ⇒ devient la valeur du groupe).",
  },
  {
    name: 'label',
    type: 'string | undefined',
    default: '',
    description: 'Libellé textuel (remplacé visuellement par un contenu projeté).',
  },
  {
    name: 'hint',
    type: 'string | undefined',
    default: '',
    description: "Texte d'aide affiché sous l'option.",
  },
  {
    name: 'ariaLabel',
    type: 'string | undefined',
    default: '',
    description: 'Nom accessible pour une option sans libellé textuel.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: "Désactive ce radio (combiné à l'état du groupe) (attribut booléen).",
  },
  {
    name: 'id',
    type: 'string | undefined',
    default: '',
    description: 'id imposé ; auto-généré sinon.',
  },
];

/** Tokens CSS, groupés par composant. Couleurs et typo dérivent du socle partagé (--field-* / --kt-*) :
    rebrander --kt-primary met à jour cases, radios, switch ET champs. */
export const CHOICE_TOKENS: readonly TokenGroup[] = [
  {
    title: 'Case à cocher (--checkbox-*)',
    tokens: [
      {
        name: '--checkbox-size',
        default: '1.25rem',
        description: 'Taille de la case (`font-size` : box et coche en `em`).',
      },
      {
        name: '--checkbox-target-size',
        default: '44px',
        description: 'Hauteur min. de la rangée cliquable (cible AAA 2.5.5).',
      },
      {
        name: '--checkbox-padding',
        default: '0',
        description: 'Rembourrage de la rangée (pour bâtir une carte cliquable).',
      },
      { name: '--checkbox-radius', default: '0.25rem', description: 'Rayon des coins de la case.' },
      { name: '--checkbox-border-width', default: '2px', description: 'Épaisseur de bordure.' },
      { name: '--checkbox-border-color', default: 'var(--field-border-color)', description: 'Bordure au repos.' },
      { name: '--checkbox-bg', default: 'var(--field-bg)', description: 'Fond au repos.' },
      { name: '--checkbox-mark-color', default: '#ffffff', description: 'Couleur de la coche.' },
      { name: '--checkbox-bg-checked', default: 'var(--kt-primary)', description: 'Fond coché / indéterminé.' },
      {
        name: '--checkbox-border-color-checked',
        default: 'var(--checkbox-bg-checked)',
        description: 'Bordure cochée.',
      },
      {
        name: '--checkbox-border-color-hover',
        default: 'var(--field-border-color-hover)',
        description: 'Bordure au survol.',
      },
      {
        name: '--checkbox-bg-checked-hover',
        default: 'color-mix(primaire 90%, noir)',
        description: 'Fond coché au survol.',
      },
      { name: '--checkbox-focus-ring-offset', default: '2px', description: "Décalage de l'anneau de focus." },
      { name: '--checkbox-shadow', default: 'var(--field-shadow, none)', description: 'Ombre / glow au repos.' },
      {
        name: '--checkbox-shadow-checked',
        default: '0 0 8px (primaire 50%)',
        description: "Halo coloré à l'état coché.",
      },
      { name: '--checkbox-shadow-hover', default: 'var(--field-shadow-hover)', description: 'Ombre au survol.' },
      { name: '--checkbox-shadow-focus', default: 'var(--field-shadow-focus)', description: 'Ombre au focus.' },
      {
        name: '--checkbox-transition',
        default: 'bg / border / box-shadow 0.15s',
        description: "Transition des changements d'état.",
      },
      {
        name: '--checkbox-mark-transition',
        default: 'transform 0.12s ease-in',
        description: 'Repli de la coche au décochage.',
      },
      {
        name: '--checkbox-mark-animation',
        default: 'kt-checkbox-pop 0.22s',
        description: 'Animation « pop » au cochage.',
      },
    ],
  },
  {
    title: 'Bouton radio (--radio-*)',
    tokens: [
      {
        name: '--radio-size',
        default: '1.25rem',
        description: 'Taille du radio (`font-size` : box et point en `em`).',
      },
      {
        name: '--radio-target-size',
        default: '44px',
        description: 'Hauteur min. de la rangée cliquable (cible AAA 2.5.5).',
      },
      {
        name: '--radio-padding',
        default: '0',
        description: 'Rembourrage de la rangée (pour bâtir une carte sélectionnable).',
      },
      { name: '--radio-border-width', default: '2px', description: 'Épaisseur de bordure.' },
      { name: '--radio-border-color', default: 'var(--field-border-color)', description: 'Bordure au repos.' },
      { name: '--radio-bg', default: 'var(--field-bg)', description: 'Fond au repos.' },
      { name: '--radio-dot-color', default: '#ffffff', description: 'Couleur du point central.' },
      { name: '--radio-bg-checked', default: 'var(--kt-primary)', description: 'Fond sélectionné.' },
      {
        name: '--radio-border-color-checked',
        default: 'var(--radio-bg-checked)',
        description: 'Bordure sélectionnée.',
      },
      {
        name: '--radio-border-color-hover',
        default: 'var(--field-border-color-hover)',
        description: 'Bordure au survol.',
      },
      {
        name: '--radio-bg-checked-hover',
        default: 'color-mix(primaire 90%, noir)',
        description: 'Fond sélectionné au survol.',
      },
      { name: '--radio-focus-ring-offset', default: '2px', description: "Décalage de l'anneau de focus." },
      { name: '--radio-shadow', default: 'var(--field-shadow, none)', description: 'Ombre / glow au repos.' },
      {
        name: '--radio-shadow-checked',
        default: '0 0 8px (primaire 50%)',
        description: "Halo coloré à l'état sélectionné.",
      },
      { name: '--radio-shadow-hover', default: 'var(--field-shadow-hover)', description: 'Ombre au survol.' },
      { name: '--radio-shadow-focus', default: 'var(--field-shadow-focus)', description: 'Ombre au focus.' },
      {
        name: '--radio-transition',
        default: 'bg / border / box-shadow 0.15s',
        description: "Transition des changements d'état.",
      },
      {
        name: '--radio-dot-transition',
        default: 'transform 0.12s ease-in',
        description: 'Repli du point à la désélection.',
      },
      {
        name: '--radio-dot-animation',
        default: 'kt-radio-pop 0.22s',
        description: 'Animation « pop » à la sélection.',
      },
    ],
  },
  {
    title: 'Interrupteur (--switch-*)',
    tokens: [
      { name: '--switch-width', default: '2.75rem', description: 'Largeur de la glissière (track).' },
      { name: '--switch-height', default: '1.5rem', description: 'Hauteur de la glissière.' },
      { name: '--switch-padding', default: '2px', description: 'Marge interne entre la pastille et le bord.' },
      { name: '--switch-radius', default: '999px', description: 'Rayon de la glissière (pleinement arrondie).' },
      { name: '--switch-border-width', default: '2px', description: 'Épaisseur de bordure de la glissière.' },
      { name: '--switch-border-color', default: 'var(--field-border-color)', description: 'Bordure au repos (off).' },
      { name: '--switch-bg', default: 'var(--field-bg)', description: 'Fond de la glissière au repos (off).' },
      { name: '--switch-thumb-size', default: '1rem', description: 'Diamètre de la pastille mobile (thumb).' },
      { name: '--switch-thumb-radius', default: '50%', description: 'Rayon de la pastille.' },
      { name: '--switch-thumb-bg', default: 'var(--kt-outline-strong)', description: 'Couleur de la pastille (off).' },
      { name: '--switch-thumb-bg-active', default: '#ffffff', description: 'Couleur de la pastille (on).' },
      {
        name: '--switch-thumb-shadow',
        default: '0 1px 3px rgba(0,0,0,.2)',
        description: 'Ombre portée de la pastille.',
      },
      { name: '--switch-bg-active', default: 'var(--kt-primary)', description: 'Fond de la glissière activée (on).' },
      { name: '--switch-border-color-active', default: 'var(--kt-primary)', description: 'Bordure activée (on).' },
      {
        name: '--switch-border-color-hover',
        default: 'var(--field-border-color-hover)',
        description: 'Bordure au survol (off).',
      },
      {
        name: '--switch-bg-active-hover',
        default: 'color-mix(primaire 90%, noir)',
        description: 'Fond activé au survol.',
      },
      {
        name: '--switch-border-color-active-hover',
        default: 'color-mix(primaire 90%, noir)',
        description: 'Bordure activée au survol.',
      },
      { name: '--switch-focus-ring-offset', default: '2px', description: "Décalage de l'anneau de focus." },
      { name: '--switch-shadow', default: 'var(--field-shadow, none)', description: 'Ombre / glow au repos.' },
      {
        name: '--switch-shadow-active',
        default: '0 0 8px (primaire 50%)',
        description: "Halo coloré à l'état activé.",
      },
      { name: '--switch-shadow-hover', default: 'var(--field-shadow-hover)', description: 'Ombre au survol.' },
      { name: '--switch-shadow-focus', default: 'var(--field-shadow-focus)', description: 'Ombre au focus.' },
      {
        name: '--switch-transition',
        default: 'bg / border / box-shadow 0.2s',
        description: 'Transition de la glissière.',
      },
      {
        name: '--switch-thumb-transition',
        default: 'transform / bg 0.2s',
        description: 'Glissement de la pastille (léger rebond).',
      },
    ],
  },
];

/** Extrait d'import + usage type, affiché dans la page. */
export const CHOICE_TS_SNIPPET = `import { Component, signal } from '@angular/core';
import { KtSwitch, KtCheckbox, KtCheckboxGroup, KtRadio, KtRadioGroup } from '@ktortu/aaa/forms';

@Component({
  imports: [KtSwitch, KtCheckbox, KtCheckboxGroup, KtRadio, KtRadioGroup],
  // ...
})
export class MyComponent {
  protected readonly notifications = signal(true);
  protected readonly accepted = signal(false);
  protected readonly interests = signal<string[]>(['sport']);
  protected readonly civility = signal<string | null>(null);
}`;

export const CHOICE_HTML_SNIPPET = `<!-- Interrupteur (valeur boolean) -->
<kt-switch label="Notifications par e-mail" [(value)]="notifications" />

<!-- Case à cocher autonome -->
<kt-checkbox label="J'accepte les conditions" [(value)]="accepted" required />

<!-- Groupe de cases (valeur tableau) -->
<kt-checkbox-group label="Centres d'intérêt" [(value)]="interests">
  <kt-checkbox [optionValue]="'sport'" label="Sport" />
  <kt-checkbox [optionValue]="'musique'" label="Musique" />
  <kt-checkbox [optionValue]="'cinema'" label="Cinéma" />
</kt-checkbox-group>

<!-- Groupe radio (valeur unique) -->
<kt-radio-group label="Civilité" [(value)]="civility" required>
  <kt-radio [optionValue]="'mme'" label="Madame" />
  <kt-radio [optionValue]="'m'" label="Monsieur" />
</kt-radio-group>`;
