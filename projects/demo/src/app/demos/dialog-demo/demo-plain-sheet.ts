import { ChangeDetectionStrategy, Component } from '@angular/core';

import { KtButton } from '@ktortu/aaa/button';
import { KtDialogImports, defineKtDialog } from '@ktortu/aaa/dialog';

/** Contrat typé : aucune donnée, aucun résultat — la sheet est purement informative. */
const plainSheet = defineKtDialog<void, void>();

/**
 * Bottom-sheet à titre nu, sans bouton de fermeture posé à la main. C'est LE cas où la croix
 * auto-rendue (`sheetCloseButton`) a du sens : la sortie ne dépend plus de la découverte du geste
 * de glissement ni du tap au-dessus de la carte.
 *
 * À l'inverse, `DemoContentDialog` pose SA PROPRE croix dans un `[ktDialogHeader]` (le header ne
 * rend rien de lui-même : c'est bien le composant qui l'écrit). Y activer l'option produirait donc
 * une DOUBLE croix — le conteneur avertit alors en mode dev.
 */
@Component({
  selector: 'kt-demo-plain-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KtButton, KtDialogImports],
  template: `
    <h2 ktDialogTitle>Partager ce document</h2>
    <div ktDialogDescription>Choisissez une destination. Le lien reste valable 30 jours.</div>
    <div ktDialogContent>
      <p>Aucun en-tête riche ici : le bouton de fermeture est rendu par le conteneur, hors du flux.</p>
    </div>
    <footer ktDialogActions>
      <button ktButton ktDialogFocusInitial ktDialogClose>Copier le lien</button>
    </footer>
  `,
})
export class DemoPlainSheet {}

/**
 * Ouvreur AVEC la croix auto-rendue. L'option est posée ICI (config de l'ouvreur) plutôt qu'en
 * global : la démo ouvre le MÊME composant avec et sans, pour rendre l'écart visible.
 */
export const injectPlainSheet = () =>
  plainSheet.injectOpener(DemoPlainSheet, { presentation: 'sheet', sheetCloseButton: true });

/**
 * Témoin : le même composant SANS l'option (défaut de la lib). Aucune croix — la sortie repose
 * alors uniquement sur le glissement, le tap au-dessus de la carte et Échap. C'est exactement ce
 * que l'option ajoute.
 */
export const injectPlainSheetWithoutClose = () => plainSheet.injectOpener(DemoPlainSheet, { presentation: 'sheet' });
