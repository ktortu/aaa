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
