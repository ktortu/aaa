// Harness de test pour `KtSnackbar` (notifications montées dans l'overlay par le service).
//
// INTERNE, NON PUBLIÉ (fichier `*.harness.ts` exclu du build, cf. tsconfig.lib.json).
// Conventions : cf. projects/ktortu/aaa/TESTING-HARNESSES.md.
//
// La snackbar est ouverte par le SERVICE (`KtSnackbar.open()`) et rendue dans l'overlay au document
// root : charger ce harness via `TestbedHarnessEnvironment.documentRootLoader(fixture)`. Plusieurs
// snackbars peuvent coexister (FIFO) → `getAllHarnesses` + filtre `with({ text })`.
import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';

/** Critères de ciblage d'un `KtSnackbarHarness`. */
export interface KtSnackbarHarnessFilters extends BaseHarnessFilters {
  /** Filtre par texte du message. */
  text?: string | RegExp;
}

/** Harness pour une snackbar `KtSnackbar`. */
export class KtSnackbarHarness extends ComponentHarness {
  static hostSelector = '.kt-snackbar';

  static with(filters: KtSnackbarHarnessFilters = {}): HarnessPredicate<KtSnackbarHarness> {
    return new HarnessPredicate(KtSnackbarHarness, filters).addOption('text', filters.text, (harness, text) =>
      HarnessPredicate.stringMatches(harness.getMessage(), text),
    );
  }

  private readonly messageEl = this.locatorFor('.kt-snackbar__message');
  private readonly iconEl = this.locatorForOptional('.kt-snackbar__icon');
  private readonly closeButton = this.locatorForOptional('.kt-snackbar__close');

  /** Texte du message affiché. */
  async getMessage(): Promise<string> {
    return (await (await this.messageEl()).text()).trim();
  }

  /** Variante (`data-variant` : success, error, warning… ou neutral). */
  async getVariant(): Promise<string | null> {
    return (await this.host()).getAttribute('data-variant');
  }

  /** Une icône de variante (décorative) est-elle présente ? (absente pour `neutral`). */
  async hasIcon(): Promise<boolean> {
    return (await this.iconEl()) !== null;
  }

  /** La snackbar a-t-elle un bouton de fermeture ? (option `closable`). */
  async isClosable(): Promise<boolean> {
    return (await this.closeButton()) !== null;
  }

  /** Clique le bouton de fermeture. NB : la disparition est animée (piloter le timing en test). */
  async dismiss(): Promise<void> {
    const button = await this.closeButton();
    if (!button) {
      throw new Error('KtSnackbarHarness: cette snackbar n’a pas de bouton de fermeture (non closable).');
    }
    await button.click();
  }
}
