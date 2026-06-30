import { TestBed } from '@angular/core/testing';
import { KT_BREAKPOINTS, KT_DEFAULT_BREAKPOINTS, provideKtBreakpoints, resolveKtBreakpointMedia } from './breakpoints';

// EPSILON interne (non exporté) : on réplique l'arithmétique exacte du code pour éviter toute
// divergence de représentation flottante entre l'attendu et le produit.
const below = (floor: number): string => `(max-width: ${floor - 0.02}px)`;

describe('resolveKtBreakpointMedia', () => {
  it('résout les défauts en trois bandes adjacentes sans chevauchement (EPSILON)', () => {
    const media = resolveKtBreakpointMedia(KT_DEFAULT_BREAKPOINTS); // { 0, 600, 1024 }
    // mobile commence à 0 → pas de min-width, borné juste sous le plancher tablette.
    expect(media.mobile).toBe(below(600));
    // tablette encadrée [600 .. 1024[.
    expect(media.tablet).toBe(`(min-width: 600px) and ${below(1024)}`);
    // desktop ouvert vers le haut.
    expect(media.desktop).toBe('(min-width: 1024px)');
  });

  it('mobile > 0 : bande encadrée min..max', () => {
    const media = resolveKtBreakpointMedia({ mobile: 320, tablet: 600, desktop: 1024 });
    expect(media.mobile).toBe(`(min-width: 320px) and ${below(600)}`);
  });

  it('palier-chaîne : repris VERBATIM sur chaque bande', () => {
    const media = resolveKtBreakpointMedia({
      mobile: '(orientation: portrait)',
      tablet: '(min-width: 768px) and (orientation: landscape)',
      desktop: '(min-width: 1200px)',
    });
    expect(media.mobile).toBe('(orientation: portrait)');
    expect(media.tablet).toBe('(min-width: 768px) and (orientation: landscape)');
    expect(media.desktop).toBe('(min-width: 1200px)');
  });

  it('plancher suivant en chaîne : la bande numérique reste ouverte de ce côté', () => {
    // tablet est une chaîne → la bande tablette numérique n'a pas de borne max issue de desktop.
    const media = resolveKtBreakpointMedia({ mobile: 0, tablet: 600, desktop: '(min-width: 1200px)' });
    expect(media.tablet).toBe('(min-width: 600px)');
  });

  it('bande numérique sans aucune borne → "not all" (repli sûr, jamais matché)', () => {
    // mobile=0 (pas de min) ET tablet en chaîne (pas de max numérique) → mobile sans borne.
    const media = resolveKtBreakpointMedia({ mobile: 0, tablet: '(min-width: 600px)', desktop: 1024 });
    expect(media.mobile).toBe('not all');
    // tablet, lui, est repris verbatim.
    expect(media.tablet).toBe('(min-width: 600px)');
  });
});

describe('provideKtBreakpoints', () => {
  it('fusionne les surcharges avec les défauts (clés absentes conservées)', () => {
    TestBed.configureTestingModule({ providers: [provideKtBreakpoints({ tablet: 768 })] });
    expect(TestBed.inject(KT_BREAKPOINTS)).toEqual({ mobile: 0, tablet: 768, desktop: 1024 });
  });

  it('token par défaut = KT_DEFAULT_BREAKPOINTS quand aucun provider', () => {
    TestBed.configureTestingModule({});
    expect(TestBed.inject(KT_BREAKPOINTS)).toEqual(KT_DEFAULT_BREAKPOINTS);
  });
});
