import { PropRow, TokenGroup } from '../../shared/doc-types';

/** API TypeScript du service snackbar (cf. `@ktortu/aaa/snackbar`). */
export const SNACKBAR_API_PROPS: readonly PropRow[] = [
  {
    name: 'KtSnackbar.open(message, options?)',
    type: '(string, KtSnackbarOptions?) => KtSnackbarRef',
    default: '—',
    description:
      'Ouvre une snackbar affichant `message` et l’annonce via le LiveAnnouncer (canal unique). Renvoie une référence ignorable dans le cas simple. Une seule visible à la fois ; les suivantes patientent en file (FIFO), messages identiques fusionnés.',
  },
  {
    name: 'KtSnackbarRef.dismiss(reason?)',
    type: "(reason?: 'timeout' | 'dismiss' | 'replaced') => void",
    default: "'dismiss'",
    description: 'Ferme la snackbar par programmation (idempotent).',
  },
  {
    name: 'KtSnackbarRef.afterDismissed()',
    type: "Observable<'timeout' | 'dismiss' | 'replaced'>",
    default: '—',
    description:
      'Émet une fois (puis complète) à la fermeture, avec la raison : minuterie, fermeture explicite, ou remplacement.',
  },
  {
    name: 'provideKtSnackbar(config)',
    type: '(Partial<KtSnackbarConfig>) => Provider',
    default: '—',
    description:
      "Défauts pour un sous-arbre ou toute l’app. Ex. `provideKtSnackbar({ timing: 'manual' })` bascule l’app entière en AAA strict (aucune disparition automatique).",
  },
  {
    name: 'KT_SNACKBAR_CONFIG',
    type: 'InjectionToken<Partial<KtSnackbarConfig>>',
    default: '—',
    description: 'Token sous-jacent. Résolution en cascade : option d’`open()` ?? KT_SNACKBAR_CONFIG ?? défaut.',
  },
];

/** Champs de `KtSnackbarConfig` (= options de `open()`, toutes facultatives). */
export const SNACKBAR_CONFIG_PROPS: readonly PropRow[] = [
  {
    name: 'duration',
    type: "number | 'reading-time'",
    default: "'reading-time'",
    description:
      "Durée (ms) en régime `auto`. `'reading-time'` (défaut) la calcule selon la longueur du message : clamp(longueur × readingTimePerChar, readingTimeMin, readingTimeMax). Un nombre force une durée fixe. La minuterie se met en pause au survol et au focus.",
  },
  {
    name: 'readingTimeMin',
    type: 'number',
    default: '4000',
    description: 'Plancher (ms) de la durée calculée — laisse le temps de lire un message court.',
  },
  {
    name: 'readingTimeMax',
    type: 'number',
    default: '10000',
    description: 'Plafond (ms) de la durée calculée — borne un message long.',
  },
  {
    name: 'readingTimePerChar',
    type: 'number',
    default: '60',
    description: 'Coefficient de lecture : millisecondes ajoutées par caractère (~200 mots/min).',
  },
  {
    name: 'timing',
    type: "'auto' | 'manual'",
    default: "'auto'",
    description:
      '`auto` : disparition automatique + pause survol/focus (AA). `manual` : reste jusqu’à fermeture explicite (AAA, 2.2.3).',
  },
  {
    name: 'position',
    type: "'top' | 'bottom'",
    default: "'bottom'",
    description: 'Bord d’ancrage dans le viewport (centré horizontalement).',
  },
  {
    name: 'politeness',
    type: "'polite' | 'assertive'",
    default: "'polite'",
    description: 'Politesse de l’annonce lecteur d’écran. `assertive` à réserver aux erreurs réellement urgentes.',
  },
  {
    name: 'variant',
    type: "'neutral' | 'info' | 'success' | 'warning' | 'error'",
    default: "'neutral'",
    description:
      'Apparence seule (couleur d’accent + icône), via `data-variant` et les tokens CSS. Découplée de la politesse ; la couleur n’est jamais le seul indice (icône de forme distincte).',
  },
  {
    name: 'closable',
    type: 'boolean',
    default: 'true',
    description: 'Affiche un bouton de fermeture (cible 44px, AAA 2.5.5). `Échap` ferme aussi la snackbar affichée.',
  },
  {
    name: 'closeLabel',
    type: 'string',
    default: "'Close'",
    description: 'Nom accessible du bouton de fermeture (français fourni via provideKtDefaultFR en lot L3).',
  },
  {
    name: 'max',
    type: 'number',
    default: '3',
    description:
      'Taille maximale de la file FIFO (affichée + en attente). Au-delà, les plus anciennes en attente sont retirées.',
  },
];

/** Tokens CSS de la snackbar, d’après `snackbar-tokens.css`. Tous dérivent du socle `--kt-*`. */
export const SNACKBAR_TOKENS: readonly TokenGroup[] = [
  {
    title: 'Surface',
    tokens: [
      {
        name: '--snackbar-bg',
        default: 'color-mix(--kt-on-surface 92%, --kt-surface)',
        description: 'Fond (surface inversée façon Material — sombre par défaut).',
      },
      { name: '--snackbar-fg', default: 'var(--kt-surface, #ffffff)', description: 'Couleur du texte.' },
      { name: '--snackbar-shadow', default: '0 4px 12px rgb(0 0 0 / 24%)', description: 'Ombre portée.' },
      { name: '--snackbar-radius', default: 'var(--kt-control-radius, 8px)', description: 'Rayon des coins.' },
    ],
  },
  {
    title: 'Géométrie & placement',
    tokens: [
      { name: '--snackbar-padding-block', default: '0.625rem', description: 'Rembourrage vertical.' },
      { name: '--snackbar-padding-inline', default: '1rem', description: 'Rembourrage horizontal.' },
      { name: '--snackbar-gap', default: '0.75rem', description: 'Écart entre icône, message et bouton.' },
      { name: '--snackbar-offset', default: '16px', description: 'Distance au bord du viewport.' },
      {
        name: '--snackbar-offset-bottom',
        default: 'calc(--snackbar-offset + env(safe-area-inset-bottom))',
        description: 'Marge basse (ancrage bottom) incluant la safe-area mobile.',
      },
      {
        name: '--snackbar-offset-top',
        default: 'calc(--snackbar-offset + env(safe-area-inset-top))',
        description: 'Marge haute (ancrage top) incluant la safe-area mobile.',
      },
      { name: '--snackbar-max-inline-size', default: '560px', description: 'Largeur maximale.' },
      { name: '--snackbar-font', default: 'var(--kt-control-font, 1rem)', description: 'Taille de police.' },
    ],
  },
  {
    title: 'Variantes',
    tokens: [
      { name: '--snackbar-icon-size', default: '1.25rem', description: 'Taille de l’icône de variante.' },
      { name: '--snackbar-accent-info', default: '#8ab4f8', description: 'Accent (icône) de la variante info.' },
      { name: '--snackbar-accent-success', default: '#81c995', description: 'Accent de la variante success.' },
      { name: '--snackbar-accent-warning', default: '#fdd663', description: 'Accent de la variante warning.' },
      { name: '--snackbar-accent-error', default: '#f28b82', description: 'Accent de la variante error.' },
      {
        name: '--snackbar-glyph-{variant}',
        default: "'info' · 'check_circle' · 'warning' · 'error'",
        description: 'Ligature de l’icône par variante (police --kt-icon-font). Surchargez pour un autre set.',
      },
    ],
  },
  {
    title: 'Bouton de fermeture',
    tokens: [
      {
        name: '--snackbar-close-size',
        default: 'var(--kt-control-height, 44px)',
        description: 'Cible tactile du bouton (AAA).',
      },
      { name: '--snackbar-close-icon-size', default: '1rem', description: 'Taille de la croix dessinée en CSS.' },
    ],
  },
  {
    title: 'Animation',
    tokens: [
      {
        name: '--snackbar-anim-duration',
        default: '150ms',
        description: 'Durée du glissement d’entrée (neutralisé si prefers-reduced-motion).',
      },
    ],
  },
];

/** Extrait d’usage TypeScript. */
export const SNACKBAR_TS_SNIPPET = `import { Component, inject } from '@angular/core';
import { KtSnackbar, provideKtSnackbar } from '@ktortu/aaa/snackbar';

// (facultatif) défauts pour toute l'app — ex. tout passer en AAA strict :
// providers: [provideKtSnackbar({ timing: 'manual' })]

@Component({ /* … */ })
export class MyComponent {
  private readonly snackbar = inject(KtSnackbar);

  save(): void {
    // Cas simple : une ligne, disparaît seule, annonce polie, focus jamais volé.
    this.snackbar.open('Brouillon enregistré');
  }

  exported(): void {
    // Variante : couleur d'accent + icône, gérées par le thème CSS (aucune logique TS).
    this.snackbar.open('Fichier exporté', { variant: 'success' });
  }

  syncDone(): void {
    // Par défaut la durée s'adapte au temps de lecture ; un NOMBRE force une durée fixe :
    this.snackbar.open('Synchronisation terminée', { duration: 8000 });
  }

  goOffline(): void {
    // AAA / persistant : reste jusqu'à fermeture explicite (Échap, bouton, ou ref.dismiss()).
    const ref = this.snackbar.open('Mode hors ligne', { timing: 'manual', variant: 'error' });
    // ref.afterDismissed().subscribe(reason => …); // 'timeout' | 'dismiss' | 'replaced'
    // ref.dismiss();                                 // fermeture programmée
  }
}`;
