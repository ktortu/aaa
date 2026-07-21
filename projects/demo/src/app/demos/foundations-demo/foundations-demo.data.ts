import { TokenGroup } from '../../shared/doc-types';

/** Une pastille de couleur de la galerie : le token et sa valeur par défaut (socle). */
export interface ColorSwatch {
  readonly token: string;
  readonly value: string;
}

/** Couleurs sémantiques du socle, avec leur valeur par défaut (cf. `cdk/styles/foundation.css`). */
export const FOUNDATIONS_COLOR_SWATCHES: readonly ColorSwatch[] = [
  { token: '--kt-primary', value: '#0842a0' },
  { token: '--kt-danger', value: '#8c1d18' },
  { token: '--kt-neutral', value: '#2e3133' },
  { token: '--kt-surface', value: '#ffffff' },
  { token: '--kt-on-surface', value: '#1f1f1f' },
  { token: '--kt-muted', value: '#474747' },
  { token: '--kt-outline', value: '#c4c7c5' },
  { token: '--kt-outline-strong', value: '#5f6368' },
];

/** Tokens du socle `--kt-*`, groupés par palier (cf. `cdk/styles/foundation.css`). */
export const FOUNDATIONS_TOKENS: readonly TokenGroup[] = [
  {
    title: 'Couleurs sémantiques',
    tokens: [
      {
        name: '--kt-primary',
        default: '#0842a0',
        description: 'Couleur de marque (7.5:1 sur blanc) : focus, états cochés, accents.',
      },
      { name: '--kt-danger', default: '#8c1d18', description: 'Erreur / action destructive (7.1:1 sur blanc).' },
      { name: '--kt-neutral', default: '#2e3133', description: 'Teinte neutre (ex. boutons neutres).' },
    ],
  },
  {
    title: 'Surfaces & texte',
    tokens: [
      { name: '--kt-surface', default: '#ffffff', description: 'Fond des surfaces (champs, cartes, popups).' },
      { name: '--kt-on-surface', default: '#1f1f1f', description: 'Texte principal sur surface.' },
      { name: '--kt-muted', default: '#474747', description: 'Texte secondaire / indices / icônes (7.6:1 sur blanc).' },
      { name: '--kt-outline', default: '#c4c7c5', description: 'Bordure au repos.' },
      { name: '--kt-outline-strong', default: '#5f6368', description: 'Bordure au survol.' },
    ],
  },
  {
    title: 'Géométrie de contrôle (md)',
    tokens: [
      {
        name: '--kt-control-height',
        default: '44px',
        description: 'Hauteur des contrôles md (champ ET bouton) — cible tactile AAA.',
      },
      { name: '--kt-control-radius', default: '8px', description: 'Rayon des coins des contrôles.' },
      { name: '--kt-control-font', default: '1rem', description: 'Taille de police des contrôles.' },
    ],
  },
  {
    title: 'Anneau de focus',
    tokens: [
      {
        name: '--kt-focus-ring-color',
        default: 'var(--kt-primary)',
        description: "Couleur de l'anneau de focus (partagée).",
      },
      { name: '--kt-focus-ring-width', default: '2px', description: "Épaisseur de l'anneau de focus." },
    ],
  },
  {
    title: 'Contrôles natifs & gouttières',
    tokens: [
      {
        name: 'color-scheme',
        default: 'light',
        description: 'Palette des contrôles natifs (scrollbars, pickers). Un thème sombre redéclare `dark`.',
      },
      {
        name: '--kt-scrollbar-thumb',
        default: 'color-mix(on-surface 30%, surface)',
        description: 'Curseur de la gouttière (dérivé du socle, suit le thème).',
      },
      {
        name: '--kt-scrollbar-track',
        default: 'color-mix(on-surface 7%, surface)',
        description: 'Rail de la gouttière (dérivé du socle).',
      },
      {
        name: '--kt-scrollbar-color',
        default: 'thumb track (non déclaré)',
        description: 'Bascule : impose la gouttière (« couleur-thumb couleur-track »).',
      },
      {
        name: '--kt-scrollbar-width',
        default: 'thin (non déclaré)',
        description: 'Bascule : largeur de la gouttière (`scrollbar-width`).',
      },
    ],
  },
  {
    title: 'Bottom-sheet partagé (Select + Dialog)',
    tokens: [
      { name: '--kt-sheet-radius', default: '16px', description: 'Rayon des coins hauts de la feuille.' },
      {
        name: '--kt-sheet-shadow',
        default: '0 -4px 16px rgb(0 0 0 / 12%)',
        description: 'Ombre portée de la feuille.',
      },
      { name: '--kt-sheet-scrim', default: 'rgb(0 0 0 / 40%)', description: 'Voile assombrissant le fond.' },
      {
        name: '--kt-sheet-anim-duration',
        default: '120ms',
        description: "Durée d'entrée (glissement + fondu du voile).",
      },
      { name: '--kt-sheet-exit-duration', default: '90ms', description: 'Durée de sortie.' },
      {
        name: '--kt-sheet-grab-color',
        default: 'var(--kt-outline)',
        description: 'Poignée de préhension de la feuille.',
      },
      {
        name: '--kt-sheet-max-block-size',
        default: '85svh',
        description: 'Hauteur max (svh : tient compte du clavier virtuel mobile).',
      },
    ],
  },
  {
    title: 'Bascules non déclarées (défaut effectif)',
    tokens: [
      {
        name: '--kt-font',
        default: 'police héritée',
        description: "Stack de police imposée par un thème ; consommée par l'hôte (`body`).",
      },
      {
        name: '--kt-selection-bg',
        default: 'Highlight (système)',
        description: "Fond de la sélection de texte (consommé par l'hôte).",
      },
      { name: '--kt-selection-fg', default: 'HighlightText (système)', description: 'Couleur du texte sélectionné.' },
      {
        name: '--kt-icon-font',
        default: "'Material Symbols Outlined'",
        description: 'Famille de police utilisée pour le rendu par ligature des icônes.',
      },
      { name: '--kt-icon-font-weight', default: 'normal', description: "Graisse de la police d'icônes." },
      {
        name: '--kt-icon-font-variation',
        default: 'normal',
        description:
          'font-variation-settings des icônes autonomes [ktIcon] (polices variables, ex. FILL/wght). Posé par la police du registre.',
      },
      {
        name: '--kt-icon-size',
        default: '1.25em',
        description: "Taille des icônes autonomes [ktIcon] (relative au texte). Posée par l'attribut size.",
      },
    ],
  },
];

/** Mise en place + rebrand : import du socle puis surcharge sur `:root`. */
export const FOUNDATIONS_SETUP_SNIPPET = `<!-- 1) Importer le socle (requis) + les composants, dans votre CSS global -->
<style>
  @import '@ktortu/aaa/styles.css';

  /* 2) Rebrander toute la lib : surcharger le socle sur :root.
     Un seul token suffit — champs, boutons, cases… en héritent. */
  :root {
    --kt-primary: #7c3aed;     /* couleur de marque */
    --kt-control-radius: 12px; /* coins plus arrondis partout */
    --kt-font: 'Inter', sans-serif;
  }
</style>`;

/** Theming : récupérer un thème existant (import CSS) PUIS l'activer (`data-theme`). */
export const FOUNDATIONS_THEME_SNIPPET = `<!-- 1) Récupérer un thème prêt à l'emploi : importer son CSS (après styles.css). -->
<style>
  @import '@ktortu/aaa/styles.css';
  @import '@ktortu/aaa/themes/theme-catppuccin.css';
  /* Thèmes dispo : material, material-you, primer, carbon, fluent, ant, bootstrap,
     catppuccin, architecte, vegetal, cyberpunk, aurora. */
</style>

<!-- 2) L'activer : un seul attribut sur <html>. Le thème redéclare les --kt-* sous
     :root[data-theme='…']. Importez-en plusieurs et basculez en changeant l'attribut. -->
<html data-theme="catppuccin">
  <!-- … toute la lib suit ce thème … -->
</html>`;

/** i18n : lib neutre (défauts anglais) — trois niveaux de traduction. */
export const FOUNDATIONS_I18N_SNIPPET = `import { provideKtDefaultFR, provideKtTranslations } from '@ktortu/aaa/i18n';
import { KT_FIELD_CONFIG } from '@ktortu/aaa/forms';

// Lib NEUTRE i18n : tous les libellés ont un défaut ANGLAIS. Pour traduire :

// 1) Français clé-en-main (toute la lib en un appel) :
providers: [provideKtDefaultFR()];

// 2) Langue custom, par famille (field / select / chips / tabs) :
providers: [
  provideKtTranslations({
    field: { clearLabel: 'Effacer', helpLabel: 'Aide' },
    select: { emptyText: 'Aucun résultat' },
  }),
];

// 3) Réglage fin par token de config (sur un sous-arbre d'injection) :
providers: [{ provide: KT_FIELD_CONFIG, useValue: { clearLabel: 'Effacer' } }];

// Résolution effective d'un libellé : input() ?? token de config ?? défaut anglais.`;
