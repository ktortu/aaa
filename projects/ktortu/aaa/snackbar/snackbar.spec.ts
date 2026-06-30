import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ApplicationRef, Component, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HarnessLoader } from '@angular/cdk/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { KtSnackbarConfig, KT_SNACKBAR_CONFIG, provideKtSnackbar } from './snackbar-config';
import { KtSnackbar } from './snackbar.service';
import { KtSnackbarDismissReason, KtSnackbarRef } from './snackbar-ref';
import { KtSnackbarHarness } from './snackbar.harness';

/** Hôte vide : sert de point d'ancrage à `documentRootLoader` (la snackbar vit dans l'overlay). */
@Component({ template: `` })
class SnackHost {}

describe('KtSnackbar', () => {
  let announce: ReturnType<typeof vi.fn>;

  function setup(config?: Partial<KtSnackbarConfig>): KtSnackbar {
    announce = vi.fn().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        { provide: LiveAnnouncer, useValue: { announce, clear: vi.fn() } },
        ...(config ? [{ provide: KT_SNACKBAR_CONFIG, useValue: config }] : []),
      ],
    });
    return TestBed.inject(KtSnackbar);
  }

  /** Force le rendu du conteneur monté dans l'overlay (déclenche aussi les afterNextRender). */
  function render(): void {
    TestBed.inject(ApplicationRef).tick();
  }

  /** Loader au document root (overlay), pour piloter les snackbars via le harness. */
  function rootLoader(): HarnessLoader {
    return TestbedHarnessEnvironment.documentRootLoader(TestBed.createComponent(SnackHost));
  }

  function snackbarEl(): HTMLElement | null {
    return document.querySelector('.cdk-overlay-container .kt-snackbar');
  }

  function snackbarCount(): number {
    return document.querySelectorAll('.cdk-overlay-container .kt-snackbar').length;
  }

  function paneEl(): HTMLElement | null {
    return document.querySelector('.cdk-overlay-pane');
  }

  function wrapperEl(): HTMLElement | null {
    return document.querySelector('.cdk-global-overlay-wrapper');
  }

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container, .cdk-overlay-container *').forEach((n) => n.remove());
  });

  it('affiche le message et l’annonce UNE seule fois (canal unique), poliment par défaut', async () => {
    const snackbar = setup();
    snackbar.open('Brouillon enregistré');

    expect(await (await rootLoader().getHarness(KtSnackbarHarness)).getMessage()).toBe('Brouillon enregistré');
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith('Brouillon enregistré', 'polite');
  });

  it('le conteneur visuel n’est PAS une live region (pas de role / aria-live sur l’hôte)', () => {
    const snackbar = setup();
    snackbar.open('Coucou');
    render();

    const el = snackbarEl();
    expect(el?.getAttribute('role')).toBeNull();
    expect(el?.getAttribute('aria-live')).toBeNull();
  });

  it('variante : pose data-variant et affiche une icône décorative ; neutre = sans icône', async () => {
    const snackbar = setup();
    const loader = rootLoader();
    const ref = snackbar.open('Enregistré', { variant: 'success' });

    const success = await loader.getHarness(KtSnackbarHarness.with({ text: 'Enregistré' }));
    expect(await success.getVariant()).toBe('success');
    expect(await success.hasIcon()).toBe(true);
    // Détail a11y (icône décorative) : assertion brute, hors surface du harness.
    expect(snackbarEl()?.querySelector('.kt-snackbar__icon')?.getAttribute('aria-hidden')).toBe('true');

    ref.dismiss();
    snackbar.open('Neutre');
    const neutral = await loader.getHarness(KtSnackbarHarness.with({ text: 'Neutre' }));
    expect(await neutral.getVariant()).toBe('neutral');
    expect(await neutral.hasIcon()).toBe(false);
  });

  it('régime auto : se ferme après la durée avec la raison "timeout"', () => {
    vi.useFakeTimers();
    const snackbar = setup();
    const reasons: KtSnackbarDismissReason[] = [];
    snackbar
      .open('Message', { duration: 4000 })
      .afterDismissed()
      .subscribe((r) => reasons.push(r));
    render();

    vi.advanceTimersByTime(3999);
    expect(snackbarEl()).not.toBeNull();
    vi.advanceTimersByTime(2);
    expect(reasons).toEqual(['timeout']);
    expect(snackbarEl()).toBeNull();
  });

  it('durée reading-time : plancher pour un message court', () => {
    vi.useFakeTimers();
    const snackbar = setup({ readingTimePerChar: 100, readingTimeMin: 4000, readingTimeMax: 9000 });
    snackbar.open('Court'); // 5 × 100 = 500 < plancher → 4000
    render();

    vi.advanceTimersByTime(3999);
    expect(snackbarEl()).not.toBeNull();
    vi.advanceTimersByTime(2);
    expect(snackbarEl()).toBeNull();
  });

  it('durée reading-time : ratio par caractère entre plancher et plafond', () => {
    vi.useFakeTimers();
    const snackbar = setup({ readingTimePerChar: 100, readingTimeMin: 4000, readingTimeMax: 9000 });
    snackbar.open('x'.repeat(60)); // 60 × 100 = 6000
    render();

    vi.advanceTimersByTime(5999);
    expect(snackbarEl()).not.toBeNull();
    vi.advanceTimersByTime(2);
    expect(snackbarEl()).toBeNull();
  });

  it('durée reading-time : plafonnée pour un message long', () => {
    vi.useFakeTimers();
    const snackbar = setup({ readingTimePerChar: 100, readingTimeMin: 4000, readingTimeMax: 9000 });
    snackbar.open('x'.repeat(200)); // 200 × 100 = 20000 → plafond 9000
    render();

    vi.advanceTimersByTime(8999);
    expect(snackbarEl()).not.toBeNull();
    vi.advanceTimersByTime(2);
    expect(snackbarEl()).toBeNull();
  });

  it('durée fixe : un nombre explicite prime sur le temps de lecture', () => {
    vi.useFakeTimers();
    const snackbar = setup(); // défaut = reading-time
    snackbar.open('x'.repeat(200), { duration: 2000 }); // nombre → fixe 2000 malgré le message long
    render();

    vi.advanceTimersByTime(1999);
    expect(snackbarEl()).not.toBeNull();
    vi.advanceTimersByTime(2);
    expect(snackbarEl()).toBeNull();
  });

  it('régime auto : la minuterie se met en pause au survol et reprend au départ du pointeur', () => {
    vi.useFakeTimers();
    const snackbar = setup();
    snackbar.open('Message', { duration: 4000 });
    render();
    const el = snackbarEl()!;

    vi.advanceTimersByTime(3000);
    el.dispatchEvent(new Event('mouseenter')); // pause à 1000ms restants
    vi.advanceTimersByTime(10_000); // pendant le survol : ne disparaît pas
    expect(snackbarEl()).not.toBeNull();

    el.dispatchEvent(new Event('mouseleave')); // reprise des 1000ms
    vi.advanceTimersByTime(999);
    expect(snackbarEl()).not.toBeNull();
    vi.advanceTimersByTime(2);
    expect(snackbarEl()).toBeNull();
  });

  it('régime manual (AAA) : aucune disparition automatique', () => {
    vi.useFakeTimers();
    const snackbar = setup();
    snackbar.open('Hors ligne', { timing: 'manual' });
    render();

    vi.advanceTimersByTime(60_000);
    expect(snackbarEl()).not.toBeNull();
  });

  it('bouton de fermeture présent et nommé ; le clic ferme avec "dismiss"', () => {
    const snackbar = setup();
    const reasons: KtSnackbarDismissReason[] = [];
    snackbar
      .open('Message', { closeLabel: 'Fermer' })
      .afterDismissed()
      .subscribe((r) => reasons.push(r));
    render();

    const close = snackbarEl()?.querySelector<HTMLButtonElement>('.kt-snackbar__close');
    expect(close?.getAttribute('aria-label')).toBe('Fermer');
    close!.click();
    expect(reasons).toEqual(['dismiss']);
    expect(snackbarEl()).toBeNull();
  });

  it('closeLabel vide/blanc : repli sur le nom accessible par défaut (jamais de bouton sans nom)', () => {
    const snackbar = setup();
    snackbar.open('Message', { closeLabel: '   ' }); // surcharge blanche → ne doit PAS rester vide
    render();
    const close = snackbarEl()?.querySelector<HTMLButtonElement>('.kt-snackbar__close');
    expect(close?.getAttribute('aria-label')).toBe('Close');
  });

  it('Échap ferme la snackbar affichée avec "dismiss"', () => {
    const snackbar = setup();
    const reasons: KtSnackbarDismissReason[] = [];
    snackbar
      .open('Message', { timing: 'manual' })
      .afterDismissed()
      .subscribe((r) => reasons.push(r));
    render();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(reasons).toEqual(['dismiss']);
    expect(snackbarEl()).toBeNull();
  });

  it('cascade : option > KT_SNACKBAR_CONFIG > défaut', () => {
    const snackbar = setup({ politeness: 'assertive', closable: false });
    snackbar.open('Erreur'); // pas d'option → suit la config
    render();

    expect(announce).toHaveBeenCalledWith('Erreur', 'assertive');
    expect(snackbarEl()?.querySelector('.kt-snackbar__close')).toBeNull();
  });

  it('file FIFO : une seule visible à la fois ; la 2e s’affiche après fermeture de la 1re', () => {
    const snackbar = setup({ timing: 'manual' });
    const first = snackbar.open('Première');
    snackbar.open('Seconde');
    render();

    // La seconde patiente : une seule visible, c'est la première.
    expect(snackbarCount()).toBe(1);
    expect(snackbarEl()?.textContent).toContain('Première');

    first.dismiss();
    render();

    // La seconde prend la place.
    expect(snackbarCount()).toBe(1);
    expect(snackbarEl()?.textContent).toContain('Seconde');
    expect(announce).toHaveBeenNthCalledWith(2, 'Seconde', 'polite');
  });

  it('coalescing : un message identique réutilise la référence existante sans ré-empiler', () => {
    const snackbar = setup({ timing: 'manual' });
    const first = snackbar.open('Sauvegardé');
    const second = snackbar.open('Sauvegardé');
    render();

    expect(second).toBe(first);
    expect(snackbarCount()).toBe(1);
    expect(announce).toHaveBeenCalledTimes(1);
  });

  it('file pleine (max) : la plus ancienne EN ATTENTE est retirée avec "replaced"', () => {
    const snackbar = setup({ timing: 'manual', max: 2 });
    const reasons: KtSnackbarDismissReason[] = [];

    const a = snackbar.open('A'); // affichée
    const b = snackbar.open('B'); // en attente
    b.afterDismissed().subscribe((r) => reasons.push(r));
    snackbar.open('C'); // dépasse max=2 → retire la plus ancienne en attente (B)
    render();

    expect(reasons).toEqual(['replaced']);
    expect(snackbarEl()?.textContent).toContain('A'); // l'affichée n'est jamais évincée

    a.dismiss();
    render();
    expect(snackbarEl()?.textContent).toContain('C'); // B a sauté, C suit
  });

  it('position : ancrée en bas par défaut (classe + style + alignement du wrapper)', () => {
    const snackbar = setup();
    snackbar.open('Message');
    render();

    expect(paneEl()?.classList.contains('kt-snackbar-pane')).toBe(true);
    expect(paneEl()?.classList.contains('kt-snackbar-pane--bottom')).toBe(true);
    expect(paneEl()?.classList.contains('kt-snackbar-pane--top')).toBe(false);
    expect(paneEl()?.style.marginBottom).toBe('0px');
    expect(paneEl()?.style.marginTop).toBe('');
    expect(wrapperEl()?.style.alignItems).toBe('flex-end');
  });

  it('position : option "top" ancre en haut (classe + style + alignement du wrapper)', () => {
    const snackbar = setup();
    snackbar.open('Message', { position: 'top' });
    render();

    expect(paneEl()?.classList.contains('kt-snackbar-pane--top')).toBe(true);
    expect(paneEl()?.classList.contains('kt-snackbar-pane--bottom')).toBe(false);
    expect(paneEl()?.style.marginTop).toBe('0px');
    expect(paneEl()?.style.marginBottom).toBe('');
    expect(wrapperEl()?.style.alignItems).toBe('flex-start');
  });

  it('provideKtSnackbar : les défauts fournis pilotent réellement l’ouverture', () => {
    announce = vi.fn().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        { provide: LiveAnnouncer, useValue: { announce, clear: vi.fn() } },
        provideKtSnackbar({ position: 'top' }),
      ],
    });
    const snackbar = TestBed.inject(KtSnackbar);
    snackbar.open('Message'); // aucune option → suit le provider
    render();

    expect(paneEl()?.classList.contains('kt-snackbar-pane--top')).toBe(true);
    expect(paneEl()?.style.marginTop).toBe('0px');
    expect(wrapperEl()?.style.alignItems).toBe('flex-start');
  });

  it('bouton de fermeture : nom accessible "Close" par défaut (aucune config)', () => {
    const snackbar = setup();
    snackbar.open('Message');
    render();

    expect(snackbarEl()?.querySelector('.kt-snackbar__close')?.getAttribute('aria-label')).toBe('Close');
  });

  it('régime auto : la minuterie se met en pause au FOCUS clavier et reprend à la perte du focus', () => {
    vi.useFakeTimers();
    const snackbar = setup();
    snackbar.open('Message', { duration: 4000 });
    render();
    const el = snackbarEl()!;

    vi.advanceTimersByTime(3000);
    el.dispatchEvent(new Event('focusin')); // pause à 1000ms restants
    vi.advanceTimersByTime(10_000); // pendant le focus : ne disparaît pas
    expect(snackbarEl()).not.toBeNull();

    el.dispatchEvent(new Event('focusout')); // reprise des 1000ms
    vi.advanceTimersByTime(999);
    expect(snackbarEl()).not.toBeNull();
    vi.advanceTimersByTime(2);
    expect(snackbarEl()).toBeNull();
  });

  it('régime auto : la pause TIENT tant que le survol persiste, même après perte du focus', () => {
    vi.useFakeTimers();
    const snackbar = setup();
    snackbar.open('Message', { duration: 4000 });
    render();
    const el = snackbarEl()!;

    vi.advanceTimersByTime(3000); // 1000ms restants
    el.dispatchEvent(new Event('mouseenter')); // survol → pause
    el.dispatchEvent(new Event('focusin')); // focus (déjà en pause)
    el.dispatchEvent(new Event('focusout')); // perte focus MAIS le survol maintient la pause
    vi.advanceTimersByTime(10_000);
    expect(snackbarEl()).not.toBeNull();

    el.dispatchEvent(new Event('mouseleave')); // plus rien ne retient → reprise
    vi.advanceTimersByTime(999);
    expect(snackbarEl()).not.toBeNull();
    vi.advanceTimersByTime(2);
    expect(snackbarEl()).toBeNull();
  });

  it('régime auto : la pause TIENT tant que le focus persiste, même après perte du survol', () => {
    vi.useFakeTimers();
    const snackbar = setup();
    snackbar.open('Message', { duration: 4000 });
    render();
    const el = snackbarEl()!;

    vi.advanceTimersByTime(3000); // 1000ms restants
    el.dispatchEvent(new Event('focusin')); // focus → pause
    el.dispatchEvent(new Event('mouseenter')); // survol (déjà en pause)
    el.dispatchEvent(new Event('mouseleave')); // perte survol MAIS le focus maintient la pause
    vi.advanceTimersByTime(10_000);
    expect(snackbarEl()).not.toBeNull();

    el.dispatchEvent(new Event('focusout')); // plus rien ne retient → reprise
    vi.advanceTimersByTime(999);
    expect(snackbarEl()).not.toBeNull();
    vi.advanceTimersByTime(2);
    expect(snackbarEl()).toBeNull();
  });

  it('Échap : ne ferme que l’affichée, ignore les autres touches, révèle la suivante', () => {
    const snackbar = setup({ timing: 'manual' });
    const reasonsA: KtSnackbarDismissReason[] = [];
    snackbar
      .open('A')
      .afterDismissed()
      .subscribe((r) => reasonsA.push(r));
    snackbar.open('B'); // en attente
    render();

    // une touche autre qu'Échap n'a aucun effet
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    expect(snackbarEl()?.textContent).toContain('A');
    expect(reasonsA).toEqual([]);

    // Échap ferme l'affichée (A) ; B prend la place
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    render();
    expect(reasonsA).toEqual(['dismiss']);
    expect(snackbarEl()?.textContent).toContain('B');

    // Échap ferme B ; file vide, plus aucune snackbar et aucune exception
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    render();
    expect(snackbarEl()).toBeNull();
    expect(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))).not.toThrow();
  });

  it('éviction file pleine : retirer un EN ATTENTE ne reconstruit pas l’overlay affiché', () => {
    const snackbar = setup({ timing: 'manual', max: 2 });
    snackbar.open('A'); // affichée, annoncée une fois
    snackbar.open('B'); // en attente
    snackbar.open('C'); // dépasse max=2 → B évincée (en attente, jamais affichée)
    render();

    // L'affichée (A) n'a jamais été démontée/remontée : une seule annonce, pour A.
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenNthCalledWith(1, 'A', 'polite');
    expect(snackbarEl()?.textContent).toContain('A');
  });

  it('SSR : aucun overlay ni annonce côté serveur, référence inerte renvoyée', () => {
    announce = vi.fn().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        { provide: LiveAnnouncer, useValue: { announce, clear: vi.fn() } },
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const snackbar = TestBed.inject(KtSnackbar);
    const ref = snackbar.open('Message');
    render();

    expect(snackbarEl()).toBeNull();
    expect(announce).not.toHaveBeenCalled();
    expect(() => ref.dismiss()).not.toThrow(); // la ref inerte se ferme sans erreur
  });

  it('ngOnDestroy : démonte l’overlay affiché et vide la file', () => {
    const snackbar = setup({ timing: 'manual' });
    snackbar.open('Affichée');
    snackbar.open('En attente');
    render();
    expect(snackbarEl()).not.toBeNull();

    snackbar.ngOnDestroy();
    render();

    expect(snackbarEl()).toBeNull();
    expect(snackbarCount()).toBe(0);
  });

  it('cascade : KT_SNACKBAR_CONFIG.readingTimeMin (≠ défaut) pilote le plancher reading-time', () => {
    vi.useFakeTimers();
    // plancher de config 5000 ≠ défaut 4000 : un message court doit tenir 5000ms, pas 4000.
    const snackbar = setup({ readingTimePerChar: 10, readingTimeMin: 5000, readingTimeMax: 9000 });
    snackbar.open('Court'); // 5 × 10 = 50 < plancher → 5000
    render();

    vi.advanceTimersByTime(4999);
    expect(snackbarEl()).not.toBeNull();
    vi.advanceTimersByTime(2);
    expect(snackbarEl()).toBeNull();
  });
});

describe('KtSnackbarRef', () => {
  it('dismiss() sans argument : raison "dismiss" par défaut', () => {
    const onDismiss = vi.fn();
    const ref = new KtSnackbarRef(onDismiss);
    const reasons: KtSnackbarDismissReason[] = [];
    ref.afterDismissed().subscribe((r) => reasons.push(r));

    ref.dismiss();

    expect(onDismiss).toHaveBeenCalledWith('dismiss');
    expect(reasons).toEqual(['dismiss']);
  });

  it('dismiss() est idempotent : seule la PREMIÈRE fermeture compte', () => {
    const onDismiss = vi.fn();
    const ref = new KtSnackbarRef(onDismiss);
    const reasons: KtSnackbarDismissReason[] = [];
    ref.afterDismissed().subscribe((r) => reasons.push(r));

    ref.dismiss('timeout');
    ref.dismiss('dismiss'); // ignoré : déjà fermée

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith('timeout');
    expect(reasons).toEqual(['timeout']);
  });
});
