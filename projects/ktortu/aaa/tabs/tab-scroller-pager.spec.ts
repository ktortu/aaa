import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Tab, TabList, Tabs } from '@angular/aria/tabs';
import { KtTabScroller } from './tab-scroller';
import { KtTabScrollerPager } from './tab-scroller-pager';
import { KtTabScrollerPagerHarness } from './tab-scroller-pager.harness';
import { KT_TABS_CONFIG } from './tabs-config';

@Component({
  imports: [KtTabScrollerPager, KtTabScroller, TabList, Tab, Tabs],
  template: `
    <div ngTabs>
      <kt-tab-scroller>
        <ul ngTabList ktTabScroller [(selectedTab)]="selected">
          @for (t of tabs(); track t) {
            <li ngTab [value]="t">{{ t }}</li>
          }
        </ul>
      </kt-tab-scroller>
    </div>
  `,
})
class PagerHost {
  tabs = signal(['a', 'b', 'c', 'd']);
  selected = signal<string | undefined>('a'); // en vue → pas de scroll-into-view parasite
}

describe('KtTabScrollerPager (<kt-tab-scroller>)', () => {
  const originalMatchMedia = window.matchMedia;
  let fixture: ComponentFixture<PagerHost>;

  function chevron(side: 'start' | 'end'): HTMLButtonElement {
    return fixture.nativeElement.querySelector(`.kt-tab-scroller__chevron--${side}`)!;
  }
  function directive(): KtTabScroller {
    return fixture.debugElement.query(By.directive(KtTabScroller)).injector.get(KtTabScroller);
  }
  function pagerHarness(): Promise<KtTabScrollerPagerHarness> {
    return TestbedHarnessEnvironment.loader(fixture).getHarness(KtTabScrollerPagerHarness);
  }

  beforeEach(async () => {
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

    // Débordement : clientWidth 300 < scrollWidth 800, scrollLeft 0 (au début).
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 300 });
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, get: () => 800 });
    Object.defineProperty(HTMLElement.prototype, 'scrollLeft', { configurable: true, get: () => 0, set: () => {} });

    TestBed.configureTestingModule({ imports: [PagerHost] });
    fixture = TestBed.createComponent(PagerHost);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    for (const prop of ['clientWidth', 'scrollWidth', 'scrollLeft']) {
      delete (HTMLElement.prototype as unknown as Record<string, unknown>)[prop];
    }
  });

  it('rend deux chevrons icône flanquant la liste', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button[ktButton][data-icon-only]');
    expect(buttons.length).toBe(2);
  });

  it('porte des noms accessibles (aria-label) sur chaque chevron (défauts anglais, lib neutre i18n)', () => {
    expect(chevron('start').getAttribute('aria-label')).toBe('Previous tabs');
    expect(chevron('end').getAttribute('aria-label')).toBe('Next tabs');
  });

  it('utilise les icônes chevron en horizontal', () => {
    expect(chevron('start').getAttribute('data-icon')).toBe('chevron_left');
    expect(chevron('end').getAttribute('data-icon')).toBe('chevron_right');
  });

  it('désactive le chevron de début au bord (rien à scroller vers le début) et active celui de fin', async () => {
    const pager = await pagerHarness();
    expect(await pager.canScrollToStart()).toBe(false); // scrollLeft 0
    expect(await pager.canScrollToEnd()).toBe(true);
  });

  it('marque le conteneur comme débordant', async () => {
    const pager = await pagerHarness();
    expect(await pager.isOverflowing()).toBe(true);
    expect(await pager.getOrientation()).toBe('horizontal');
  });

  it('un clic sur le chevron de fin appelle scrollByPage("end")', async () => {
    const spy = vi.spyOn(directive(), 'scrollByPage');
    await (await pagerHarness()).scrollToEnd();
    expect(spy).toHaveBeenCalledWith('end');
  });
});

describe('KtTabScrollerPager — KT_TABS_CONFIG (provider global)', () => {
  const originalMatchMedia = window.matchMedia;

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

  it('le provider KT_TABS_CONFIG surcharge les défauts (résolution input ?? config ?? défaut)', async () => {
    TestBed.configureTestingModule({
      imports: [PagerHost],
      providers: [{ provide: KT_TABS_CONFIG, useValue: { previousLabel: 'Précédent', nextLabel: 'Suivant' } }],
    });
    const fixture = TestBed.createComponent(PagerHost);
    fixture.detectChanges();
    await fixture.whenStable();

    const el = (side: 'start' | 'end') =>
      fixture.nativeElement.querySelector(`.kt-tab-scroller__chevron--${side}`) as HTMLButtonElement;
    expect(el('start').getAttribute('aria-label')).toBe('Précédent');
    expect(el('end').getAttribute('aria-label')).toBe('Suivant');
  });

  it('l’input par-instance previousLabel prime sur KT_TABS_CONFIG', async () => {
    @Component({
      imports: [KtTabScrollerPager, KtTabScroller, TabList, Tab, Tabs],
      template: `
        <div ngTabs>
          <kt-tab-scroller previousLabel="Avant">
            <ul ngTabList ktTabScroller [(selectedTab)]="selected">
              @for (t of tabs(); track t) {
                <li ngTab [value]="t">{{ t }}</li>
              }
            </ul>
          </kt-tab-scroller>
        </div>
      `,
    })
    class LabelHost {
      tabs = signal(['a', 'b', 'c']);
      selected = signal<string | undefined>('a');
    }
    TestBed.configureTestingModule({
      imports: [LabelHost],
      providers: [{ provide: KT_TABS_CONFIG, useValue: { previousLabel: 'Config' } }],
    });
    const fixture = TestBed.createComponent(LabelHost);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(
      (fixture.nativeElement.querySelector('.kt-tab-scroller__chevron--start') as HTMLButtonElement).getAttribute(
        'aria-label',
      ),
    ).toBe('Avant'); // input > config
  });
});

describe('KtTabScrollerPager — états de défilement (audit)', () => {
  const originalMatchMedia = window.matchMedia;

  function build(scrollLeft: number, scrollWidth: number): ComponentFixture<PagerHost> {
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
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, get: () => scrollWidth });
    Object.defineProperty(HTMLElement.prototype, 'scrollLeft', {
      configurable: true,
      get: () => scrollLeft,
      set: () => {},
    });
    TestBed.configureTestingModule({ imports: [PagerHost] });
    const fixture = TestBed.createComponent(PagerHost);
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    for (const prop of ['clientWidth', 'scrollWidth', 'scrollLeft']) {
      delete (HTMLElement.prototype as unknown as Record<string, unknown>)[prop];
    }
  });

  function chevron(f: ComponentFixture<PagerHost>, side: 'start' | 'end'): HTMLButtonElement {
    return f.nativeElement.querySelector(`.kt-tab-scroller__chevron--${side}`)!;
  }

  it('chevron de FIN désactivé au bord de fin (canScrollEnd false)', async () => {
    const f = build(500, 800); // 500 + 300 = 800 = scrollWidth → plus rien à droite
    await f.whenStable();
    expect(chevron(f, 'end').hasAttribute('disabled')).toBe(true);
    expect(chevron(f, 'start').hasAttribute('disabled')).toBe(false);
  });

  it('clic sur le chevron de DÉBUT depuis une position avancée → scrollByPage("start")', async () => {
    const f = build(400, 800); // les deux chevrons actifs
    await f.whenStable();
    const dir = f.debugElement.query(By.directive(KtTabScroller)).injector.get(KtTabScroller);
    const spy = vi.spyOn(dir, 'scrollByPage');
    chevron(f, 'start').click();
    expect(spy).toHaveBeenCalledWith('start');
  });

  it('data-overflowing ABSENT quand la liste ne déborde pas', async () => {
    const f = build(0, 300); // scrollWidth === clientWidth → pas de débordement
    await f.whenStable();
    expect(f.nativeElement.querySelector('kt-tab-scroller')!.hasAttribute('data-overflowing')).toBe(false);
  });
});
