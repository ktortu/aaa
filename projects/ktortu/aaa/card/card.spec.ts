import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { KT_CARD_CONFIG, KtCard, KtCardActions, KtCardContent, KtCardHeader, KtCardLink, type KtCardVariant } from './card';
import { KT_AUDIT_ENABLED } from '@ktortu/aaa/cdk';

@Component({
  imports: [KtCard, KtCardHeader, KtCardContent, KtCardActions, KtCardLink],
  template: `
    <article ktCard [variant]="variant()" [interactive]="interactive()" [disabled]="disabled()">
      <header ktCardHeader><h3>Titre</h3></header>
      <div ktCardContent>Contenu</div>
      <footer ktCardActions>
        @if (withLink()) {
          <a ktCardLink href="/cible">Voir</a>
        }
        <button type="button">Action</button>
      </footer>
    </article>
  `,
})
class CardTestHost {
  variant = signal<KtCardVariant>('elevated');
  interactive = signal(false);
  disabled = signal(false);
  withLink = signal(false);
}

@Component({
  imports: [KtCard],
  template: `<article ktCard>Carte</article>`,
})
class CardConfigHost {}

@Component({
  imports: [KtCard, KtCardLink],
  template: `<article ktCard interactive><a ktCardLink href="/x">Ouvrir</a></article>`,
})
class CardInteractiveLinkHost {}

@Component({
  imports: [KtCard, KtCardLink],
  template: `<article ktCard interactive><a ktCardLink href="/x"></a></article>`,
})
class CardNamelessLinkHost {}

@Component({
  imports: [KtCard],
  template: `<article ktCard interactive disabled>x</article>`
})
class CardBareAttrHost {}

@Component({
  imports: [KtCard, KtCardLink],
  template: `<article ktCard interactive><a ktCardLink href="/x" aria-label="Ouvrir"></a></article>`,
})
class CardAriaLabelLinkHost {}

@Component({
  imports: [KtCard, KtCardLink],
  template: `<article ktCard interactive>
    <h3 id="t">T</h3>
    <a ktCardLink href="/x" aria-labelledby="t"></a>
  </article>`,
})
class CardLabelledByLinkHost {}

@Component({
  imports: [KtCard],
  template: `<a ktCard interactive href="/x">Ouvrir</a>`
})
class CardOnAnchorHost {}

@Component({
  imports: [KtCardLink],
  template: `<a ktCardLink href="/x">Lien</a>`
})
class CardOrphanLinkHost {}

describe('Card', () => {
  let fixture: ComponentFixture<CardTestHost>;
  let host: CardTestHost;
  let card: HTMLElement;

  function setup(enableAudit = false): void {
    TestBed.configureTestingModule({
      imports: [CardTestHost],
      providers: enableAudit ? [{ provide: KT_AUDIT_ENABLED, useValue: true }] : [],
    });
    fixture = TestBed.createComponent(CardTestHost);
    host = fixture.componentInstance;
    card = fixture.nativeElement.querySelector('[ktCard]');
    fixture.detectChanges();
  }

  afterEach(() => {
    fixture?.destroy();
  });

  describe('variant', () => {
    beforeEach(() => setup());

    it('should default to elevated', () => {
      expect(card.getAttribute('data-variant')).toBe('elevated');
    });

    it('should reflect each variant through data-variant', () => {
      host.variant.set('outlined');
      fixture.detectChanges();
      expect(card.getAttribute('data-variant')).toBe('outlined');

      host.variant.set('filled');
      fixture.detectChanges();
      expect(card.getAttribute('data-variant')).toBe('filled');
    });
  });

  describe('interactive', () => {
    beforeEach(() => setup());

    it('should not set data-interactive by default', () => {
      expect(card.hasAttribute('data-interactive')).toBe(false);
    });

    it('should set data-interactive when enabled', () => {
      host.interactive.set(true);
      fixture.detectChanges();
      expect(card.hasAttribute('data-interactive')).toBe(true);
    });
  });

  describe('disabled', () => {
    beforeEach(() => setup());

    it('should not set data-disabled by default', () => {
      expect(card.hasAttribute('data-disabled')).toBe(false);
    });

    it('should set data-disabled when enabled', () => {
      host.disabled.set(true);
      fixture.detectChanges();
      expect(card.hasAttribute('data-disabled')).toBe(true);
    });

    it('should pull the stretched link out of the tab order when the card is disabled', () => {
      host.disabled.set(true);
      host.withLink.set(true);
      fixture.detectChanges();
      const link = fixture.nativeElement.querySelector('[ktCardLink]');
      expect(link.getAttribute('tabindex')).toBe('-1');
      expect(link.getAttribute('aria-disabled')).toBe('true');
    });

    it('should prevent default and stop propagation of click event when the card is disabled', () => {
      host.disabled.set(true);
      host.withLink.set(true);
      fixture.detectChanges();
      const link = fixture.nativeElement.querySelector('[ktCardLink]');

      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      const spyPreventDefault = vi.spyOn(clickEvent, 'preventDefault');
      const spyStopPropagation = vi.spyOn(clickEvent, 'stopPropagation');

      link.dispatchEvent(clickEvent);

      expect(spyPreventDefault).toHaveBeenCalled();
      expect(spyStopPropagation).toHaveBeenCalled();
    });
  });

  describe('interactive accessibility guard', () => {
    it('should warn when interactive has no clickable target', async () => {
      vi.useFakeTimers();
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      setup(true);
      host.interactive.set(true); // pas de [ktCardLink] rendu (withLink reste false)
      fixture.detectChanges();
      await fixture.whenStable();
      vi.runAllTimers();

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('[ktCard] interactive'));
    });

    it('should not warn when interactive has a primary link', async () => {
      vi.useFakeTimers();
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      TestBed.configureTestingModule({
        imports: [CardInteractiveLinkHost],
        providers: [{ provide: KT_AUDIT_ENABLED, useValue: true }],
      });
      const f = TestBed.createComponent(CardInteractiveLinkHost);
      f.detectChanges();
      await f.whenStable();
      vi.runAllTimers();

      expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('[ktCard] interactive'));
      f.destroy();
    });

    it('should dynamically update warn when a clickable target is added or removed asynchronously', async () => {
      vi.useFakeTimers();
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      setup(true);

      // Étape 1 : Activer interactif sans lien -> warn attendu
      host.interactive.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      vi.runAllTimers();
      expect(warn).toHaveBeenCalledTimes(1);

      warn.mockClear();

      // Étape 2 : Ajouter dynamiquement le lien primaire -> aucun nouveau warn attendu
      host.withLink.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      vi.runAllTimers();
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('CardLink accessibility guard', () => {
    it('should warn when the stretched link has no accessible name', async () => {
      vi.useFakeTimers();
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      TestBed.configureTestingModule({
        imports: [CardNamelessLinkHost],
        providers: [{ provide: KT_AUDIT_ENABLED, useValue: true }],
      });
      const f = TestBed.createComponent(CardNamelessLinkHost);
      f.detectChanges();
      await f.whenStable();
      vi.runAllTimers();

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('[ktCardLink]'));
      f.destroy();
    });
  });

  describe('global configuration', () => {
    it('should default the variant from CARD_CONFIG', () => {
      TestBed.configureTestingModule({
        imports: [CardConfigHost],
        providers: [{ provide: KT_CARD_CONFIG, useValue: { variant: 'outlined' } }],
      });
      const f = TestBed.createComponent(CardConfigHost);
      f.detectChanges();
      const configCard: HTMLElement = f.nativeElement.querySelector('[ktCard]');

      expect(configCard.getAttribute('data-variant')).toBe('outlined');
      f.destroy();
    });
  });

  describe('trous (audit) — hôtes dédiés', () => {
    it('attributs nus interactive/disabled : data-interactive et data-disabled résolus', () => {
      TestBed.configureTestingModule({ imports: [CardBareAttrHost] });
      const f = TestBed.createComponent(CardBareAttrHost);
      f.detectChanges();
      const c: HTMLElement = f.nativeElement.querySelector('[ktCard]');
      expect(c.getAttribute('data-interactive')).toBe('');
      expect(c.getAttribute('data-disabled')).toBe('');
      f.destroy();
    });

    it('lien étiré vide étiqueté par aria-label : aucun avertissement', async () => {
      vi.useFakeTimers();
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      TestBed.configureTestingModule({
        imports: [CardAriaLabelLinkHost],
        providers: [{ provide: KT_AUDIT_ENABLED, useValue: true }],
      });
      const f = TestBed.createComponent(CardAriaLabelLinkHost);
      f.detectChanges();
      await f.whenStable();
      vi.runAllTimers();
      expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('[ktCardLink]'));
      f.destroy();
    });

    it('lien étiré vide étiqueté par aria-labelledby : aucun avertissement', async () => {
      vi.useFakeTimers();
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      TestBed.configureTestingModule({
        imports: [CardLabelledByLinkHost],
        providers: [{ provide: KT_AUDIT_ENABLED, useValue: true }],
      });
      const f = TestBed.createComponent(CardLabelledByLinkHost);
      f.detectChanges();
      await f.whenStable();
      vi.runAllTimers();
      expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('[ktCardLink]'));
      f.destroy();
    });

    it('aucun vol de focus au montage d’une carte interactive avec lien étiré', () => {
      TestBed.configureTestingModule({ imports: [CardInteractiveLinkHost] });
      const f = TestBed.createComponent(CardInteractiveLinkHost);
      f.detectChanges();
      const link = f.nativeElement.querySelector('[ktCardLink]');
      expect(document.activeElement).not.toBe(link);
      f.destroy();
    });

    it('carte interactive posée sur un <a> (sans [ktCardLink]) : aucun avertissement', async () => {
      vi.useFakeTimers();
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      TestBed.configureTestingModule({
        imports: [CardOnAnchorHost],
        providers: [{ provide: KT_AUDIT_ENABLED, useValue: true }],
      });
      const f = TestBed.createComponent(CardOnAnchorHost);
      f.detectChanges();
      await f.whenStable();
      vi.runAllTimers();
      expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('[ktCard] interactive'));
      f.destroy();
    });

    it('[ktCardLink] hors d’une [ktCard] : inerte sans planter (pas d’aria-disabled/tabindex)', () => {
      TestBed.configureTestingModule({ imports: [CardOrphanLinkHost] });
      const f = TestBed.createComponent(CardOrphanLinkHost);
      f.detectChanges();
      const link: HTMLAnchorElement = f.nativeElement.querySelector('[ktCardLink]');
      expect(link.hasAttribute('aria-disabled')).toBe(false);
      expect(link.hasAttribute('tabindex')).toBe(false);
      expect(() => link.dispatchEvent(new MouseEvent('click', { cancelable: true }))).not.toThrow();
      f.destroy();
    });
  });
});
