// Harness de test pour `kt-field` (chrome de champ : label, hint, erreurs, marqueur requis).
//
// INTERNE, NON PUBLIÉ (fichier `*.harness.ts` exclu du build, cf. tsconfig.lib.json).
// Conventions : cf. projects/ktortu/aaa/TESTING-HARNESSES.md.
import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';

/** Critères de ciblage d'un `KtFieldHarness`. */
export interface KtFieldHarnessFilters extends BaseHarnessFilters {
  /** Filtre par texte du label. */
  label?: string | RegExp;
}

/** Harness pour `kt-field`. Composable : peut être renvoyé par le harness d'un contrôle. */
export class KtFieldHarness extends ComponentHarness {
  static hostSelector = 'kt-field';

  static with(filters: KtFieldHarnessFilters = {}): HarnessPredicate<KtFieldHarness> {
    return new HarnessPredicate(KtFieldHarness, filters).addOption('label', filters.label, (harness, label) =>
      HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  private readonly labelEl = this.locatorForOptional('.kt-field__label');
  private readonly hintEl = this.locatorForOptional('.kt-field__hint');
  private readonly requiredMarker = this.locatorForOptional('.kt-field__required');
  private readonly errorMessageEls = this.locatorForAll('.kt-field__error-message');

  /** Texte du label (hors marqueur requis « * » ; chaîne vide si absent). */
  async getLabel(): Promise<string> {
    const el = await this.labelEl();
    return el ? (await el.text({ exclude: '.kt-field__required' })).trim() : '';
  }

  /** Texte de l'indice (chaîne vide si absent ou masqué). */
  async getHint(): Promise<string> {
    const el = await this.hintEl();
    return el ? (await el.text()).trim() : '';
  }

  /** Le champ est-il marqué obligatoire ? (présence du marqueur requis). */
  async isRequired(): Promise<boolean> {
    return (await this.requiredMarker()) !== null;
  }

  /** Messages d'erreur actuellement affichés. */
  async getErrorMessages(): Promise<string[]> {
    return Promise.all((await this.errorMessageEls()).map(async (e) => (await e.text()).trim()));
  }

  /** Au moins une erreur est-elle affichée ? */
  async hasError(): Promise<boolean> {
    return (await this.errorMessageEls()).length > 0;
  }
}
