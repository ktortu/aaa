import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KT_CARD_CONFIG, KtCard, type KtCardVariant } from './card';
import { KtCardActions, KtCardContent, KtCardHeader, KtCardLink } from './card-structure';
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
class TestHost {
  variant = signal<KtCardVariant>('elevated');
  interactive = signal(false);
  disabled = signal(false);
  withLink = signal(false);
}

// Host sans binding [variant] : laisse jouer le défaut du token CARD_CONFIG.
@Component({
  imports: [KtCard],
  template: `<article ktCard>Carte</article>`,
})
class ConfigHost {}

// Carte interactive avec lien primaire nommé : aucun warning attendu.
@Component({
  imports: [KtCard, KtCardLink],
  template: `<article ktCard interactive><a ktCardLink href="/x">Ouvrir</a></article>`,
})
class InteractiveLinkHost {}

// Lien étiré SANS nom accessible : warning [ktCardLink] attendu.
@Component({
  imports: [KtCard, KtCardLink],
  template: `<article ktCard interactive><a ktCardLink href="/x"></a></article>`,
})
class NamelessLinkHost {}

describe('Card', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let card: HTMLElement;

  function setup(enableAudit = false): void {
    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: enableAudit ? [{ provide: KT_AUDIT_ENABLED, useValue: true }] : [],
    });
    fixture = TestBed.createComponent(TestHost);
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
      for (const variant of ['outlined', 'filled', 'elevated'] as const) {
        host.variant.set(variant);
        fixture.detectChanges();
        expect(card.getAttribute('data-variant')).toBe(variant);
      }
    });
  });

  describe('interactive', () => {
    beforeEach(() => setup());

    it('should not set data-interactive by default', () => {
      expect(card.hasAttribute('data-interactive')).toBe(false);
    });

    it('should set data-interactive when enabled', () => {
      host.interactive.set(true);
      host.withLink.set(true);
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
      host.interactive.set(true);
      host.withLink.set(true);
      fixture.detectChanges();
      const link: HTMLAnchorElement = card.querySelector('[ktCardLink]')!;
      expect(link.hasAttribute('tabindex')).toBe(false);
      expect(link.hasAttribute('aria-disabled')).toBe(false);

      host.disabled.set(true);
      fixture.detectChanges();
      expect(link.getAttribute('tabindex')).toBe('-1');
      expect(link.getAttribute('aria-disabled')).toBe('true');
    });

    it('should prevent default and stop propagation of click event when the card is disabled', () => {
      host.interactive.set(true);
      host.withLink.set(true);
      fixture.detectChanges();

      const link: HTMLAnchorElement = card.querySelector('[ktCardLink]')!;
      let clickTriggered = false;

      const clickListener = () => {
        clickTriggered = true;
      };
      card.addEventListener('click', clickListener);

      // Étape 1 : Carte active -> le clic doit se propager normalement
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      link.dispatchEvent(clickEvent);
      expect(clickTriggered).toBe(true);
      expect(clickEvent.defaultPrevented).toBe(false);

      // Étape 2 : Carte désactivée -> le clic doit être annulé et bloqué
      clickTriggered = false;
      host.disabled.set(true);
      fixture.detectChanges();

      const disabledClickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      link.dispatchEvent(disabledClickEvent);

      expect(clickTriggered).toBe(false); // Propagation stoppée
      expect(disabledClickEvent.defaultPrevented).toBe(true); // Action par défaut annulée

      card.removeEventListener('click', clickListener);
    });
  });

  describe('interactive accessibility guard', () => {
    it('should warn when interactive has no clickable target', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      setup(true);
      host.interactive.set(true); // pas de [ktCardLink] rendu (withLink reste false)
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('[ktCard] interactive'));
    });

    it('should not warn when interactive has a primary link', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      TestBed.configureTestingModule({
        imports: [InteractiveLinkHost],
        providers: [{ provide: KT_AUDIT_ENABLED, useValue: true }],
      });
      const f = TestBed.createComponent(InteractiveLinkHost);
      f.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('[ktCard] interactive'));
      f.destroy();
    });

    it('should dynamically update warn when a clickable target is added or removed asynchronously', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      setup(true);

      // Étape 1 : Activer interactif sans lien -> warn attendu
      host.interactive.set(true);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(warn).toHaveBeenCalledTimes(1);

      warn.mockClear();

      // Étape 2 : Ajouter dynamiquement le lien primaire -> aucun nouveau warn attendu
      host.withLink.set(true);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('CardLink accessibility guard', () => {
    it('should warn when the stretched link has no accessible name', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      TestBed.configureTestingModule({
        imports: [NamelessLinkHost],
        providers: [{ provide: KT_AUDIT_ENABLED, useValue: true }],
      });
      const f = TestBed.createComponent(NamelessLinkHost);
      f.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('[ktCardLink]'));
      f.destroy();
    });
  });

  describe('global configuration', () => {
    it('should default the variant from CARD_CONFIG', () => {
      TestBed.configureTestingModule({
        imports: [ConfigHost],
        providers: [{ provide: KT_CARD_CONFIG, useValue: { variant: 'outlined' } }],
      });
      const f = TestBed.createComponent(ConfigHost);
      f.detectChanges();
      const configCard: HTMLElement = f.nativeElement.querySelector('[ktCard]');

      expect(configCard.getAttribute('data-variant')).toBe('outlined');
      f.destroy();
    });
  });

  describe('trous (audit) — hôtes dédiés', () => {
    it('attributs nus interactive/disabled : data-interactive et data-disabled résolus', () => {
      @Component({ imports: [KtCard], template: `<article ktCard interactive disabled>x</article>` })
      class BareAttrHost {}
      TestBed.configureTestingModule({ imports: [BareAttrHost] });
      const f = TestBed.createComponent(BareAttrHost);
      f.detectChanges();
      const c: HTMLElement = f.nativeElement.querySelector('[ktCard]');
      expect(c.getAttribute('data-interactive')).toBe('');
      expect(c.getAttribute('data-disabled')).toBe('');
      f.destroy();
    });

    it('lien étiré vide étiqueté par aria-label : aucun avertissement', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      @Component({
        imports: [KtCard, KtCardLink],
        template: `<article ktCard interactive><a ktCardLink href="/x" aria-label="Ouvrir"></a></article>`,
      })
      class AriaLabelLinkHost {}
      TestBed.configureTestingModule({
        imports: [AriaLabelLinkHost],
        providers: [{ provide: KT_AUDIT_ENABLED, useValue: true }],
      });
      const f = TestBed.createComponent(AriaLabelLinkHost);
      f.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('[ktCardLink]'));
      f.destroy();
    });

    it('lien étiré vide étiqueté par aria-labelledby : aucun avertissement', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      @Component({
        imports: [KtCard, KtCardLink],
        template: `<article ktCard interactive>
          <h3 id="t">T</h3>
          <a ktCardLink href="/x" aria-labelledby="t"></a>
        </article>`,
      })
      class LabelledByLinkHost {}
      TestBed.configureTestingModule({
        imports: [LabelledByLinkHost],
        providers: [{ provide: KT_AUDIT_ENABLED, useValue: true }],
      });
      const f = TestBed.createComponent(LabelledByLinkHost);
      f.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('[ktCardLink]'));
      f.destroy();
    });

    it('aucun vol de focus au montage d’une carte interactive avec lien étiré', () => {
      TestBed.configureTestingModule({ imports: [InteractiveLinkHost] });
      const f = TestBed.createComponent(InteractiveLinkHost);
      f.detectChanges();
      const link = f.nativeElement.querySelector('[ktCardLink]');
      expect(document.activeElement).not.toBe(link);
      f.destroy();
    });

    it('carte interactive posée sur un <a> (sans [ktCardLink]) : aucun avertissement', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      @Component({ imports: [KtCard], template: `<a ktCard interactive href="/x">Ouvrir</a>` })
      class CardOnAnchorHost {}
      TestBed.configureTestingModule({
        imports: [CardOnAnchorHost],
        providers: [{ provide: KT_AUDIT_ENABLED, useValue: true }],
      });
      const f = TestBed.createComponent(CardOnAnchorHost);
      f.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('[ktCard] interactive'));
      f.destroy();
    });

    it('[ktCardLink] hors d’une [ktCard] : inerte sans planter (pas d’aria-disabled/tabindex)', () => {
      @Component({ imports: [KtCardLink], template: `<a ktCardLink href="/x">Lien</a>` })
      class OrphanLinkHost {}
      TestBed.configureTestingModule({ imports: [OrphanLinkHost] });
      const f = TestBed.createComponent(OrphanLinkHost);
      f.detectChanges();
      const link: HTMLAnchorElement = f.nativeElement.querySelector('[ktCardLink]');
      expect(link.hasAttribute('aria-disabled')).toBe(false);
      expect(link.hasAttribute('tabindex')).toBe(false);
      expect(() => link.dispatchEvent(new MouseEvent('click', { cancelable: true }))).not.toThrow();
      f.destroy();
    });
  });
});
