import { PropRow, TokenGroup } from '../../shared/doc-types';

/** Directives structurelles de la famille dialog (regroupées dans `KtDialogImports`). */
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
    type: 'Directive (dépréciée)',
    default: '—',
    description:
      'DÉPRÉCIÉE (ADR-0005) : la poignée décorative est auto-rendue par le conteneur en présentation `sheet` (opt-out : option typée `sheetHandle: false`) et la sheet s’attrape partout. Directive inerte, à retirer.',
  },
];

/** API TypeScript d’ouverture & de configuration. */
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
    name: 'KtQuickDialog.alert()',
    type: '(title, message, closeLabelOrOptions?) => DialogRef',
    default: '—',
    description:
      'Service d’aide global. Ouvre une boîte d’alerte générique pré-configurée. Accepte un libellé de fermeture ou un objet d’options contenant la variante (neutral, success, error, warning, info).',
  },
  {
    name: 'KtQuickDialog.confirm()',
    type: '(config) => Observable<boolean | undefined>',
    default: '—',
    description:
      'Service d’aide global. Ouvre une confirmation binaire (Oui/Non). Émet `true` (validation), `false` (rejet), ou `undefined` (fermeture externe/Echap).',
  },
  {
    name: 'KtQuickDialog.decide()',
    type: '(config) => Observable<KtConfirmResult | undefined>',
    default: '—',
    description:
      'Service d’aide global. Ouvre une décision ternaire (Oui/Non/Annuler). Émet `confirm`, `reject`, `cancel`, ou `undefined` (fermeture externe/Echap).',
  },
  {
    name: 'provideKtDialogDefaults()',
    type: '(overrides?) => Provider',
    default: '—',
    description:
      'Provider à ajouter à `app.config.ts` : valeurs par défaut AAA (`ariaModal`, `restoreFocus`, `autoFocus`, classes).',
  },
  {
    name: 'provideKtDialog()',
    type: '(config) => Provider',
    default: '—',
    description:
      'Provider des options MAISON du dialog (`sheetCloseButton`, `sheetCloseLabel`, `sheetHandle`) — distinct de `provideKtDialogDefaults()`, qui porte la config du CDK. Surchargeable par ouverture.',
  },
  {
    name: 'presentation',
    type: 'KtDialogPresentation',
    default: `'centered'`,
    description: 'Option de l’ouvreur : présentation choisie par le dev, résolue à chaque ouverture.',
  },
  {
    name: 'sheetCloseButton',
    type: 'boolean',
    default: 'false',
    description:
      'Bouton de fermeture auto-rendu en haut de la bottom-sheet (cible 44px, hors flux). Désactivé par défaut par COMPATIBILITÉ : `[ktDialogHeader]` ne rend aucune croix (simple rangée flex), mais on y pose usuellement la sienne — l’activer par défaut en ferait apparaître une deuxième. RECOMMANDÉ sur toute sheet qui ne pose pas déjà la sienne en tête. Sans effet hors présentation `sheet`.',
  },
  {
    name: 'sheetCloseLabel',
    type: 'string',
    default: `'Close'`,
    description: 'Nom accessible du bouton ci-dessus (WCAG 4.1.2). Traduit par `provideKtDefaultFR()` (« Fermer »).',
  },
  {
    name: 'sheetHandle',
    type: 'boolean',
    default: 'true',
    description:
      'Poignée décorative auto-rendue en présentation `sheet` (ADR-0005). Remplace le panelClass `kt-dialog--no-handle`, déprécié mais toujours honoré.',
  },
  {
    name: 'KtDialogPresentation',
    type: `'centered' | 'fullscreen' | 'sheet' | 'centered-fullscreen' | 'centered-sheet'`,
    default: `'centered'`,
    description: 'Type des présentations. Les variantes `centered-*` basculent en JS selon l’écran compact.',
  },
];

/** Tokens CSS du dialog. */
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
        description: 'Ombre portée.',
      },
      {
        name: '--dialog-scrim',
        default: 'var(--kt-sheet-scrim, rgb(0 0 0 / 40%))',
        description: 'Voile du backdrop.',
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
        description: 'Rayon des coins.',
      },
      { name: '--dialog-pad', default: '1.5rem', description: 'Rembourrage.' },
      { name: '--dialog-gap', default: '1rem', description: 'Écart vertical.' },
      { name: '--dialog-max-width', default: 'min(80dvw, 40rem)', description: 'Largeur maximale.' },
      {
        name: '--dialog-max-height',
        default: '80dvh',
        description: 'Hauteur maximale (au-delà, seul le contenu défile).',
      },
    ],
  },
  {
    title: 'Focus & défilement',
    tokens: [
      {
        name: '--dialog-focus-ring-color',
        default: 'var(--kt-focus-ring-color, #0842a0)',
        description: 'Couleur de l’anneau.',
      },
      {
        name: '--dialog-focus-ring-width',
        default: 'var(--kt-focus-ring-width, 2px)',
        description: 'Largeur de l’anneau.',
      },
    ],
  },
  {
    title: 'Bouton de fermeture de la bottom-sheet',
    tokens: [
      {
        name: '--dialog-close-inset-block-start',
        default: 'var(--kt-sheet-close-inset-block-start, 0.25rem)',
        description: 'Décalage depuis le haut de la carte.',
      },
      {
        name: '--dialog-close-inset-inline-end',
        default: 'var(--kt-sheet-close-inset-inline-end, 0.25rem)',
        description: 'Décalage depuis le bord de fin (droite en LTR).',
      },
      {
        name: '--dialog-close-size',
        default: 'var(--kt-sheet-close-size, 44px)',
        description: 'Cible tactile réelle (WCAG 2.5.5 AAA). Sert aussi de réserve au titre.',
      },
      {
        name: '--dialog-close-icon-size',
        default: 'var(--kt-sheet-close-icon-size, 1.25rem)',
        description: 'Taille du glyphe (visuellement petit dans une grande cible).',
      },
      {
        name: '--dialog-close-color',
        default: 'var(--kt-sheet-close-color, var(--dialog-muted))',
        description: 'Couleur du glyphe.',
      },
      {
        name: '--dialog-close-bg',
        default: 'transparent',
        description: 'Pastille de fond — à poser quand la croix flotte au-dessus d’un média (contraste 1.4.11).',
      },
      { name: '--dialog-close-glyph', default: `'close'`, description: 'Ligature du glyphe.' },
    ],
  },
];

/** Extrait d’import + usage type (contrat typé `defineKtDialog` + composant + ouvreur + consommateur). */
export const DIALOG_TS_SNIPPET = `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { KtButton } from '@ktortu/aaa/button';
import { KtDialogImports, defineKtDialog } from '@ktortu/aaa/dialog';

interface ProfileData { username: string; email: string; }

// Contrat typé du dialog : data + résultat déclarés UNE SEULE fois.
// data, référence et ouvreur en dérivent → aucune divergence de type possible.
const profileDialog = defineKtDialog<ProfileData, ProfileData>();

@Component({
  selector: 'app-profile-dialog',
  imports: [KtButton, KtDialogImports],
  templateUrl: './profile-dialog.html',
})
export class ProfileDialog {
  protected readonly data = profileDialog.injectData();   // ProfileData garanti
  private readonly ref = profileDialog.injectRef();        // DialogRef<ProfileData>

  // Fermeture AVEC résultat modifié typé
  protected save(updatedName: string, updatedEmail: string): void {
    this.ref.close({ username: updatedName, email: updatedEmail });
  }
}

// Ouvreur typé, co-localisé (dérive du contrat — pas de génériques à répéter)
export const injectProfileDialog = () => profileDialog.injectOpener(ProfileDialog);

// Côté consommateur : on appelle la factory, contrat 100 % typé
export class MyComponent {
  private readonly openProfile = injectProfileDialog(); // initialiseur de champ = contexte d'injection

  editProfile(current: ProfileData): void {
    this.openProfile(current).closed.subscribe((result) => {
      // result: ProfileData | undefined
    });
  }

  // La présentation est un choix du consommateur, passé à l'appel :
  openAsSheet(current: ProfileData): void {
    this.openProfile(current, { presentation: 'centered-sheet' });
  }
}`;

export const DIALOG_HTML_SNIPPET = `<!-- Template du composant de dialogue (profile-dialog.html) -->
<h2 ktDialogTitle>Modifier le profil</h2>
<div ktDialogContent>
  <p ktDialogDescription>Mettez à jour vos coordonnées publiques.</p>
  <!-- Champs de formulaire avec liaisons de données et validation... -->
  <input #nameInput [value]="data.username" placeholder="Nom d'utilisateur" />
  <input #emailInput [value]="data.email" placeholder="Adresse e-mail" />
</div>
<footer ktDialogActions>
  <!-- Annuler : fermeture SANS valeur (→ undefined) -->
  <button ktButton mode="text" ktDialogClose>Annuler</button>
  <!-- Enregistrer : fermeture AVEC résultat typé via ref.close(...) -->
  <button ktButton (click)="save(nameInput.value, emailInput.value)">Enregistrer</button>
</footer>

<!-- En-tête riche + contenu scrollable (autre composant) -->
<header ktDialogHeader>
  <h2 ktDialogTitle>Conditions Générales</h2>
  <button ktButton iconOnly icon="close" ariaLabel="Fermer" mode="text" ktDialogClose></button>
</header>
<div ktDialogContent>…</div>`;

export const DIALOG_SERVICE_SNIPPET = `import { Component, inject } from '@angular/core';
import { KtQuickDialog } from '@ktortu/aaa/dialog';

@Component({
  selector: 'app-mon-composant',
  template: \`<button (click)="supprimer()">Supprimer</button>\`,
})
export class MonComposant {
  private readonly dialog = inject(KtQuickDialog);

  // 1. Alerte simple ( supporte string ou string[] avec HTML, et option de variante )
  alerter(): void {
    this.dialog.alert(
      'Une erreur est survenue',
      ['Impossible de se connecter.', 'Veuillez réessayer plus tard.'],
      { closeLabel: 'Fermer', variant: 'error' }
    );
  }

  // 2. Confirmation binaire (Oui/Non) -> renvoie Observable<boolean | undefined>
  supprimer(): void {
    this.dialog.confirm({
      title: 'Supprimer cet élément ?',
      message: 'Cette action est définitive et détruira toutes les données.',
      color: 'danger',
      confirmLabel: 'Supprimer',
      rejectLabel: 'Conserver',
    }).subscribe((valide) => {
      if (valide === true) {
        // Supprimer
      }
    });
  }

  // 3. Décision ternaire (Oui/Non/Annuler) -> renvoie Observable<'confirm' | 'reject' | 'cancel' | undefined>
  quitter(): void {
    this.dialog.decide({
      title: 'Modifications en cours',
      message: 'Voulez-vous enregistrer vos modifications avant de quitter ?',
      confirmLabel: 'Enregistrer',
      rejectLabel: 'Ignorer',
      cancelLabel: 'Annuler',
    }).subscribe((choix) => {
      // choix: 'confirm' | 'reject' | 'cancel' | undefined (Echap)
    });
  }
}`;
