import { Component, Type, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Tab, TabList, Tabs } from '@angular/aria/tabs';
import { KtTabScroller } from './tab-scroller';

@Component({
  imports: [KtTabScroller, TabList, Tab, Tabs],
  template: `
    <div ngTabs>
      <ul ngTabList ktTabScroller [(selectedTab)]="selected">
        @for (t of tabs(); track t) {
          <li ngTab [value]="t">{{ t }}</li>
        }
      </ul>
    </div>
  `,
})
class HorizontalHost {
  tabs = signal(['a', 'b', 'c', 'd']);
  selected = signal<string | undefined>('d');
}

@Component({
  imports: [KtTabScroller, TabList, Tab, Tabs],
  // `orientation="vertical"` est un attribut statique : il alimente l'input ET reste présent
  // dans le DOM, ce qui rend la détection d'orientation de la directive déterministe en test.
  template: `
    <div ngTabs>
      <ul ngTabList ktTabScroller orientation="vertical" [(selectedTab)]="selected">
        @for (t of tabs(); track t) {
          <li ngTab [value]="t">{{ t }}</li>
        }
      </ul>
    </div>
  `,
})
class VerticalHost {
  tabs = signal(['a', 'b', 'c', 'd']);
  selected = signal<string | undefined>('d');
}

/** ResizeObserver absent de jsdom : mock capturant le callback pour pouvoir le déclencher. */
class MockResizeObserver {
  static instances: MockResizeObserver[] = [];
  private readonly cb: ResizeObserverCallback;
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
    MockResizeObserver.instances.push(this);
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  trigger(): void {
    this.cb([], this as unknown as ResizeObserver);
  }
}

describe('KtTabScroller', () => {
  // jsdom n'implémente ni scrollTo/scrollBy ni la géométrie de layout : on les installe en mock.
  const originalScrollTo = HTMLElement.prototype.scrollTo;
  const originalScrollBy = HTMLElement.prototype.scrollBy;
  const originalMatchMedia = window.matchMedia;
  let scrollSpy: ReturnType<typeof vi.fn>;
  let scrollBySpy: ReturnType<typeof vi.fn>;

  // Géométrie pilotable (pour les métriques de débordement).
  let mockScrollLeft = 0;
  let mockScrollTop = 0;
  let mockScrollWidth = 800;
  let mockScrollHeight = 800;

  function mockReducedMotion(matches: boolean): void {
    window.matchMedia = vi.fn().mockReturnValue({ matches }) as unknown as typeof window.matchMedia;
  }

  async function createHost<T>(type: Type<T>, setup?: (host: T) => void): Promise<ComponentFixture<T>> {
    const fixture = TestBed.createComponent(type);
    setup?.(fixture.componentInstance);
    fixture.detectChanges();
    await fixture.whenStable(); // laisse jouer afterRenderEffect + afterNextRender (mesure + observers)
    return fixture;
  }

  function directiveOf(fixture: ComponentFixture<unknown>): KtTabScroller {
    return fixture.debugElement.query(By.directive(KtTabScroller)).injector.get(KtTabScroller);
  }

  function listOf(fixture: ComponentFixture<unknown>): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector('[ngTabList]')!;
  }

  beforeEach(() => {
    scrollSpy = vi.fn();
    scrollBySpy = vi.fn();
    HTMLElement.prototype.scrollTo = scrollSpy as unknown as HTMLElement['scrollTo'];
    HTMLElement.prototype.scrollBy = scrollBySpy as unknown as HTMLElement['scrollBy'];
    mockReducedMotion(false);
    MockResizeObserver.instances = [];
    vi.stubGlobal('ResizeObserver', MockResizeObserver);

    mockScrollLeft = 0;
    mockScrollTop = 0;
    mockScrollWidth = 800;
    mockScrollHeight = 800;

    // Conteneur 300px, onglet 100px. L'onglet 'd' est hors-champ (offset 400) sur les deux axes.
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 300 });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => 300 });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => 100 });
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => 100 });
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, get: () => mockScrollWidth });
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, get: () => mockScrollHeight });
    Object.defineProperty(HTMLElement.prototype, 'scrollLeft', {
      configurable: true,
      get: () => mockScrollLeft,
      set: () => {},
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
      configurable: true,
      get: () => mockScrollTop,
      set: () => {},
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetLeft', {
      configurable: true,
      get(this: HTMLElement) {
        return this.textContent?.trim() === 'd' ? 400 : 0;
      },
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
      configurable: true,
      get(this: HTMLElement) {
        return this.textContent?.trim() === 'd' ? 400 : 0;
      },
    });

    TestBed.configureTestingModule({ imports: [HorizontalHost, VerticalHost] });
  });

  afterEach(() => {
    HTMLElement.prototype.scrollTo = originalScrollTo;
    HTMLElement.prototype.scrollBy = originalScrollBy;
    window.matchMedia = originalMatchMedia;
    for (const prop of [
      'clientWidth',
      'clientHeight',
      'offsetWidth',
      'offsetHeight',
      'scrollWidth',
      'scrollHeight',
      'scrollLeft',
      'scrollTop',
      'offsetLeft',
      'offsetTop',
    ]) {
      delete (HTMLElement.prototype as unknown as Record<string, unknown>)[prop];
    }
  });

  function selectedTabText(el: HTMLElement): string | null | undefined {
    return el.querySelector('[ngTab][aria-selected="true"]')?.textContent;
  }

  // ============================================================
  // Scroll-into-view (comportement historique de KtTabScroll)
  // ============================================================
  describe('scroll-into-view — horizontal', () => {
    it('défile précisément vers l’onglet sélectionné hors-champ au montage', async () => {
      const fixture = await createHost(HorizontalHost);
      expect(scrollSpy).toHaveBeenCalledWith({ left: 200, behavior: 'smooth' });
      expect(selectedTabText(fixture.nativeElement)).toContain('d');
    });

    it('défile vers le nouvel onglet quand la sélection change par programme', async () => {
      const fixture = await createHost(HorizontalHost, (host) => host.selected.set('a'));
      scrollSpy.mockClear();

      fixture.componentInstance.selected.set('d');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(scrollSpy).toHaveBeenCalledWith({ left: 200, behavior: 'smooth' });
    });
  });

  describe('scroll-into-view — vertical', () => {
    it('défile sur l’axe vertical vers l’onglet hors-champ au montage', async () => {
      await createHost(VerticalHost);
      expect(scrollSpy).toHaveBeenCalledWith({ top: 200, behavior: 'smooth' });
    });
  });

  describe('scroll-into-view — garde-fous', () => {
    it('ne défile pas quand l’onglet sélectionné est déjà visible', async () => {
      await createHost(HorizontalHost, (host) => host.selected.set('a'));
      expect(scrollSpy).not.toHaveBeenCalled();
    });

    it('ne défile pas quand aucun onglet n’est sélectionné', async () => {
      await createHost(HorizontalHost, (host) => host.selected.set(undefined));
      expect(scrollSpy).not.toHaveBeenCalled();
    });
  });

  describe('scroll-into-view — prefers-reduced-motion', () => {
    it('utilise behavior:"auto" quand l’utilisateur a demandé à réduire les animations', async () => {
      mockReducedMotion(true);
      await createHost(HorizontalHost);
      expect(scrollSpy).toHaveBeenCalledWith({ left: 200, behavior: 'auto' });
    });
  });

  // ============================================================
  // Pagination — métriques réactives
  // ============================================================
  describe('métriques de débordement', () => {
    it('au montage (scrollLeft 0, contenu débordant) : début non scrollable, fin scrollable', async () => {
      const fixture = await createHost(HorizontalHost, (host) => host.selected.set('a')); // évite le scroll-into-view
      const dir = directiveOf(fixture);
      expect(dir.overflowing()).toBe(true);
      expect(dir.canScrollStart()).toBe(false);
      expect(dir.canScrollEnd()).toBe(true);
      expect(dir.orientation()).toBe('horizontal');
    });

    it('remesure après un événement scroll : à fond à droite → fin non scrollable, début scrollable', async () => {
      const fixture = await createHost(HorizontalHost, (host) => host.selected.set('a'));
      const dir = directiveOf(fixture);

      mockScrollLeft = 500; // max = scrollWidth(800) − clientWidth(300)
      listOf(fixture).dispatchEvent(new Event('scroll'));

      expect(dir.canScrollStart()).toBe(true);
      expect(dir.canScrollEnd()).toBe(false);
    });

    it('remesure via ResizeObserver : plus de débordement → aucun côté scrollable', async () => {
      const fixture = await createHost(HorizontalHost, (host) => host.selected.set('a'));
      const dir = directiveOf(fixture);

      mockScrollWidth = 200; // < clientWidth(300)
      MockResizeObserver.instances.at(-1)!.trigger();

      expect(dir.overflowing()).toBe(false);
      expect(dir.canScrollStart()).toBe(false);
      expect(dir.canScrollEnd()).toBe(false);
    });

    it('orientation verticale reflétée par le signal', async () => {
      const fixture = await createHost(VerticalHost, (host) => host.selected.set('a'));
      expect(directiveOf(fixture).orientation()).toBe('vertical');
    });
  });

  // ============================================================
  // Pagination — scrollByPage
  // ============================================================
  describe('scrollByPage', () => {
    it('défile d’environ 80% de la largeur visible vers la fin', async () => {
      const fixture = await createHost(HorizontalHost, (host) => host.selected.set('a'));
      directiveOf(fixture).scrollByPage('end');
      expect(scrollBySpy).toHaveBeenCalledWith({ left: 240, behavior: 'smooth' }); // 300 * 0.8
    });

    it('défile vers le début (delta négatif)', async () => {
      const fixture = await createHost(HorizontalHost, (host) => host.selected.set('a'));
      directiveOf(fixture).scrollByPage('start');
      expect(scrollBySpy).toHaveBeenCalledWith({ left: -240, behavior: 'smooth' });
    });

    it('utilise l’axe vertical en orientation verticale', async () => {
      const fixture = await createHost(VerticalHost, (host) => host.selected.set('a'));
      directiveOf(fixture).scrollByPage('end');
      expect(scrollBySpy).toHaveBeenCalledWith({ top: 240, behavior: 'smooth' });
    });

    it('respecte prefers-reduced-motion (behavior auto)', async () => {
      mockReducedMotion(true);
      const fixture = await createHost(HorizontalHost, (host) => host.selected.set('a'));
      directiveOf(fixture).scrollByPage('end');
      expect(scrollBySpy).toHaveBeenCalledWith({ left: 240, behavior: 'auto' });
    });

    it('axe vertical, sens "start" : top négatif', async () => {
      const fixture = await createHost(VerticalHost, (host) => host.selected.set('a'));
      directiveOf(fixture).scrollByPage('start');
      expect(scrollBySpy).toHaveBeenCalledWith({ top: -240, behavior: 'smooth' });
    });
  });

  describe('trous (audit)', () => {
    it('mesure verticale : canScrollStart/End dérivés de scrollTop', async () => {
      const fixture = await createHost(VerticalHost, (host) => host.selected.set('a'));
      const dir = directiveOf(fixture);
      expect(dir.canScrollStart()).toBe(false); // scrollTop 0
      expect(dir.canScrollEnd()).toBe(true);

      mockScrollTop = 500; // max = scrollHeight(800) − clientHeight(300)
      listOf(fixture).dispatchEvent(new Event('scroll'));
      expect(dir.canScrollStart()).toBe(true);
      expect(dir.canScrollEnd()).toBe(false);
    });

    it('tolérance EPS (1px) aux extrémités : 1px non scrollable, 2px scrollable', async () => {
      const fixture = await createHost(HorizontalHost, (host) => host.selected.set('a'));
      const dir = directiveOf(fixture);

      mockScrollLeft = 1; // exactement EPS → non scrollable vers le début
      listOf(fixture).dispatchEvent(new Event('scroll'));
      expect(dir.canScrollStart()).toBe(false);

      mockScrollLeft = 2; // au-delà d'EPS → scrollable
      listOf(fixture).dispatchEvent(new Event('scroll'));
      expect(dir.canScrollStart()).toBe(true);
    });

    it('MutationObserver : l’ajout d’un onglet redéclenche la mesure', async () => {
      mockScrollWidth = 200; // pas de débordement au départ
      const fixture = await createHost(HorizontalHost, (host) => {
        host.selected.set('a');
        host.tabs.set(['a', 'b']);
      });
      const dir = directiveOf(fixture);
      expect(dir.overflowing()).toBe(false);

      mockScrollWidth = 800; // débordement après ajout
      fixture.componentInstance.tabs.set(['a', 'b', 'c', 'd', 'e']);
      fixture.detectChanges();
      await new Promise((r) => queueMicrotask(() => r(undefined))); // laisse jouer le MutationObserver
      await fixture.whenStable();
      expect(dir.overflowing()).toBe(true);
    });

    it('nettoyage à la destruction : un scroll ne remesure plus', async () => {
      const fixture = await createHost(HorizontalHost, (host) => host.selected.set('a'));
      const dir = directiveOf(fixture);
      const list = listOf(fixture);
      expect(dir.canScrollStart()).toBe(false);

      fixture.destroy();
      mockScrollLeft = 500;
      list.dispatchEvent(new Event('scroll')); // listener retiré → pas de remesure
      expect(dir.canScrollStart()).toBe(false);
    });

    it('scroll-into-view vertical quand l’onglet sélectionné est AVANT la vue', async () => {
      mockScrollTop = 500; // la vue est descendue sous l'onglet 'd' (offsetTop 400)
      await createHost(VerticalHost); // selected 'd'
      expect(scrollSpy).toHaveBeenCalledWith({ top: 400, behavior: 'smooth' }); // remonte à selectedTop
    });
  });
});
