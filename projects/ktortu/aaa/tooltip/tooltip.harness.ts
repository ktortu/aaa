// Harness de test pour l'infobulle `[ktTooltip]` (nœud `role="tooltip"` rendu dans le body).
//
// INTERNE, NON PUBLIÉ (fichier `*.harness.ts` exclu du build, cf. tsconfig.lib.json).
// Conventions : cf. projects/ktortu/aaa/TESTING-HARNESSES.md.
//
// Lecture seule, par CONCEPTION : l'infobulle est créée dans `document.body` (overlay) à l'affichage
// → charger via `TestbedHarnessEnvironment.documentRootLoader(fixture)`. L'AFFICHAGE reste piloté par
// le test (survol/focus du déclencheur + délai), car il dépend d'événements + timers et le
// déclencheur n'a pas de marqueur DOM ciblable (binding de propriété `[ktTooltip]`).
import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';

/** Critères de ciblage d'un `KtTooltipHarness`. */
export interface KtTooltipHarnessFilters extends BaseHarnessFilters {
  /** Filtre par texte de l'infobulle. */
  text?: string | RegExp;
}

/** Harness pour le nœud `role="tooltip"` rendu par `[ktTooltip]`. */
export class KtTooltipHarness extends ComponentHarness {
  static hostSelector = '.kt-tooltip';

  static with(filters: KtTooltipHarnessFilters = {}): HarnessPredicate<KtTooltipHarness> {
    return new HarnessPredicate(KtTooltipHarness, filters).addOption('text', filters.text, (harness, text) =>
      HarnessPredicate.stringMatches(harness.getText(), text),
    );
  }

  /** Texte (ou texte agrégé du contenu riche) de l'infobulle. */
  async getText(): Promise<string> {
    return (await (await this.host()).text()).trim();
  }

  /** Rôle ARIA (`tooltip`). */
  async getRole(): Promise<string | null> {
    return (await this.host()).getAttribute('role');
  }

  /** Id du nœud tooltip (cible de `aria-describedby` du déclencheur). */
  async getId(): Promise<string | null> {
    return (await this.host()).getAttribute('id');
  }

  /** Position résolue (`data-position` : top, bottom, left, right). */
  async getPosition(): Promise<string | null> {
    return (await this.host()).getAttribute('data-position');
  }
}
