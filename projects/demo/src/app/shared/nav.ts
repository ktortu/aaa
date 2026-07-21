/** Source unique de la navigation de la démo : consommée par le shell (`App`) et l'index d'accueil
    (`Home`), pour éviter deux listes à maintenir en parallèle. */

export interface NavSubItem {
  /** Lien de navigation (absolu). */
  readonly link: string;
  /** Libellé affiché. */
  readonly label: string;
}

export interface NavItem {
  /** Lien de navigation (absolu). */
  readonly link: string;
  /** Chemin sans slash, pour résoudre le titre de page. */
  readonly path: string;
  /** Libellé affiché. */
  readonly label: string;
  /** Nom de l'icône Material Symbols (ex: 'home'). */
  readonly icon?: string;
  /** Sous-menu optionnel. */
  readonly children?: readonly NavSubItem[];
}

/** Navigation complète du shell (sidebar). */
export const NAV_ITEMS: readonly NavItem[] = [
  { link: '/', path: '', label: 'Accueil', icon: 'home' },
  {
    link: '/foundations',
    path: 'foundations',
    label: 'Fondations',
    icon: 'architecture',
  },
  { link: '/foundations/icons', path: 'foundations/icons', label: 'Icônes', icon: 'interests' },
  { link: '/layout', path: 'layout', label: 'Layout & Shell', icon: 'view_sidebar' },
  { link: '/outline', path: 'outline', label: 'Apparence outline', icon: 'border_outer' },
  { link: '/buttons', path: 'buttons', label: 'Boutons', icon: 'smart_button' },
  { link: '/tooltip', path: 'tooltip', label: 'Tooltip', icon: 'chat_bubble' },
  { link: '/forms', path: 'forms', label: 'Formulaires', icon: 'edit_document' },
  { link: '/form-showcase', path: 'form-showcase', label: 'Formulaire (Signal Forms)', icon: 'dynamic_form' },
  { link: '/temporal', path: 'temporal', label: 'Temporal', icon: 'calendar_month' },
  { link: '/choice', path: 'choice', label: 'Checkbox / Radio / Switch', icon: 'check_box' },
  { link: '/select', path: 'select', label: 'Select', icon: 'arrow_drop_down_circle' },
  { link: '/multi-select', path: 'multi-select', label: 'Multi-Select', icon: 'checklist' },
  { link: '/chips', path: 'chips', label: 'Chips', icon: 'label' },
  { link: '/dialog', path: 'dialog', label: 'Dialog', icon: 'web_asset' },
  { link: '/snackbar', path: 'snackbar', label: 'Snackbar', icon: 'notifications' },
  { link: '/card', path: 'card', label: 'Card', icon: 'crop_portrait' },
  { link: '/tabs', path: 'tabs', label: 'Tabs', icon: 'tab' },
  { link: '/menu', path: 'menu', label: 'Menu', icon: 'menu_open' },
  { link: '/disclosure', path: 'disclosure', label: 'Disclosure', icon: 'expand_more' },
  { link: '/progress-bar', path: 'progress-bar', label: 'Progress Bar', icon: 'hourglass_empty' },
];

/** Pages « composants » pour l'index d'accueil : exclut l'Accueil, les groupes et les sous-pages
    (chemins à segment, ex. `foundations/icons`, déjà couverts par leur page-index). */
export const COMPONENT_NAV_ITEMS: readonly NavItem[] = NAV_ITEMS.filter(
  (item) => item.path !== '' && !item.path.includes('/') && !item.children,
);
