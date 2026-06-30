import { PropRow, TokenGroup } from '../../shared/doc-types';

/** Directives structurelles de la famille dialog (regroupées dans `KtDialogImports`). Voir les sources
    sous `@ktortu/aaa/dialog`. Sélecteurs sans logique, sauf `[ktDialogClose]` et `[ktDialogSheetHandle]`. */
export const DIALOG_DIRECTIVE_PROPS: readonly PropRow[] = [
  {
    name: 'KtDialogImports',
    type: 'Directive[]',
    default: '—',
    description: 'Tableau regroupant les 8 directives ci-dessous, à passer tel quel dans `imports`.',
  },
  {
    name: '[ktDialogTitle]',
    type: 'Directive',
    default: '—',
    description: 'Titre visible (idéalement un `<h2>`) ; câble `aria-labelledby` du conteneur.',
  },
  {
    name: '[ktDialogDescription]',
    type: 'Directive',
    default: '—',
    description:
      'Phrase de contexte courte ; câble `aria-describedby`. À réserver à une phrase (jamais un formulaire).',
  },
  {
    name: '[ktDialogHeader]',
    type: 'Directive',
    default: '—',
    description: 'En-tête riche (rangée flex) pour composer icône + titre + bouton de fermeture.',
  },
  {
    name: '[ktDialogContent]',
    type: 'Directive',
    default: '—',
    description: 'Zone de contenu : seule région scrollable, avec voiles d’ombre quand le contenu déborde.',
  },
  {
    name: '[ktDialogActions]',
    type: 'Directive',
    default: '—',
    description: 'Barre d’actions (rangée de boutons) épinglée en pied (sticky), au-dessus du contenu.',
  },
  {
    name: '[ktDialogClose]',
    type: 'Directive (input `dialogResult`)',
    default: 'undefined',
    description:
      'Ferme au clic et renvoie un résultat optionnel via l’alias `ktDialogClose` (ex. `[ktDialogClose]="\'ok\'"`). Force `type="button"`.',
  },
  {
    name: '[ktDialogFocusInitial]',
    type: 'Directive',
    default: '—',
    description: 'Marque l’élément à focaliser à l’ouverture (cible de `autoFocus`, posée par défaut).',
  },
  {
    name: '[ktDialogSheetHandle]',
    type: 'Directive',
    default: '—',
    description: 'Poignée de préhension (drag-to-dismiss) active uniquement en présentation `sheet`. Décorative.',
  },
];

/** API TypeScript d’ouverture & de configuration (cf. `dialog-opener.ts` / `dialog-config.ts`). */
export const DIALOG_API_PROPS: readonly PropRow[] = [
  {
    name: 'defineKtDialog<D, R>()',
    type: '() => { injectData, injectRef, injectOpener }',
    default: '—',
    description:
      'RECOMMANDÉ. Définit le contrat typé du dialog (données `D` + résultat `R`) une seule fois. Renvoie `injectData()` (données), `injectRef()` (référence dont `close()` n’accepte que `R`) et `injectOpener(component)` (ouvreur co-localisé) — tous liés aux mêmes types, donc sans divergence possible.',
  },
  {
    name: 'contract.injectRef()',
    type: '() => DialogRef<R>',
    default: '—',
    description:
      'Dans le composant : référence typée du dialog. `close(result?)` n’accepte que le résultat `R` (fermeture sûre). Fermer sans valeur (annuler) reste possible via la directive `[ktDialogClose]`.',
  },
  {
    name: 'injectKtDialogOpener()',
    type: '(component, baseConfig?) => opener',
    default: '—',
    description:
      'Bas-niveau (utilisé par `defineKtDialog`). Crée un ouvreur typé en répétant les génériques `<Composant, Data, Résultat>`. Préférer `defineKtDialog` qui lie les types.',
  },
  {
    name: 'provideKtDialogDefaults()',
    type: '(overrides?) => Provider',
    default: '—',
    description:
      'Provider à ajouter à `app.config.ts` : valeurs par défaut AAA (`ariaModal`, `restoreFocus`, `autoFocus`, classes).',
  },
  {
    name: 'presentation',
    type: 'KtDialogPresentation',
    default: `'centered'`,
    description: 'Option de l’ouvreur : présentation choisie par le dev, résolue à chaque ouverture.',
  },
  {
    name: 'KtDialogPresentation',
    type: `'centered' | 'fullscreen' | 'sheet' | 'centered-fullscreen' | 'centered-sheet'`,
    default: `'centered'`,
    description: 'Type des présentations. Les variantes `centered-*` basculent en JS selon l’écran compact.',
  },
];

/** Tokens CSS du dialog, groupés d’après `dialog.css`. Couleurs/surfaces dérivées du socle `--kt-*`
    et des tokens « feuille/popup » du select (identité visuelle partagée des surfaces flottantes). */
export const DIALOG_TOKENS: readonly TokenGroup[] = [
  {
    title: 'Surface',
    tokens: [
      { name: '--dialog-bg', default: 'var(--kt-surface, #ffffff)', description: 'Fond de la fenêtre.' },
      { name: '--dialog-fg', default: 'var(--kt-on-surface, #1f1f1f)', description: 'Couleur du texte / titre.' },
      { name: '--dialog-muted', default: 'var(--kt-muted, #474747)', description: 'Couleur de la description.' },
      { name: '--dialog-border-color', default: 'var(--kt-outline, #c4c7c5)', description: 'Bordure de la fenêtre.' },
      { name: '--dialog-border-width', default: '1px', description: 'Épaisseur de la bordure.' },
      {
        name: '--dialog-shadow',
        default: 'var(--select-popup-shadow, 0 10px 25px rgb(0 0 0 / 20%))',
        description: 'Ombre portée (réutilise l’ombre de popup du select si le thème la pose).',
      },
      {
        name: '--dialog-scrim',
        default: 'var(--kt-sheet-scrim, rgb(0 0 0 / 40%))',
        description: 'Voile du backdrop derrière la fenêtre.',
      },
      { name: '--dialog-backdrop-filter', default: 'none', description: 'Flou de la surface (thèmes verre).' },
      { name: '--dialog-scrim-backdrop-filter', default: 'none', description: 'Flou appliqué au backdrop.' },
    ],
  },
  {
    title: 'Géométrie & espacement',
    tokens: [
      {
        name: '--dialog-radius',
        default: 'var(--kt-sheet-radius, var(--kt-control-radius, 8px))',
        description: 'Rayon des coins de la fenêtre.',
      },
      { name: '--dialog-pad', default: '1.5rem', description: 'Rembourrage des régions (titre, contenu, actions).' },
      { name: '--dialog-gap', default: '1rem', description: 'Écart vertical entre les régions.' },
      { name: '--dialog-max-width', default: '32rem', description: 'Largeur maximale (présentation centrée).' },
    ],
  },
  {
    title: 'Focus & défilement',
    tokens: [
      {
        name: '--dialog-focus-ring-color',
        default: 'var(--kt-focus-ring-color, #0842a0)',
        description: 'Couleur de l’anneau de focus des éléments internes.',
      },
      {
        name: '--dialog-focus-ring-width',
        default: 'var(--kt-focus-ring-width, 2px)',
        description: 'Largeur de l’anneau de focus.',
      },
      {
        name: '--dialog-scrollbar-thumb',
        default: 'color-mix(--dialog-fg 26%, --dialog-bg)',
        description: 'Couleur du curseur de la gouttière fine du contenu (dérivée de la surface).',
      },
      {
        name: '--dialog-scrollbar-color',
        default: 'curseur + piste transparente',
        description: 'Couleur complète `scrollbar-color` du contenu (override de la gouttière).',
      },
      {
        name: '--dialog-scroll-shadow',
        default: 'radial-gradient(… 16%)',
        description: 'Voile d’ombre sous le header, visible quand le contenu déborde par le haut.',
      },
      {
        name: '--dialog-scroll-shadow-bottom',
        default: 'radial-gradient(… 16%)',
        description: 'Voile d’ombre au-dessus des actions, visible quand le contenu déborde par le bas.',
      },
    ],
  },
  {
    title: 'Animation',
    tokens: [
      { name: '--dialog-anim-duration', default: '160ms', description: 'Durée de l’animation d’entrée.' },
      { name: '--dialog-anim-easing', default: 'ease', description: 'Courbe de l’animation d’entrée.' },
      {
        name: '--dialog-anim-from-transform',
        default: 'translateY(8px) scale(0.97)',
        description: 'Transform initial de l’entrée (présentation centrée).',
      },
    ],
  },
  {
    title: 'Typographie du titre',
    tokens: [
      { name: '--dialog-title-font', default: 'inherit', description: 'Police du titre.' },
      { name: '--dialog-title-size', default: '1.25rem', description: 'Taille du titre.' },
      { name: '--dialog-title-weight', default: '600', description: 'Graisse du titre.' },
    ],
  },
  {
    title: 'Bottom-sheet (tokens --kt-sheet-* partagés)',
    tokens: [
      { name: '--kt-sheet-radius', default: '16px', description: 'Rayon des coins hauts de la feuille (mode sheet).' },
      { name: '--kt-sheet-max-block-size', default: '85svh', description: 'Hauteur maximale de la feuille.' },
      {
        name: '--kt-sheet-shadow',
        default: '0 -4px 16px rgb(0 0 0 / 12%)',
        description: 'Ombre portée de la feuille.',
      },
      { name: '--kt-sheet-anim-duration', default: '120ms', description: 'Durée du glissement d’entrée.' },
      { name: '--kt-sheet-exit-duration', default: '90ms', description: 'Durée du glissement de sortie.' },
      {
        name: '--kt-sheet-grab-color',
        default: 'var(--kt-outline, #c4c7c5)',
        description: 'Couleur de la poignée de préhension.',
      },
    ],
  },
];

/** Extrait d’import + usage type (contrat typé `defineKtDialog` + composant + ouvreur + consommateur). */
export const DIALOG_TS_SNIPPET = `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { KtButton } from '@ktortu/aaa/button';
import { KtDialogImports, defineKtDialog } from '@ktortu/aaa/dialog';

interface ConfirmData { name: string; }

// Contrat typé du dialog : data + résultat déclarés UNE SEULE fois.
// data, référence et ouvreur en dérivent → aucune divergence de type possible.
const confirmDialog = defineKtDialog<ConfirmData, 'confirm'>();

@Component({
  selector: 'app-confirm-dialog',
  imports: [KtButton, KtDialogImports],
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialog {
  protected readonly data = confirmDialog.injectData();   // ConfirmData garanti
  private readonly ref = confirmDialog.injectRef();        // DialogRef<'confirm'>

  // Fermeture AVEC résultat → typée : seul 'confirm' est accepté.
  protected confirm(): void {
    this.ref.close('confirm');
  }
}

// Ouvreur typé, co-localisé (dérive du contrat — pas de génériques à répéter)
export const injectConfirmDialog = () => confirmDialog.injectOpener(ConfirmDialog);

// Côté consommateur : on appelle la factory, contrat 100 % typé
export class MyComponent {
  private readonly openConfirm = injectConfirmDialog(); // initialiseur de champ = contexte d'injection

  remove(name: string): void {
    this.openConfirm({ name }).closed.subscribe((result) => {
      // result: 'confirm' | undefined
    });
  }

  // La présentation est un choix du consommateur, passé à l'appel :
  openCentered(name: string): void {
    this.openConfirm({ name }, { presentation: 'centered-sheet' });
  }
}`;

export const DIALOG_HTML_SNIPPET = `<!-- Template du composant de dialogue (confirm-dialog.html) -->
<h2 ktDialogTitle>Supprimer le fichier ?</h2>
<p ktDialogDescription>« {{ data.name }} » sera supprimé définitivement.</p>
<footer ktDialogActions>
  <!-- Annuler : fermeture SANS valeur (→ undefined) -->
  <button ktButton mode="text" ktDialogFocusInitial ktDialogClose>Annuler</button>
  <!-- Confirmer : fermeture AVEC résultat typé via ref.close('confirm') -->
  <button ktButton color="danger" (click)="confirm()">Supprimer</button>
</footer>

<!-- En-tête riche + contenu scrollable (autre composant) -->
<header ktDialogHeader>
  <h2 ktDialogTitle>Conditions</h2>
  <button ktButton iconOnly icon="close" ariaLabel="Fermer" mode="text" ktDialogClose></button>
</header>
<div ktDialogContent>…</div>`;
