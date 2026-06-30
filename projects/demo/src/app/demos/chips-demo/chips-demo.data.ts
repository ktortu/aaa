import { PropRow, TokenGroup } from '../../shared/doc-types';

/** `kt-chip` — pilule individuelle (le libellé vient du contenu projeté). */
export const CHIPS_CHIP_PROPS: readonly PropRow[] = [
  {
    name: 'removable',
    type: 'boolean',
    default: 'false',
    description: 'Affiche le bouton « retirer » (sinon tag statique). Cible tactile 44px.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: 'Chip désactivé (bouton « retirer » présent mais inactif).',
  },
  {
    name: 'removeLabel',
    type: 'string',
    default: "'Remove'",
    description: 'Libellé accessible du bouton « retirer » (inclure le nom de l’item).',
  },
  {
    name: 'remove',
    type: 'output<void>',
    default: '—',
    description: 'Émis au clic sur « retirer » ; le parent décide de retirer le chip.',
  },
];

/** `kt-chip-list` — liste révocable contrôlée (la liste ne possède pas la donnée). */
export const CHIPS_LIST_PROPS: readonly PropRow[] = [
  {
    name: 'items',
    type: 'readonly T[]',
    default: '(requis)',
    description: 'Items rendus en chips (pattern contrôlé : le parent met à jour la liste).',
  },
  {
    name: 'itemLabel',
    type: 'keyof T | ((item: T) => string)',
    default: '`label`/`name`, sinon String(item)',
    description: 'Libellé d’un item : clé OU fonction.',
  },
  {
    name: 'itemKey',
    type: 'keyof T | ((item: T) => unknown)',
    default: '`id`/`value`, sinon l’item',
    description: 'Identité d’un item (track du @for) : clé OU fonction.',
  },
  {
    name: 'removable',
    type: 'boolean',
    default: 'true',
    description: 'Chips révocables (un bouton « retirer » par chip).',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: 'Liste désactivée (boutons « retirer » présents mais inactifs).',
  },
  {
    name: 'readonly',
    type: 'boolean',
    default: 'false',
    description: 'Boutons « retirer » absents (≠ disabled : présents mais inactifs).',
  },
  {
    name: 'maxVisible',
    type: 'number | undefined',
    default: 'undefined',
    description: 'Nombre max de chips avant repli derrière « +N more » (illimité par défaut).',
  },
  {
    name: 'listLabel',
    type: 'string',
    default: "KT_CHIPS_CONFIG.listLabel ?? 'Selected items'",
    description: 'Libellé accessible de la liste (`aria-label`).',
  },
  {
    name: 'removeItemLabel',
    type: '(itemLabel: string) => string',
    default: '« Remove {label} »',
    description: 'Construit le libellé du bouton « retirer ».',
  },
  {
    name: 'itemRemovedText',
    type: '(itemLabel: string) => string',
    default: '« {label} removed »',
    description: 'Message annoncé après retrait (live region).',
  },
  {
    name: 'moreLabel',
    type: '(hiddenCount: number) => string',
    default: '« +{n} more »',
    description: 'Libellé du bouton qui déplie les chips repliés.',
  },
  {
    name: 'lessLabel',
    type: 'string',
    default: "KT_CHIPS_CONFIG.lessLabel ?? 'Show less'",
    description: 'Libellé du bouton qui replie la liste dépliée.',
  },
  {
    name: 'emptyFocusTarget',
    type: 'HTMLElement | undefined',
    default: 'undefined',
    description: 'Élément à focuser quand le dernier chip est retiré (ex. le trigger parent).',
  },
  {
    name: 'removed',
    type: 'output<{ item: T; index: number }>',
    default: '—',
    description: 'Émis au retrait ; le parent doit retirer l’item de `items`.',
  },
];

/** `ng-template[ktChipItem]` — rendu custom d’un chip. Contexte : `let-item`, `let-remove="remove"`. */
export const CHIPS_TEMPLATE_PROPS: readonly PropRow[] = [
  {
    name: 'ktChipItem',
    type: 'readonly T[]',
    default: '(requis)',
    description: 'Liste rendue par ce template (sert aussi à inférer le type `T` du contexte).',
  },
  {
    name: 'let-item',
    type: 'T',
    default: '—',
    description: 'Contexte `$implicit` : l’item en cours de rendu.',
  },
  {
    name: 'let-remove',
    type: '() => void',
    default: '—',
    description: 'Contexte `remove` : retire cet item de la liste.',
  },
];

export const CHIPS_TOKENS: readonly TokenGroup[] = [
  {
    title: 'Géométrie',
    tokens: [
      { name: '--chip-radius', default: '50px', description: 'Arrondi du chip (pilule).' },
      { name: '--chip-padding-y', default: '0.25rem', description: 'Rembourrage vertical.' },
      { name: '--chip-padding-x', default: '0.625rem', description: 'Rembourrage horizontal.' },
      { name: '--chip-gap', default: '0.25rem', description: 'Espace entre libellé et bouton « retirer ».' },
      { name: '--chip-font-size', default: '0.875rem', description: 'Taille du texte.' },
    ],
  },
  {
    title: 'Surface',
    tokens: [
      { name: '--chip-bg', default: 'mix(--kt-primary 10%)', description: 'Fond du chip.' },
      { name: '--chip-bg-hover', default: 'mix(--kt-primary 18%)', description: 'Fond au survol.' },
      { name: '--chip-border', default: 'mix(--kt-primary 20%)', description: 'Bordure.' },
      { name: '--chip-color', default: 'var(--field-color)', description: 'Couleur du texte.' },
      { name: '--chip-focus-ring', default: 'var(--field-border-color-focus)', description: 'Anneau de focus.' },
    ],
  },
  {
    title: 'Bouton « retirer »',
    tokens: [
      { name: '--chip-remove-color', default: 'var(--field-icon-color)', description: 'Couleur du « × ».' },
      { name: '--chip-remove-color-hover', default: 'var(--kt-danger)', description: 'Couleur du « × » au survol.' },
      { name: '--chip-remove-bg-hover', default: 'mix(currentColor 15%)', description: 'Fond du « × » au survol.' },
    ],
  },
  {
    title: 'Animation',
    tokens: [
      { name: '--chip-enter-animation', default: 'chip-vt-fade-in 0.25s', description: 'Entrée (View Transition).' },
      { name: '--chip-leave-animation', default: 'chip-vt-fade-out 0.25s', description: 'Sortie (View Transition).' },
    ],
  },
];

export const CHIPS_TS_SNIPPET = `import { Component, signal } from '@angular/core';
import { KtChipList } from '@ktortu/aaa/forms';

@Component({
  selector: 'app-tags',
  imports: [KtChipList],
  template: \`
    <!-- Pattern CONTRÔLÉ : la liste émet \\\`removed\\\`, le parent met à jour \\\`items\\\`. -->
    <kt-chip-list [items]="tags()" listLabel="Technologies" (removed)="remove($event)" />
  \`,
})
export class TagsExample {
  readonly tags = signal(['Angular', 'TypeScript', 'RxJS']);

  remove({ index }: { item: string; index: number }): void {
    this.tags.update((t) => t.filter((_, i) => i !== index));
  }
}`;

export const CHIPS_HTML_SNIPPET = `<!-- Rendu custom par chip (ktChipItem) + repli au-delà de 3 -->
<kt-chip-list [items]="frameworks()" itemKey="id" [maxVisible]="3" (removed)="removeFw($event)">
  <ng-template [ktChipItem]="frameworks()" let-fw let-remove="remove">
    <kt-chip removable (remove)="remove()">{{ fw.name }}</kt-chip>
  </ng-template>
</kt-chip-list>`;

export const CHIPS_I18N_SNIPPET = `import { KT_CHIPS_CONFIG } from '@ktortu/aaa/forms';

// Défauts ANGLAIS neutres ; à traduire par token (sous-arbre) ou globalement.
providers: [
  {
    provide: KT_CHIPS_CONFIG,
    useValue: {
      listLabel: 'Éléments sélectionnés',
      removeItemLabel: (l) => \`Retirer \${l}\`,
      itemRemovedText: (l) => \`\${l} retiré\`,
    },
  },
];
// …ou pour toute la lib en un appel : provideKtDefaultFR()
// (cf. @ktortu/aaa/i18n — couvre aussi field/select/tabs).`;
