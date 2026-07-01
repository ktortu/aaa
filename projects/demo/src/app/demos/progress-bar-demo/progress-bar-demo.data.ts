import { PropRow, TokenGroup } from '../../shared/doc-types';

export const PROGRESS_BAR_PROPS: readonly PropRow[] = [
  {
    name: 'mode',
    type: "'determinate' | 'indeterminate'",
    default: "'indeterminate'",
    description: 'Mode de fonctionnement de la barre de progression.',
  },
  {
    name: 'value',
    type: 'number',
    default: '0',
    description: 'Valeur de la progression (entre 0 et 100). Ignorée en mode indéterminé.',
  },
  {
    name: 'label',
    type: 'string',
    default: 'undefined',
    description:
      'Texte de description. Si non fourni, le composant utilise le contenu projeté ou se rabat sur un aria-label par défaut.',
  },
  {
    name: 'labelVisible',
    type: 'boolean',
    default: 'true',
    description:
      'Si faux, masque visuellement le label avec une classe utilitaire accessible (sr-only). Utile pour conserver l’accessibilité ARIA sans polluer le design.',
  },
  {
    name: 'reducedMotion',
    type: 'boolean',
    default: 'false',
    description:
      'Force l’activation du mode de réduction des mouvements (utile pour simuler le comportement ou pour les tests).',
  },
];

export const PROGRESS_BAR_TOKENS: readonly TokenGroup[] = [
  {
    title: 'Dimensions & Espacement',
    tokens: [
      {
        name: '--kt-progress-bar-height',
        default: '4px',
        description: 'Épaisseur de la barre de progression.',
      },
      {
        name: '--kt-progress-bar-gap',
        default: '8px',
        description: 'Espacement entre le label et la barre de progression.',
      },
      {
        name: '--kt-progress-bar-border-radius',
        default: '2px',
        description: 'Arrondi des angles de la piste et de l’indicateur.',
      },
    ],
  },
  {
    title: 'Couleurs',
    tokens: [
      {
        name: '--kt-progress-bar-track-color',
        default: 'var(--kt-neutral-light, #e0e0e0)',
        description: 'Couleur de fond de la piste de la barre de progression.',
      },
      {
        name: '--kt-progress-bar-indicator-color',
        default: 'var(--kt-primary, #0056b3)',
        description: 'Couleur de l’indicateur de progression.',
      },
    ],
  },
];

export const PROGRESS_BAR_TS_SNIPPET = `import { Component } from '@angular/core';
import { KtProgressBar } from '@ktortu/aaa/progress-bar';

@Component({
  selector: 'app-fiche-produit',
  standalone: true,
  imports: [KtProgressBar],
  template: \`
    @if (loading()) {
      <kt-progress-bar mode="indeterminate">
        Chargement des données du produit...
      </kt-progress-bar>
    } @else {
      <!-- Contenu fiche produit -->
    }
  \`
})
export class FicheProduit {
  loading = signal(true);
}
`;

export const PROGRESS_BAR_HTML_SNIPPET = `<!-- Mode Indéterminé par défaut avec label projeté -->
<kt-progress-bar>Chargement en cours...</kt-progress-bar>

<!-- Mode Déterminé piloté à 45% -->
<kt-progress-bar mode="determinate" [value]="45" label="Copie des fichiers (45%)" />

<!-- Label masqué visuellement mais accessible aux lecteurs d'écran (sr-only) -->
<kt-progress-bar labelVisible="false">
  Chargement du panier...
</kt-progress-bar>
`;
