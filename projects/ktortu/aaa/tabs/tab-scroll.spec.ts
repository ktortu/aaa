import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Tab, TabList, Tabs } from '@angular/aria/tabs';
import { By } from '@angular/platform-browser';
import { KtTabScroll } from './tab-scroll';
import { KtTabScroller } from './tab-scroller';

// L'essentiel de la couverture vit dans `tab-scroller.spec.ts`. Ici on vérifie seulement la
// rétrocompat : l'alias déprécié `ktTabScroll` applique bien `KtTabScroller` (host directive) et
// conserve donc le scroll-into-view.

@Component({
  imports: [KtTabScroll, TabList, Tab, Tabs],
  template: `
    <div ngTabs>
      <ul ngTabList ktTabScroll [(selectedTab)]="selected">
        @for (t of tabs(); track t) {
          <li ngTab [value]="t">{{ t }}</li>
        }
      </ul>
    </div>
  `,
})
class AliasHost {
  tabs = signal(['a', 'b', 'c', 'd']);
  selected = signal<string | undefined>('d');
}

describe('KtTabScroll (alias déprécié)', () => {
  const originalScrollTo = HTMLElement.prototype.scrollTo;
  const originalMatchMedia = window.matchMedia;
  let scrollSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    scrollSpy = vi.fn();
    HTMLElement.prototype.scrollTo = scrollSpy as unknown as HTMLElement['scrollTo'];
    window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {}
      },
    );

    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 300 });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => 100 });
    Object.defineProperty(HTMLElement.prototype, 'offsetLeft', {
      configurable: true,
      get(this: HTMLElement) {
        return this.textContent?.trim() === 'd' ? 400 : 0;
      },
    });

    TestBed.configureTestingModule({ imports: [AliasHost] });
  });

  afterEach(() => {
    HTMLElement.prototype.scrollTo = originalScrollTo;
    window.matchMedia = originalMatchMedia;
    for (const prop of ['clientWidth', 'offsetWidth', 'offsetLeft']) {
      delete (HTMLElement.prototype as unknown as Record<string, unknown>)[prop];
    }
  });

  it('amène l’onglet sélectionné hors-champ dans la vue (via la host directive KtTabScroller)', async () => {
    const fixture = TestBed.createComponent(AliasHost);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(scrollSpy).toHaveBeenCalledWith({ left: 200, behavior: 'smooth' });
  });

  it('applique le marqueur CSS data-kt-tab-scroller sur l’hôte (host directive)', async () => {
    const fixture = TestBed.createComponent(AliasHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const list: HTMLElement = fixture.nativeElement.querySelector('[ktTabScroll]');
    expect(list.hasAttribute('data-kt-tab-scroller')).toBe(true);
  });

  it('scroll-into-view aussi sur un changement de sélection programmatique POST-montage', async () => {
    const fixture = TestBed.createComponent(AliasHost);
    fixture.componentInstance.selected.set('a'); // en vue au départ
    fixture.detectChanges();
    await fixture.whenStable();
    scrollSpy.mockClear();

    fixture.componentInstance.selected.set('d'); // hors-champ → doit re-scroller
    fixture.detectChanges();
    await fixture.whenStable();
    expect(scrollSpy).toHaveBeenCalledWith({ left: 200, behavior: 'smooth' });
  });
});

describe('KtTabScroll — surface de pagination ré-exposée via l’alias', () => {
  const originalMatchMedia = window.matchMedia;

  @Component({
    imports: [KtTabScroll, TabList, Tab, Tabs],
    template: `
      <div ngTabs>
        <ul ngTabList ktTabScroll #ref="ktTabScroll" [(selectedTab)]="selected">
          @for (t of tabs(); track t) {
            <li ngTab [value]="t">{{ t }}</li>
          }
        </ul>
      </div>
    `,
  })
  class RefHost {
    tabs = signal(['a', 'b', 'c', 'd']);
    selected = signal<string | undefined>('a');
  }

  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {}
      },
    );
    HTMLElement.prototype.scrollBy = vi.fn() as unknown as HTMLElement['scrollBy'];
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 300 });
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, get: () => 800 });
    Object.defineProperty(HTMLElement.prototype, 'scrollLeft', { configurable: true, get: () => 0, set: () => {} });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    for (const prop of ['clientWidth', 'scrollWidth', 'scrollLeft']) {
      delete (HTMLElement.prototype as unknown as Record<string, unknown>)[prop];
    }
  });

  it('l’alias applique KtTabScroller (host directive) exposant la surface de pagination ; scrollByPage déclenche scrollBy', async () => {
    const fixture = TestBed.createComponent(RefHost);
    fixture.detectChanges();
    await fixture.whenStable();
    // L'alias vide applique KtTabScroller en host directive : la surface de pagination est sur lui.
    const scroller = fixture.debugElement.query(By.directive(KtTabScroll)).injector.get(KtTabScroller);

    expect(typeof scroller.canScrollStart).toBe('function');
    expect(typeof scroller.canScrollEnd).toBe('function');
    expect(typeof scroller.scrollByPage).toBe('function');

    const list: HTMLElement = fixture.nativeElement.querySelector('[ktTabScroll]');
    const spy = vi.spyOn(list, 'scrollBy');
    scroller.scrollByPage('end');
    // On vérifie l'ARGUMENT, pas seulement l'appel : 'end' défile vers la droite, en douceur.
    expect(spy).toHaveBeenCalledTimes(1);
    const arg = spy.mock.calls[0][0] as ScrollToOptions;
    expect(arg.behavior).toBe('smooth');
    expect(arg.left).toBeGreaterThan(0);
  });
});
