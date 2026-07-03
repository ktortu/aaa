// Harness de test pour un dialog `@ktortu/aaa` (container `kt-dialog-container`).
//
// INTERNE, NON PUBLIÉ (fichier `*.harness.ts` exclu du build, cf. tsconfig.lib.json).
// Conventions : cf. projects/ktortu/aaa/TESTING-HARNESSES.md.
//
// Le dialog s'ouvre PROGRAMMATIQUEMENT (CDK Dialog) et se rend dans l'overlay au document root :
// charger ce harness via `TestbedHarnessEnvironment.documentRootLoader(fixture)`, pas le loader de
// fixture. Pas de harness officiel CDK (le CDK ne livre que l'infra) → on construit le nôtre.
import { ComponentHarness } from '@angular/cdk/testing';

/** Harness pour le conteneur de dialog `kt-dialog-container`. */
export class KtDialogHarness extends ComponentHarness {
  static hostSelector = '.kt-dialog-container';

  private readonly titleEl = this.locatorForOptional('[ktDialogTitle]');
  private readonly descriptionEl = this.locatorForOptional('[ktDialogDescription]');
  private readonly closeButton = this.locatorForOptional('[ktDialogClose]');

  /** Rôle ARIA du conteneur (`dialog` par défaut, `alertdialog` si configuré). */
  async getRole(): Promise<string | null> {
    return (await this.host()).getAttribute('role');
  }

  /** Le dialog se déclare-t-il modal ? (`aria-modal="true"`). */
  async isModal(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-modal')) === 'true';
  }

  /** Texte du titre (`[ktDialogTitle]` ; chaîne vide si absent). */
  async getTitle(): Promise<string> {
    const el = await this.titleEl();
    return el ? (await el.text()).trim() : '';
  }

  /** Texte de la description (`[ktDialogDescription]` ; chaîne vide si absente). */
  async getDescription(): Promise<string> {
    const el = await this.descriptionEl();
    return el ? (await el.text()).trim() : '';
  }

  /**
   * Clique le bouton `[ktDialogClose]` (ferme sans résultat).
   * NB : la fermeture est ANIMÉE — `ref.closed` n'émet qu'après l'animation. Côté test, attendre
   * `ref.closed` ou avancer les timers (fake timers) ; ne pas se fier à `whenStable()` seul.
   */
  async close(): Promise<void> {
    const button = await this.closeButton();
    if (!button) {
      throw new Error('KtDialogHarness: aucun [ktDialogClose] dans le dialog.');
    }
    await button.click();
  }

  /** Variante de l'alerte ('success', 'error', 'warning', 'info' ou 'neutral' ; null si absent). */
  async getVariant(): Promise<string | null> {
    const el = await this.locatorForOptional('kt-alert-dialog')();
    return el ? el.getAttribute('data-variant') : null;
  }
}
