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
  /** Sous-menu optionnel. */
  readonly children?: readonly NavSubItem[];
}

/** Navigation complète du shell (sidebar). */
export const NAV_ITEMS: readonly NavItem[] = [
  { link: '/', path: '', label: 'Accueil' },
  {
    link: '/foundations/tokens',
    path: 'foundations/tokens',
    label: 'Fondations',
    children: [
      { link: '/foundations/tokens', label: 'Tokens CSS' },
      { link: '/foundations/icons', label: 'Gestion des icônes' },
      { link: '/foundations/i18n', label: 'Internationalisation' },
    ],
  },
  { link: '/outline', path: 'outline', label: 'Apparence outline' },
  { link: '/buttons', path: 'buttons', label: 'Boutons' },
  { link: '/tooltip', path: 'tooltip', label: 'Tooltip' },
  { link: '/forms', path: 'forms', label: 'Formulaires' },
  { link: '/form-showcase', path: 'form-showcase', label: 'Formulaire (Signal Forms)' },
  { link: '/temporal', path: 'temporal', label: 'Temporal' },
  { link: '/choice', path: 'choice', label: 'Checkbox / Radio / Switch' },
  { link: '/select', path: 'select', label: 'Select' },
  { link: '/multi-select', path: 'multi-select', label: 'Multi-Select' },
  { link: '/chips', path: 'chips', label: 'Chips' },
  { link: '/dialog', path: 'dialog', label: 'Dialog' },
  { link: '/snackbar', path: 'snackbar', label: 'Snackbar' },
  { link: '/card', path: 'card', label: 'Card' },
  { link: '/tabs', path: 'tabs', label: 'Tabs' },
  { link: '/menu', path: 'menu', label: 'Menu' },
  { link: '/disclosure', path: 'disclosure', label: 'Disclosure' },
  { link: '/progress-bar', path: 'progress-bar', label: 'Progress Bar' },
];

/** Pages « composants » pour l'index d'accueil : exclut l'Accueil et les groupes (Fondations). */
export const COMPONENT_NAV_ITEMS: readonly NavItem[] = NAV_ITEMS.filter((item) => item.path !== '' && !item.children);
