import { PropRow, TokenGroup } from '../../shared/doc-types';

/** Directives de THÈME & de positionnement de la famille menu (regroupées dans `KtMenuImports`). Voir les
    sources sous `@ktortu/aaa/menu`. Ce sont des marqueurs SANS logique d'accessibilité : le rôle, le
    clavier, le focus roving et les sous-menus viennent des directives `@angular/aria/menu`
    (`[ngMenu]`, `[ngMenuItem]`, `[ngMenuTrigger]`), posées sur les mêmes hôtes. */
export const MENU_DIRECTIVE_PROPS: readonly PropRow[] = [
  {
    name: 'KtMenuImports',
    type: 'Directive[]',
    default: '—',
    description: 'Tableau regroupant les 7 directives de la famille, à passer tel quel dans `imports`.',
  },
  {
    name: '[ktMenuTrigger]',
    type: 'Directive',
    default: '—',
    description:
      'Sur le même hôte que `[ngMenuTrigger]` : monte la surface du menu dans un overlay CDK ancré au déclencheur (positionné en JS, robuste en conteneur scrollable). Le focus reste piloté par aria.',
  },
  {
    name: '[ktMenu]',
    type: 'Directive',
    default: '—',
    description:
      'Sur l’hôte `[ngMenu]` : thématise la SURFACE (fond, bord, ombre, rayon, positionnement). Masquée tant que `data-visible` n’est pas posé.',
  },
  {
    name: '[ktMenuItem]',
    type: 'Directive',
    default: '—',
    description:
      'Sur l’hôte `[ngMenuItem]` : thématise la RANGÉE (cible tactile ≥44px, survol, focus, désactivé, chevron de sous-menu) et positionne en JS le sous-menu éventuel à côté de l’item (toute profondeur).',
  },
  {
    name: '[ktMenuSeparator]',
    type: 'Directive',
    default: '—',
    description: 'Sur un `<hr>` : pose `role="separator"` ; le filet de séparation vit dans `menu.css`.',
  },
  {
    name: 'data-tone="danger"',
    type: 'attribut',
    default: '—',
    description: 'Opt-in sur un `[ktMenuItem]` : teinte destructrice (`--kt-menu-item-danger-color`).',
  },
];

/** Items À ÉTAT (checkbox / radio). Ils comblent un trou d’`@angular/aria`, qui n’émet que
    `itemSelected(value)` et NE POSE JAMAIS `aria-checked` (échec WCAG 4.1.2) : ces directives
    possèdent l’état coché, le bindent en `aria-checked`, et le basculent à l’activation. */
export const MENU_TOGGLE_PROPS: readonly PropRow[] = [
  {
    name: '[ktMenuItemCheckbox]',
    type: 'Directive — `[(checked)]: boolean`',
    default: 'false',
    description:
      'Sur un `[ngMenuItem] role="menuitemcheckbox"` : bascule indépendante. Bind `aria-checked` et inverse `checked` au clic / Entrée / Espace.',
  },
  {
    name: '[ktMenuRadioGroup]',
    type: 'Directive — `[(value)]: V | null`',
    default: 'null',
    description:
      'Sur un conteneur (typiquement `role="group"`) : détient la valeur sélectionnée du groupe radio, exposée aux `[ktMenuItemRadio]` enfants.',
  },
  {
    name: '[ktMenuItemRadio]',
    type: 'Directive — `value: V` (requis)',
    default: '—',
    description:
      'Sur un `[ngMenuItem] role="menuitemradio"` dans un `[ktMenuRadioGroup]` : `aria-checked` reflète l’égalité avec la valeur du groupe ; l’activation la sélectionne.',
  },
];

/** Tokens CSS du menu, groupés d’après `menu-tokens.css`. Tout DÉRIVE du socle `--kt-*` : surcharger
    un `--kt-*` rebrande le menu avec la lib ; surcharger un `--kt-menu-*` ne touche que le menu. */
export const MENU_TOKENS: readonly TokenGroup[] = [
  {
    title: 'Surface',
    tokens: [
      { name: '--kt-menu-bg', default: 'var(--kt-surface, #ffffff)', description: 'Fond de la surface du menu.' },
      { name: '--kt-menu-fg', default: 'var(--kt-on-surface, #1f1f1f)', description: 'Couleur du texte des items.' },
      {
        name: '--kt-menu-border-color',
        default: 'var(--kt-outline, #c4c7c5)',
        description: 'Couleur de la bordure de la surface.',
      },
      { name: '--kt-menu-border-width', default: '1px', description: 'Épaisseur de la bordure.' },
      {
        name: '--kt-menu-radius',
        default: 'var(--kt-control-radius, 8px)',
        description: 'Rayon des coins de la surface.',
      },
      { name: '--kt-menu-shadow', default: '0 4px 12px rgb(0 0 0 / 12%)', description: 'Ombre portée du dropdown.' },
      { name: '--kt-menu-padding', default: '0.25rem', description: 'Rembourrage interne de la surface.' },
      { name: '--kt-menu-min-width', default: '12rem', description: 'Largeur minimale de la surface.' },
      { name: '--kt-menu-offset', default: '0.25rem', description: 'Décalage du dropdown sous le déclencheur.' },
      {
        name: '--kt-menu-submenu-gap',
        default: '0.375rem',
        description: 'Écart visuel surface-à-surface entre un menu et son sous-menu.',
      },
      { name: '--kt-menu-z', default: '1000', description: 'Plan d’empilement (`z-index`) de la surface.' },
    ],
  },
  {
    title: 'Items',
    tokens: [
      {
        name: '--kt-menu-item-min-height',
        default: '44px',
        description: 'Hauteur min. d’une rangée — cible tactile AAA (WCAG 2.5.5).',
      },
      { name: '--kt-menu-item-padding', default: '0.5rem 0.75rem', description: 'Rembourrage d’une rangée.' },
      { name: '--kt-menu-item-gap', default: '0.625rem', description: 'Écart entre la coche/icône et le libellé.' },
      {
        name: '--kt-menu-item-radius',
        default: 'calc(--kt-menu-radius − --kt-menu-padding)',
        description: 'Rayon d’une rangée (dérivé pour épouser la surface).',
      },
      {
        name: '--kt-menu-item-hover-bg',
        default: 'color-mix(currentColor 8%, transparent)',
        description: 'Voile de l’item survolé / actif (focus roving), dérivé du thème.',
      },
      {
        name: '--kt-menu-item-checked-color',
        default: 'var(--kt-primary, #0842a0)',
        description: 'Teinte d’un item coché (checkbox / radio).',
      },
      {
        name: '--kt-menu-item-danger-color',
        default: 'var(--kt-danger, #8c1d18)',
        description: 'Teinte d’un item destructeur (`data-tone="danger"`).',
      },
    ],
  },
  {
    title: 'Focus & séparateur',
    tokens: [
      {
        name: '--kt-menu-focus-ring-color',
        default: 'var(--kt-focus-ring-color, #0842a0)',
        description: 'Couleur de l’anneau de focus d’un item.',
      },
      {
        name: '--kt-menu-focus-ring-width',
        default: 'var(--kt-focus-ring-width, 2px)',
        description: 'Largeur de l’anneau de focus.',
      },
      {
        name: '--kt-menu-separator-color',
        default: 'var(--kt-outline, #c4c7c5)',
        description: 'Couleur du filet de `[ktMenuSeparator]`.',
      },
    ],
  },
  {
    title: 'États & motion',
    tokens: [
      {
        name: '--kt-menu-enter-animation',
        default: 'none',
        description: 'Animation d’entrée du dropdown (transform/opacity uniquement — la position est ancrée).',
      },
      { name: '--kt-menu-backdrop-filter', default: 'none', description: 'Flou de la surface (thèmes verre).' },
      { name: '--kt-menu-item-transition', default: 'none', description: 'Transition du voile de survol des items.' },
    ],
  },
];

/** Extrait d’import + setup du composant consommateur. */
export const MENU_TS_SNIPPET = `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Menu, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { KtMenuImports } from '@ktortu/aaa/menu';

@Component({
  selector: 'app-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // KtMenuImports = thème ktortu ; les directives @angular/aria apportent le comportement accessible.
  imports: [Menu, MenuItem, MenuTrigger, KtMenuImports],
  templateUrl: './toolbar.html',
})
export class Toolbar {
  protected readonly wrap = signal(false);
  protected readonly sortBy = signal<'name' | 'date'>('name');

  protected onAction(value: string): void {
    // value émis par (itemSelected) du menu
  }
}`;

export const MENU_HTML_SNIPPET = `<!-- Déclencheur + surface : aria gère l'ouverture, le clavier et le focus -->
<button ngMenuTrigger ktMenuTrigger [menu]="actions" ktButton mode="tonal">Actions</button>
<div ngMenu ktMenu #actions="ngMenu" (itemSelected)="onAction($event)" aria-label="Actions">
  <button ngMenuItem ktMenuItem value="rename">Renommer</button>
  <button ngMenuItem ktMenuItem value="archive" [disabled]="true">Archiver</button>
  <hr ktMenuSeparator />
  <button ngMenuItem ktMenuItem value="delete" data-tone="danger">Supprimer</button>
</div>

<!-- Case à cocher : aria-checked posé par [ktMenuItemCheckbox] (trou comblé) -->
<button ngMenuItem ktMenuItem ktMenuItemCheckbox role="menuitemcheckbox" value="wrap" [(checked)]="wrap">
  Retour à la ligne
</button>

<!-- Groupe radio mutuellement exclusif -->
<div role="group" ktMenuRadioGroup [(value)]="sortBy" aria-label="Trier par">
  <button ngMenuItem ktMenuItem ktMenuItemRadio role="menuitemradio" [value]="'name'">Nom</button>
  <button ngMenuItem ktMenuItem ktMenuItemRadio role="menuitemradio" [value]="'date'">Date</button>
</div>

<!-- Sous-menu : le [ngMenu] enfant DOIT être un descendant DOM du menu parent -->
<button ngMenuItem ktMenuItem value="share" [submenu]="share">Partager</button>
<div ngMenu ktMenu #share="ngMenu" aria-label="Partager">
  <button ngMenuItem ktMenuItem value="email">E-mail</button>
</div>`;
