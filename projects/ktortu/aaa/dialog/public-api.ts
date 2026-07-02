import { KtDialogTitle } from './dialog-title.directive';
import { KtDialogDescription } from './dialog-description.directive';
import { KtDialogClose } from './dialog-close.directive';
import {
  KtDialogHeader,
  KtDialogContent,
  KtDialogActions,
  KtDialogFocusInitial,
  KtDialogSheetHandle,
} from './dialog-structure';

export * from './dialog-title.directive';
export * from './dialog-description.directive';
export * from './dialog-close.directive';
export * from './dialog-structure';
export * from './dialog-config';
// Point d'entrée recommandé pour implémenter un dialog : `defineKtDialog<Data, Résultat>()`
// (contrat typé co-localisé → injectData / injectRef / injectOpener). La fonction bas-niveau
// `injectKtDialogOpener` reste exportée mais est à éviter par défaut.
export * from './dialog-opener';
export * from './dialog-container';

/**
 * Import ergonomique de toute la famille dialog en une fois :
 * `imports: [KtDialogImports]` au lieu d'énumérer chaque directive structurelle.
 */
export const KtDialogImports = [
  KtDialogHeader,
  KtDialogTitle,
  KtDialogDescription,
  KtDialogContent,
  KtDialogActions,
  KtDialogClose,
  KtDialogFocusInitial,
  KtDialogSheetHandle,
] as const;

export * from './dialog-helpers';

