import { PropRow, TokenGroup } from '../../shared/doc-types';

/** Propriétés publiques de la directive `[ktButton]` (cf. `button.ts`). */
export const BUTTON_PROPS: readonly PropRow[] = [
  {
    name: 'mode',
    type: `'filled' | 'tonal' | 'outlined' | 'text'`,
    default: `'filled'`,
    description: "Niveau d'emphase visuelle du bouton.",
  },
  {
    name: 'color',
    type: `'primary' | 'neutral' | 'danger'`,
    default: `'primary'`,
    description: 'Intention sémantique (couleur).',
  },
  {
    name: 'size',
    type: `'sm' | 'md' | 'lg'`,
    default: `'md'`,
    description: 'Taille ; `md` vise une cible tactile AAA (44–48px).',
  },
  {
    name: 'fullWidth',
    type: 'boolean',
    default: 'false',
    description: 'Étire le bouton sur toute la largeur du conteneur.',
  },
  {
    name: 'iconOnly',
    type: 'boolean',
    default: 'false',
    description: 'Mode carré, icône seule ; exige un `ariaLabel`.',
  },
  {
    name: 'collapseCompact',
    type: 'boolean',
    default: 'false',
    description: 'Bascule automatiquement le bouton en icône seule sous 600px (en pur CSS).',
  },
  {
    name: 'ariaLabel',
    type: 'string | undefined',
    default: '',
    description: 'Nom accessible ; requis si `iconOnly`. Préserve un `aria-label` natif sinon.',
  },
  {
    name: 'icon',
    type: 'string | undefined',
    default: '',
    description: 'Nom/ligature de l’icône (rendue en `::before` via CSS).',
  },
  {
    name: 'compactIcon',
    type: 'string | undefined',
    default: '',
    description: 'Icône spécifique affichée uniquement en mode compact (`iconOnly` ou `collapseCompact`).',
  },
  {
    name: 'iconPosition',
    type: `'start' | 'end'`,
    default: `'start'`,
    description: 'Position de l’icône par rapport au texte.',
  },
  {
    name: 'loading',
    type: 'boolean',
    default: 'false',
    description: 'Affiche un spinner ; rend le bouton inerte + `aria-busy="true"`.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: 'Désactive le bouton.',
  },
  {
    name: 'disabledInteractive',
    type: 'boolean',
    default: 'false',
    description: 'Reste focalisable quand désactivé (`aria-disabled` au lieu de `disabled`).',
  },
  {
    name: 'type',
    type: `'button' | 'submit' | 'reset'`,
    default: `'button'`,
    description: 'Type HTML (comportement dans un formulaire). Ignoré sur `<a>`.',
  },
];

/** Tokens CSS de la directive `[ktButton]`, groupés selon `button-tokens.css`. */
export const BUTTON_TOKENS: readonly TokenGroup[] = [
  {
    title: 'Bases',
    tokens: [
      { name: '--btn-primary', default: 'var(--kt-primary)', description: 'Remplissage de base — primary.' },
      { name: '--btn-neutral', default: 'var(--kt-neutral)', description: 'Remplissage de base — neutral.' },
      { name: '--btn-danger', default: 'var(--kt-danger)', description: 'Remplissage de base — danger.' },
      {
        name: '--btn-surface',
        default: 'var(--kt-surface, #ffffff)',
        description: 'Surface de référence (désaturation tonal, état désactivé).',
      },
    ],
  },
  {
    title: 'Rôles (labels & conteneurs)',
    tokens: [
      { name: '--btn-on-primary', default: '#ffffff', description: 'Label sur filled primary (statique, AA).' },
      { name: '--btn-on-neutral', default: '#ffffff', description: 'Label sur filled neutral (statique, AA).' },
      { name: '--btn-on-danger', default: '#ffffff', description: 'Label sur filled danger (statique, AA).' },
      {
        name: '--btn-primary-container',
        default: 'color-mix(… 16%)',
        description: 'Remplissage tonal primary (dérivé).',
      },
      {
        name: '--btn-primary-fg',
        default: 'color-mix(… 90%)',
        description: 'Label/bordure outlined & text primary (dérivé).',
      },
    ],
  },
  {
    title: 'Réglages de dérivation',
    tokens: [
      { name: '--btn-tonal-weight', default: '16%', description: 'Saturation du remplissage tonal.' },
      { name: '--btn-fg-weight', default: '90%', description: 'Assombrissement du label outlined/text.' },
    ],
  },
  {
    title: 'Géométrie',
    tokens: [
      {
        name: '--btn-radius',
        default: 'rayon par taille',
        description: 'Rayon universel — `999px` = pilule partout (et cercle sur les icon-only).',
      },
      { name: '--btn-radius-md', default: 'var(--kt-control-radius)', description: 'Rayon de la taille md.' },
      { name: '--btn-height-md', default: 'var(--kt-control-height)', description: 'Hauteur min. de la taille md.' },
      { name: '--btn-pad-x-md', default: '1rem', description: 'Padding horizontal du texte (md).' },
      { name: '--btn-font-md', default: 'var(--kt-control-font)', description: 'Taille de police (md).' },
      { name: '--btn-gap', default: '0.5rem', description: 'Écart icône / texte.' },
      {
        name: '--btn-border-width',
        default: '1px',
        description: 'Largeur de bordure (réservée sur tous les modes → pas de reflow).',
      },
      { name: '--btn-corner-shape', default: 'round', description: 'Propriété CSS `corner-shape`.' },
    ],
  },
  {
    title: 'Icône',
    tokens: [
      {
        name: '--btn-icon-font',
        default: 'var(--kt-icon-font)',
        description: 'Police d’icône par bouton (fallback global `--kt-icon-font` → Material Symbols).',
      },
      { name: '--btn-icon-size-md', default: '20px', description: 'Taille de l’icône (md).' },
      { name: '--btn-icon-pad-x-md', default: '10px', description: 'Réduction du padding côté icône (md).' },
    ],
  },
  {
    title: 'États & motion',
    tokens: [
      { name: '--btn-state-hover-opacity', default: '0.08', description: 'Opacité de l’overlay au survol (M3).' },
      { name: '--btn-state-focus-opacity', default: '0.12', description: 'Opacité de l’overlay au focus (M3).' },
      { name: '--btn-state-pressed-opacity', default: '0.16', description: 'Opacité de l’overlay pressé (M3).' },
      { name: '--btn-focus-ring-width', default: 'var(--kt-focus-ring-width)', description: 'Largeur du focus ring.' },
      { name: '--btn-focus-ring-color', default: 'var(--kt-focus-ring-color)', description: 'Couleur du focus ring.' },
      { name: '--btn-shadow', default: 'none', description: 'Ombre au repos (glow / elevation).' },
      {
        name: '--btn-transition',
        default: 'none',
        description: 'Transition de mouvement (ex. `transform 160ms ease`).',
      },
      { name: '--btn-transform-hover', default: 'none', description: 'Transform au survol (ex. `scale(1.03)`).' },
    ],
  },
  {
    title: 'Typographie',
    tokens: [
      { name: '--btn-text-transform', default: 'none', description: 'Transformation du texte (ex. `uppercase`).' },
      { name: '--btn-letter-spacing', default: 'normal', description: 'Interlettrage.' },
      { name: '--btn-font-weight', default: 'inherit', description: 'Graisse du libellé.' },
    ],
  },
];

/** Extrait d’import + usage type, affiché dans la page. */
export const BUTTON_TS_SNIPPET = `import { KtButton } from '@ktortu/aaa/button';

@Component({
  imports: [KtButton],
  // ...
})
export class MyComponent {}`;

export const BUTTON_HTML_SNIPPET = `<!-- Mode + couleur -->
<button ktButton mode="tonal" color="danger">Supprimer</button>

<!-- Icône en début / fin -->
<button ktButton icon="download" iconPosition="start">Télécharger</button>

<!-- Icône seule (ariaLabel obligatoire) -->
<button ktButton iconOnly icon="close" ariaLabel="Fermer" mode="text"></button>

<!-- États -->
<button ktButton [loading]="saving()">Enregistrer</button>
<button ktButton disabled>Indisponible</button>

<!-- Lien stylé en bouton -->
<a ktButton mode="outlined" href="/docs">Documentation</a>`;
