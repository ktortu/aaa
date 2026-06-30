import { TestBed } from '@angular/core/testing';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { KtViewport } from './viewport';
import { provideKtBreakpoints } from './breakpoints';

/** Faux BreakpointObserver : un sujet par requête, pilotable par les tests via `set()`. */
class FakeBreakpointObserver {
  private readonly subjects = new Map<string, BehaviorSubject<boolean>>();

  observe(query: string | readonly string[]): Observable<BreakpointState> {
    const q = Array.isArray(query) ? query[0] : (query as string);
    return this.subject(q).pipe(map((matches) => ({ matches, breakpoints: { [q]: matches } })));
  }

  set(query: string, matches: boolean): void {
    this.subject(query).next(matches);
  }

  private subject(query: string): BehaviorSubject<boolean> {
    let s = this.subjects.get(query);
    if (!s) {
      s = new BehaviorSubject(false);
      this.subjects.set(query, s);
    }
    return s;
  }
}

describe('KtViewport', () => {
  function setup(overrides?: Parameters<typeof provideKtBreakpoints>[0]): {
    vp: KtViewport;
    fake: FakeBreakpointObserver;
  } {
    const fake = new FakeBreakpointObserver();
    TestBed.configureTestingModule({
      providers: [
        ...(overrides ? [provideKtBreakpoints(overrides)] : []),
        { provide: BreakpointObserver, useValue: fake },
      ],
    });
    return { vp: TestBed.inject(KtViewport), fake };
  }

  it('expose les media queries dérivées des seuils par défaut', () => {
    const { vp } = setup();
    expect(vp.media.mobile).toBe(`(max-width: ${600 - 0.02}px)`);
    expect(vp.media.desktop).toBe('(min-width: 1024px)');
  });

  it('repli SSR / état initial : tous les signaux à false', () => {
    const { vp } = setup();
    expect(vp.isMobile()).toBe(false);
    expect(vp.isTablet()).toBe(false);
    expect(vp.isDesktop()).toBe(false);
  });

  it('reflète l’état du BreakpointObserver bande par bande', () => {
    const { vp, fake } = setup();

    fake.set(vp.media.mobile, true);
    expect(vp.isMobile()).toBe(true);
    expect(vp.isTablet()).toBe(false);

    fake.set(vp.media.mobile, false);
    fake.set(vp.media.desktop, true);
    expect(vp.isMobile()).toBe(false);
    expect(vp.isDesktop()).toBe(true);
  });

  it('isCompact est l’alias de isMobile (même signal, même valeur)', () => {
    const { vp, fake } = setup();
    expect(vp.isCompact).toBe(vp.isMobile); // même référence de signal
    fake.set(vp.media.mobile, true);
    expect(vp.isCompact()).toBe(true);
  });

  it('observe les media queries surchargées via provideKtBreakpoints', () => {
    const { vp, fake } = setup({ tablet: 768 });
    // La bande mobile est désormais bornée par 768, pas 600.
    expect(vp.media.mobile).toBe(`(max-width: ${768 - 0.02}px)`);
    fake.set(vp.media.mobile, true);
    expect(vp.isMobile()).toBe(true);
  });
});
