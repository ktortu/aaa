// Harness de test pour la primitive d'icône autonome `[ktIcon]`.
//
// INTERNE, NON PUBLIÉ (fichier `*.harness.ts` exclu du build, cf. tsconfig.lib.json).
// Conventions : cf. projects/ktortu/aaa/TESTING-HARNESSES.md.
//
// ARIA-first : on cible l'hôte de la directive et on lit son contrat observable (nom de ligature via
// `data-icon`, caractère décoratif via `aria-hidden`, nom accessible via `role`/`aria-label`).
import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';

/** Critères de ciblage d'un `KtIconHarness`. */
export interface KtIconHarnessFilters extends BaseHarnessFilters {
  /** Filtre par nom d'icône (ligature, attribut `data-icon`). */
  name?: string | RegExp;
}

/** Harness pour l'hôte d'une directive `[ktIcon]` (ciblé par sa classe stable `.kt-icon`). */
export class KtIconHarness extends ComponentHarness {
  static hostSelector = '.kt-icon';

  static with(filters: KtIconHarnessFilters = {}): HarnessPredicate<KtIconHarness> {
    return new HarnessPredicate(KtIconHarness, filters).addOption('name', filters.name, async (harness, name) =>
      HarnessPredicate.stringMatches((await harness.getName()) ?? '', name),
    );
  }

  /** Nom de l'icône rendue en ligature (`data-icon`), ou `null` en mode projeté. */
  async getName(): Promise<string | null> {
    return (await this.host()).getAttribute('data-icon');
  }

  /** L'icône est-elle décorative (`aria-hidden="true"`, cas par défaut) ? */
  async isDecorative(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-hidden')) === 'true';
  }

  /** Nom accessible (`aria-label`) quand l'icône est porteuse de sens, sinon `null`. */
  async getAriaLabel(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-label');
  }

  /** Rôle ARIA (`img` quand un `ariaLabel` est fourni, sinon `null`). */
  async getRole(): Promise<string | null> {
    return (await this.host()).getAttribute('role');
  }
}
