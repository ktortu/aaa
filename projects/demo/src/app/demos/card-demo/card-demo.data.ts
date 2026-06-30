import { PropRow, TokenGroup } from '../../shared/doc-types';

/** Inputs publics de la directive `[ktCard]` (cf. `card.ts`). Configurables globalement via
    `KT_CARD_CONFIG` (uniquement `variant`). */
export const CARD_PROPS: readonly PropRow[] = [
  {
    name: 'variant',
    type: `'elevated' | 'outlined' | 'filled'`,
    default: `'elevated'`,
    description:
      'Apparence de la surface (ombre / bordure / fond teinté). Défaut surchargé par `KT_CARD_CONFIG.variant`.',
  },
  {
    name: 'interactive',
    type: 'boolean',
    default: 'false',
    description:
      'Affordance hover/focus d’élément cliquable. N’ajoute AUCUN rôle : la cible cliquable reste un `[ktCardLink]` (ou la carte posée sur un `<a>`/`<button>`).',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description:
      'Rend la surface inerte (désaturée) ; un `[ktCardLink]` interne sort de la tabulation et passe `aria-disabled`.',
  },
];

/** Famille de directives structurelles (marqueurs de mise en forme, sans logique sauf `[ktCardLink]`).
    Importables en bloc via la constante `KtCardImports`. Voir `card-structure.ts`. */
export const CARD_DIRECTIVE_PROPS: readonly PropRow[] = [
  {
    name: 'KtCardImports',
    type: 'Directive[]',
    default: '—',
    description: 'Tableau regroupant `KtCard` + les 5 marqueurs ci-dessous, à passer tel quel dans `imports`.',
  },
  {
    name: '[ktCardHeader]',
    type: 'Directive',
    default: '—',
    description:
      'En-tête (rangée flex : média/avatar + titre + action). Le titre fourni par le consommateur reste l’étiquette accessible.',
  },
  {
    name: '[ktCardMedia]',
    type: 'Directive',
    default: '—',
    description:
      'Média pleine largeur (full-bleed). À envelopper autour d’un `<img ngSrc>` ; la carte clippe alors au rayon.',
  },
  {
    name: '[ktCardContent]',
    type: 'Directive',
    default: '—',
    description:
      'Corps de la carte (rythme vertical). Optionnel : une carte « texte nu » sans marqueur fonctionne aussi.',
  },
  {
    name: '[ktCardActions]',
    type: 'Directive',
    default: '—',
    description: 'Barre d’actions (rangée de boutons/liens) épinglée en pied. Repasse au-dessus du lien étiré.',
  },
  {
    name: '[ktCardLink]',
    type: 'Directive (sur `a` / `button`)',
    default: '—',
    description:
      'Lien/bouton PRIMAIRE au « lien étiré » : un `::after` couvre la carte → toute la surface cliquable sans imbriquer de contrôles. UN SEUL par carte ; porte le focus, exige un nom accessible.',
  },
];

/** Tokens CSS de la carte, groupés d’après `card-tokens.css`. Tout dérive du socle `--kt-*`. */
export const CARD_TOKENS: readonly TokenGroup[] = [
  {
    title: 'Surface',
    tokens: [
      {
        name: '--card-bg',
        default: 'var(--kt-surface, #ffffff)',
        description: 'Fond des variantes `elevated` et `outlined`.',
      },
      { name: '--card-fg', default: 'var(--kt-on-surface, #1f1f1f)', description: 'Couleur du texte de la carte.' },
      {
        name: '--card-filled-bg',
        default: 'color-mix(… on-surface 5%)',
        description: 'Fond teinté de la variante `filled` (dérivé, suit chaque thème).',
      },
    ],
  },
  {
    title: 'Bordure',
    tokens: [
      {
        name: '--card-border-color',
        default: 'var(--kt-outline, #c4c7c5)',
        description: 'Couleur de la bordure (variante `outlined`).',
      },
      {
        name: '--card-border-width',
        default: '1px',
        description: 'Épaisseur de bordure (réservée sur toutes les variantes → pas de reflow).',
      },
    ],
  },
  {
    title: 'Forme & rythme',
    tokens: [
      {
        name: '--card-radius',
        default: 'var(--kt-control-radius, 8px)',
        description: 'Rayon des coins (clippe le média full-bleed).',
      },
      { name: '--card-padding', default: '1rem', description: 'Rembourrage intérieur (le média full-bleed l’annule).' },
      { name: '--card-gap', default: '0.75rem', description: 'Écart vertical entre les régions empilées.' },
    ],
  },
  {
    title: 'Élévation',
    tokens: [
      {
        name: '--card-shadow',
        default: '0 1px 3px / 0 1px 2px rgb(0 0 0 …)',
        description: 'Ombre portée de la variante `elevated` (absente sur `outlined`/`filled`).',
      },
    ],
  },
  {
    title: 'États (carte interactive)',
    tokens: [
      { name: '--card-state-hover-opacity', default: '0.04', description: 'Opacité du voile d’état au survol.' },
      {
        name: '--card-state-pressed-opacity',
        default: '0.08',
        description: 'Opacité du voile d’état au maintien (pressé).',
      },
    ],
  },
  {
    title: 'Anneau de focus (relayé sur toute la carte)',
    tokens: [
      {
        name: '--card-focus-ring-color',
        default: 'var(--kt-focus-ring-color, #0842a0)',
        description: 'Couleur de l’anneau de focus.',
      },
      {
        name: '--card-focus-ring-width',
        default: 'var(--kt-focus-ring-width, 2px)',
        description: 'Largeur de l’anneau de focus.',
      },
      { name: '--card-focus-ring-offset', default: '2px', description: 'Décalage de l’anneau autour de la carte.' },
    ],
  },
  {
    title: 'Bascules de motion / surface (non déclarées → inertes par défaut)',
    tokens: [
      {
        name: '--card-shadow-hover',
        default: '= --card-shadow',
        description: 'Élévation au survol d’une carte interactive.',
      },
      {
        name: '--card-transition',
        default: 'none',
        description: 'Anime ombre/translation/voile (carte inerte sinon).',
      },
      { name: '--card-transform', default: 'none', description: 'Transform au repos.' },
      {
        name: '--card-transform-hover',
        default: '= --card-transform',
        description: 'Transform au survol (ex. `translateY(-2px)`).',
      },
      { name: '--card-fill-image', default: 'none', description: 'Dégradé/motif empilé SOUS le voile d’état.' },
      { name: '--card-backdrop-filter', default: 'none', description: 'Flou de la surface (thèmes verre).' },
    ],
  },
];

/** Extrait d’import + usage type, affiché dans la page. */
export const CARD_TS_SNIPPET = `import { KtCardImports } from '@ktortu/aaa/card';

@Component({
  imports: [KtCardImports],
  // ...
})
export class MyComponent {}`;

export const CARD_HTML_SNIPPET = `<!-- Carte de contenu : la directive se pose sur l'élément SÉMANTIQUE choisi -->
<article ktCard variant="outlined">
  <header ktCardHeader><h3>Titre de la carte</h3></header>
  <div ktCardContent>Une description courte du contenu.</div>
  <footer ktCardActions>
    <button ktButton mode="text">Action</button>
  </footer>
</article>

<!-- Carte interactive : lien étiré (toute la surface cliquable) -->
<article ktCard variant="elevated" interactive>
  <div ktCardMedia><img ngSrc="cover.jpg" width="400" height="180" alt="" /></div>
  <div ktCardContent>
    <h3 id="t1">Article</h3>
    <a ktCardLink routerLink="/detail" aria-labelledby="t1">Lire</a>
  </div>
</article>

<!-- Carte inerte -->
<article ktCard [disabled]="true">…</article>`;
