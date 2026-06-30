import { PropRow, TokenGroup } from '../../shared/doc-types';

/** Inputs publics de la directive `[ngTabList]` (`@angular/aria/tabs`). Le composant `@ktortu/aaa`
    ne fournit que le style (`tabs.css`) et la directive d'appoint `ktTabScroller` ; le comportement
    (clavier, sélection, ARIA) vient d'Angular ARIA. */
export const TABLIST_PROPS: readonly PropRow[] = [
  {
    name: '[(selectedTab)]',
    type: 'string | undefined',
    default: 'undefined',
    description:
      'Valeur de l’onglet sélectionné (`model`, two-way). À lier à un `signal` pour piloter/observer la sélection.',
  },
  {
    name: 'orientation',
    type: `'horizontal' | 'vertical'`,
    default: `'horizontal'`,
    description: 'Axe de la liste. `vertical` bascule le layout, la navigation clavier (↑/↓) et l’indicateur.',
  },
  {
    name: 'selectionMode',
    type: `'follow' | 'explicit'`,
    default: `'follow'`,
    description:
      '`follow` : l’onglet focalisé est sélectionné automatiquement. `explicit` : il faut Espace/Entrée pour sélectionner.',
  },
  {
    name: 'focusMode',
    type: `'roving' | 'activedescendant'`,
    default: `'roving'`,
    description:
      '`roving` : le focus DOM se déplace (tabindex). `activedescendant` : le focus reste sur la liste, `aria-activedescendant` pointe l’onglet actif.',
  },
  {
    name: 'wrap',
    type: 'boolean',
    default: 'true',
    description: 'Le focus reboucle du dernier au premier onglet (et inversement) lors de la navigation aux flèches.',
  },
  {
    name: 'softDisabled',
    type: 'boolean',
    default: 'true',
    description: 'Si `true`, un onglet désactivé reste focusable (mais non sélectionnable) ; si `false`, il est sauté.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: 'Désactive toute la liste d’onglets.',
  },
];

/** Inputs publics de `[ngTab]`. */
export const TAB_PROPS: readonly PropRow[] = [
  {
    name: 'value',
    type: 'string',
    default: '— (requis)',
    description: 'Identifiant local de l’onglet ; relie l’onglet au `[ngTabPanel]` de même `value`.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: 'Rend l’onglet inerte (cf. `--tab-text-disabled`). Le comportement de focus dépend de `softDisabled`.',
  },
  {
    name: 'id',
    type: 'string',
    default: 'auto (`ng-tab-*`)',
    description: 'Identifiant global ; généré automatiquement, surchargeable.',
  },
];

/** Inputs publics de `[ngTabPanel]` (+ `ng-template[ngTabContent]` pour le chargement paresseux). */
export const TABPANEL_PROPS: readonly PropRow[] = [
  {
    name: 'value',
    type: 'string',
    default: '— (requis)',
    description:
      'Relie le panneau à l’onglet de même `value`. Le panneau masqué reçoit `inert` (hors arbre d’accessibilité).',
  },
  {
    name: 'ngTabContent',
    type: 'Directive structurelle',
    default: '—',
    description:
      'Sur un `<ng-template ngTabContent>` interne : le contenu n’est rendu qu’au premier affichage de l’onglet (lazy).',
  },
  {
    name: 'ktTabScroller',
    type: 'Directive headless (@ktortu/aaa/tabs)',
    default: '—',
    description:
      'Opt-in sur `[ngTabList]`. Amène l’onglet actif dans la vue + expose `canScrollStart()`, `canScrollEnd()`, `overflowing()`, `orientation()` (signals) et `scrollByPage(dir)`. `exportAs: "ktTabScroller"`. Respecte `prefers-reduced-motion`.',
  },
  {
    name: '<kt-tab-scroller>',
    type: 'Composant (@ktortu/aaa/tabs)',
    default: '—',
    description:
      'Couche clé-en-main : enveloppe le `[ngTabList]` (qui porte `ktTabScroller`) de deux chevrons de pagination accessibles. Labels (anglais par défaut, lib neutre i18n) surchargeables par instance via `previousLabel` / `nextLabel`, par token `KT_TABS_CONFIG`, ou pour toute la lib en un appel via `provideKtDefaultFR()` / `provideKtTranslations()` (`@ktortu/aaa/i18n`).',
  },
];

/** Tokens CSS des tabs (`@ktortu/aaa/tabs.css`). Surcharge sur `:root` ou un conteneur de spécificité ≥. */
export const TABS_TOKENS: readonly TokenGroup[] = [
  {
    title: 'Géométrie & couleurs',
    tokens: [
      {
        name: '--tab-height',
        default: 'var(--kt-control-height, 44px)',
        description: 'Hauteur des onglets (cible tactile).',
      },
      { name: '--tab-text-color', default: 'var(--kt-muted)', description: 'Couleur d’un onglet inactif.' },
      { name: '--tab-text-hover', default: 'var(--kt-on-surface)', description: 'Couleur au survol.' },
      { name: '--tab-active-color', default: 'var(--kt-primary)', description: 'Couleur de l’onglet actif.' },
      {
        name: '--tab-text-disabled',
        default: 'color-mix(… --tab-text-color 55%, transparent)',
        description: 'Couleur d’un onglet désactivé (et non une opacité, pour ne pas affaiblir tout le sous-arbre).',
      },
    ],
  },
  {
    title: 'Indicateur & focus',
    tokens: [
      { name: '--tab-indicator-width', default: '3px', description: 'Épaisseur de la ligne active.' },
      { name: '--tab-indicator-color', default: 'var(--tab-active-color)', description: 'Couleur de l’indicateur.' },
      {
        name: '--tab-list-border-width',
        default: '2px',
        description: 'Bordure de la liste (bas / droite en vertical).',
      },
      { name: '--tab-list-border-color', default: 'var(--kt-outline)', description: 'Couleur de cette bordure.' },
      {
        name: '--tab-focus-ring-color',
        default: 'var(--kt-focus-ring-color)',
        description: 'Anneau de focus clavier (AAA).',
      },
      {
        name: '--tab-focus-ring-width',
        default: 'var(--kt-focus-ring-width, 2px)',
        description: 'Épaisseur de l’anneau de focus.',
      },
    ],
  },
  {
    title: 'Débordement & défilement',
    tokens: [
      {
        name: '--tab-list-overflow',
        default: 'auto',
        description: 'Débordement de la liste (`visible` pour désactiver le scroll).',
      },
      {
        name: '--tab-scroll-shadow-size',
        default: '2rem',
        description: 'Largeur du « cache » couleur de surface aux extrémités.',
      },
      {
        name: '--tab-scroll-shadow-spread',
        default: '0.85rem',
        description: 'Taille des ombres de défilement (`0` pour les couper).',
      },
      {
        name: '--tab-scroll-shadow-color',
        default: 'color-mix(… on-surface 18%, transparent)',
        description: 'Couleur des ombres (sombre en clair, claire en sombre).',
      },
      { name: '--tab-scroll-margin', default: '1rem', description: 'Marge autour de l’onglet amené dans la vue.' },
      { name: '--tab-scroll-snap', default: 'none', description: '`x proximity` pour activer l’accroche au scroll.' },
      {
        name: '--tab-scroller-scrollbar',
        default: 'none',
        description: 'Scrollbar masquée quand la pagination (`ktTabScroller`) est active ; `thin` la réaffiche.',
      },
      { name: '--tab-scroller-gap', default: '0', description: 'Espace entre les chevrons et la liste.' },
    ],
  },
  {
    title: 'Panneau',
    tokens: [
      { name: '--tab-panel-padding', default: '1.5rem 0', description: 'Rembourrage du contenu de panneau.' },
      { name: '--tab-panel-bg', default: 'transparent', description: 'Fond du panneau.' },
      { name: '--tab-panel-border', default: 'none', description: 'Bordure du panneau.' },
      { name: '--tab-panel-radius', default: '0', description: 'Rayon du panneau.' },
    ],
  },
];

export const TABS_TS_SNIPPET = `// Styles : socle + tabs (dans votre styles.css)
// @import '@ktortu/aaa/foundation.css';
// @import '@ktortu/aaa/tabs.css';

import { Component, signal } from '@angular/core';
import { Tab, TabContent, TabList, TabPanel, Tabs } from '@angular/aria/tabs';
import { KtTabScroller, KtTabScrollerPager } from '@ktortu/aaa/tabs';

@Component({
  imports: [Tabs, TabList, Tab, TabPanel, TabContent, KtTabScroller, KtTabScrollerPager],
  templateUrl: './mon-composant.html',
})
export class MonComposant {
  protected readonly tab = signal('apercu');
}`;

export const TABS_HTML_SNIPPET = `<div ngTabs>
  <!-- Pagination clé-en-main : chevrons automatiques quand la liste déborde -->
  <kt-tab-scroller>
    <ul ngTabList ktTabScroller [(selectedTab)]="tab">
      <li ngTab value="apercu">Aperçu</li>
      <li ngTab value="specs">Spécifications</li>
    </ul>
  </kt-tab-scroller>

  <div ngTabPanel value="apercu">
    <ng-template ngTabContent>Contenu de l'aperçu.</ng-template>
  </div>
  <div ngTabPanel value="specs">
    <ng-template ngTabContent>Contenu chargé paresseusement.</ng-template>
  </div>
</div>`;
