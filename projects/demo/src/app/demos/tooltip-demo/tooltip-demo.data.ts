import { PropRow, TokenGroup } from '../../shared/doc-types';

/** Propriétés publiques de la directive `[ktTooltip]` (cf. `tooltip.ts`). */
export const TOOLTIP_PROPS: readonly PropRow[] = [
  {
    name: 'ktTooltip',
    type: 'string | TemplateRef<unknown>',
    default: '— (requis)',
    description: 'Contenu de l’infobulle : texte simple (injecté en `textContent`) ou `TemplateRef` non interactif.',
  },
  {
    name: 'tooltipPosition',
    type: `'top' | 'bottom' | 'left' | 'right'`,
    default: `'top'`,
    description: 'Position autour de la cible. Défaut surchargeable via `KT_TOOLTIP_CONFIG`.',
  },
  {
    name: 'tooltipDisabled',
    type: 'boolean',
    default: 'false',
    description: 'Désactive l’affichage (aucun tooltip, aucun `aria-describedby`).',
  },
  {
    name: 'showDelay',
    type: 'number',
    default: '150',
    description: 'Délai (ms) avant apparition au survol/focus. Défaut via `KT_TOOLTIP_CONFIG`.',
  },
  {
    name: 'hideDelay',
    type: 'number',
    default: '100',
    description:
      'Délai (ms) avant masquage ; laisse le temps d’amener le pointeur sur l’infobulle (WCAG « hoverable »).',
  },
];

/** Tokens CSS de la directive `[ktTooltip]`, groupés selon `tooltip.css`. */
export const TOOLTIP_TOKENS: readonly TokenGroup[] = [
  {
    title: 'Couleurs',
    tokens: [
      { name: '--tooltip-bg', default: 'var(--kt-surface, #ffffff)', description: 'Fond de l’infobulle.' },
      {
        name: '--tooltip-fg',
        default: 'var(--kt-on-surface, #1f1f1f)',
        description: 'Couleur du texte.',
      },
      {
        name: '--tooltip-border-color',
        default: 'var(--kt-outline, #c4c7c5)',
        description: 'Couleur de la bordure.',
      },
    ],
  },
  {
    title: 'Géométrie & espacement',
    tokens: [
      { name: '--tooltip-radius', default: '6px', description: 'Rayon des coins.' },
      { name: '--tooltip-pad-block', default: '0.4rem', description: 'Padding vertical.' },
      { name: '--tooltip-pad-inline', default: '0.6rem', description: 'Padding horizontal.' },
      { name: '--tooltip-gap', default: '0.5rem', description: 'Distance entre la cible et l’infobulle.' },
      { name: '--tooltip-max-width', default: '18rem', description: 'Largeur maximale.' },
    ],
  },
  {
    title: 'Motion',
    tokens: [
      {
        name: '--tooltip-anim-duration',
        default: '120ms',
        description: 'Durée des transitions (apparition/disparition).',
      },
    ],
  },
];

/** Extrait d'import + usage type, affiché dans la page. */
export const TOOLTIP_TS_SNIPPET = `import { KtTooltip } from '@ktortu/aaa/tooltip';

@Component({
  imports: [KtTooltip],
  // ...
})
export class MyComponent {}

// Défauts globaux (délais, position) pour un sous-arbre ou toute l'app :
// providers: [provideKtTooltip({ showDelay: 300, position: 'bottom' })]`;

export const TOOLTIP_HTML_SNIPPET = `<!-- Texte simple (position 'top' par défaut) -->
<button ktTooltip="Enregistrer le brouillon">Enregistrer</button>

<!-- Position + délais -->
<span ktTooltip="Aide" tooltipPosition="right" [showDelay]="300" [hideDelay]="150">?</span>

<!-- Contenu riche (TemplateRef non interactif) -->
<button [ktTooltip]="rules">Mot de passe</button>
<ng-template #rules>
  <strong>Règles :</strong>
  <ul>
    <li>8 caractères minimum</li>
    <li>Une majuscule</li>
  </ul>
</ng-template>

<!-- Désactivé conditionnellement -->
<button [ktTooltip]="hint" [tooltipDisabled]="isValid()">Valider</button>`;
