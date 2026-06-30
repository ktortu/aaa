// Harness de test pour le pager d'onglets `<kt-tab-scroller>` (chevrons de défilement + overflow).
//
// INTERNE, NON PUBLIÉ (fichier `*.harness.ts` exclu du build, cf. tsconfig.lib.json).
// Conventions : cf. projects/ktortu/aaa/TESTING-HARNESSES.md.
//
// NB : l'overflow dépend du LAYOUT (scrollWidth/clientWidth) — absent en jsdom. Les tests doivent
// mocker ces dimensions (cf. tab-scroller-pager.spec.ts) pour observer un état de débordement.
import { ComponentHarness } from '@angular/cdk/testing';

/** Harness pour `<kt-tab-scroller>` (KtTabScrollerPager). */
export class KtTabScrollerPagerHarness extends ComponentHarness {
  static hostSelector = 'kt-tab-scroller';

  private readonly startChevron = this.locatorFor('.kt-tab-scroller__chevron--start');
  private readonly endChevron = this.locatorFor('.kt-tab-scroller__chevron--end');

  /** Orientation courante (`data-orientation` : horizontal | vertical). */
  async getOrientation(): Promise<string | null> {
    return (await this.host()).getAttribute('data-orientation');
  }

  /** La liste déborde-t-elle ? (`data-overflowing`). */
  async isOverflowing(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-overflowing')) !== null;
  }

  /** Peut-on défiler vers le début ? (chevron de début actif). */
  async canScrollToStart(): Promise<boolean> {
    return !(await (await this.startChevron()).getProperty<boolean>('disabled'));
  }

  /** Peut-on défiler vers la fin ? (chevron de fin actif). */
  async canScrollToEnd(): Promise<boolean> {
    return !(await (await this.endChevron()).getProperty<boolean>('disabled'));
  }

  /** Défile d'une page vers le début (clic sur le chevron de début). */
  async scrollToStart(): Promise<void> {
    await (await this.startChevron()).click();
  }

  /** Défile d'une page vers la fin (clic sur le chevron de fin). */
  async scrollToEnd(): Promise<void> {
    await (await this.endChevron()).click();
  }
}
