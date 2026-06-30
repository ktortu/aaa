// Harness de test pour la famille Disclosure ([ktDisclosure] + déclencheur + panneau).
//
// INTERNE, NON PUBLIÉ (fichier `*.harness.ts` exclu du build, cf. tsconfig.lib.json).
// Conventions : cf. projects/ktortu/aaa/TESTING-HARNESSES.md. ARIA-first, états observables,
// sans timer (l'état est porté par `data-expanded` / `aria-expanded`, pas par l'animation).
import { ComponentHarness } from '@angular/cdk/testing';

/** Harness pour `[ktDisclosure]`. */
export class KtDisclosureHarness extends ComponentHarness {
  static hostSelector = '[ktDisclosure]';

  private readonly toggle = this.locatorFor('[ktDisclosureToggle]');
  private readonly content = this.locatorFor('kt-disclosure-content');

  /** Le panneau est-il ouvert ? (`data-expanded` sur l'hôte). */
  async isExpanded(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-expanded')) === 'true';
  }

  /** Ouvre le panneau s'il est fermé (clic sur le déclencheur). */
  async expand(): Promise<void> {
    if (!(await this.isExpanded())) {
      await (await this.toggle()).click();
    }
  }

  /** Ferme le panneau s'il est ouvert (clic sur le déclencheur). */
  async collapse(): Promise<void> {
    if (await this.isExpanded()) {
      await (await this.toggle()).click();
    }
  }

  /** Bascule l'état (clic sur le déclencheur). */
  async toggleExpansion(): Promise<void> {
    await (await this.toggle()).click();
  }

  /** Le panneau est-il `inert` ? (masqué = inerte). */
  async isContentInert(): Promise<boolean> {
    return (await (await this.content()).getAttribute('inert')) !== null;
  }

  /** Texte courant du déclencheur (ex. « Voir plus » / « Voir moins »). */
  async getToggleText(): Promise<string> {
    return (await this.toggle()).text();
  }

  /** Texte du contenu du panneau. */
  async getContentText(): Promise<string> {
    return (await this.content()).text();
  }
}
