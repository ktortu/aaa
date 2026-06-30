import { PropRow, TokenGroup } from '../../shared/doc-types';

/** L'unique input qui pilote l'apparence, commun à tous les champs. */
export const OUTLINE_PROPS: readonly PropRow[] = [
  {
    name: 'appearance',
    type: "'fill' | 'outline'",
    default: "undefined → KT_FIELD_CONFIG.appearance ?? 'fill'",
    description:
      'Apparence du chrome de champ. Présent sur tous les champs (text/number/textarea/temporels/select/multi-select).',
  },
  {
    name: 'floatLabel',
    type: "'auto' | 'always'",
    default: "undefined → KT_FIELD_CONFIG.floatLabel ?? 'auto'",
    description:
      "Outline uniquement. 'auto' : label flotte au focus/rempli. 'always' : toujours flotté, même vide (le placeholder s'affiche).",
  },
];

/** Tokens CSS spécifiques à l'apparence outline (en plus du socle `--field-*`). */
export const OUTLINE_TOKENS: readonly TokenGroup[] = [
  {
    title: 'Outline',
    tokens: [
      {
        name: '--field-label-float-bg',
        default: 'var(--field-bg)',
        description:
          'Fond du label une fois flotté (masque la ligne de bordure). Plein par défaut ; posez un gradient pour un autre effet.',
      },
      {
        name: '--field-outline-border-color',
        default: 'var(--field-border-color)',
        description: 'Couleur de la bordure outline au repos (indépendante du mode fill).',
      },
    ],
  },
  {
    title: 'Réutilisés du socle champ',
    tokens: [
      { name: '--field-border-color-hover', default: '#5f6368', description: 'Bordure au survol.' },
      {
        name: '--field-border-color-focus',
        default: '#0b57d0',
        description: 'Bordure au focus (et couleur du label).',
      },
      { name: '--field-error-color', default: '#b3261e', description: 'Bordure & label en erreur.' },
      { name: '--field-radius', default: '8px', description: 'Arrondi de la boîte.' },
      { name: '--field-bg', default: '#fff', description: 'Fond du champ (et défaut du fond de label flotté).' },
    ],
  },
];

export const OUTLINE_PERFIELD_SNIPPET = `<!-- Par champ : un simple input -->
<kt-text-field appearance="outline" label="E-mail" type="email" />
<kt-select appearance="outline" label="Pays" [options]="countries" />
<kt-date-field appearance="outline" label="Date de naissance" />`;

export const OUTLINE_GLOBAL_SNIPPET = `// Globalement : tous les champs en outline, en un provider.
import { provideKtField } from '@ktortu/aaa/forms';

export const appConfig: ApplicationConfig = {
  providers: [
    provideKtField({ appearance: 'outline' }),
    // équivaut à { provide: KT_FIELD_CONFIG, useValue: { appearance: 'outline' } }
  ],
};

// Résolution effective d'un champ : appearance() ?? KT_FIELD_CONFIG.appearance ?? 'fill'
// → on peut donc forcer un champ à contre-courant : <kt-text-field appearance="fill" ... />`;

export const OUTLINE_TOKENS_SNIPPET = `:root {
  /* Bordure outline (repos) — états hover/focus/erreur gardent leurs propres tokens */
  --field-outline-border-color: #c4c7c5;

  /* Fond du label flotté : plein par défaut. Exemple de gradient « notch » :
     moitié haute transparente (laisse voir la page), moitié basse = fond du champ. */
  --field-label-float-bg: linear-gradient(to bottom, transparent 50%, var(--field-bg) 50%);
}`;

export const OUTLINE_FLOAT_SNIPPET = `<!-- Par champ : label toujours flotté (le placeholder s'affiche alors) -->
<kt-text-field appearance="outline" floatLabel="always" label="E-mail" placeholder="vous@exemple.fr" />

// …ou globalement, comme l'apparence :
provideKtField({ appearance: 'outline', floatLabel: 'always' });

// Résolution : floatLabel() ?? KT_FIELD_CONFIG.floatLabel ?? 'auto'.
// 'auto' (défaut) = flotte au focus/rempli ; 'always' = toujours en haut, même vide.`;

export const OUTLINE_MIGRATION_SNIPPET = `// Transition douce depuis Angular Material :
import { provideKtField } from '@ktortu/aaa/forms';

providers: [
  provideKtField({ appearance: 'outline' }), // forme « outline » (label flottant)
];

// + couleurs Material (orthogonal à la forme) :
//   @import '@ktortu/aaa/themes/theme-material.css';

// La FORME (appearance) et les COULEURS (thème) sont deux axes indépendants :
// outline + n'importe quel thème, ou fill + theme-material, etc.`;
