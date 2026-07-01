import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { KtDisclosure } from './disclosure';
import { KtDisclosureContent } from './disclosure-content';
import { KtDisclosureToggle } from './disclosure-toggle';
import { KT_AUDIT_ENABLED } from '@ktortu/aaa/cdk';

@Component({
  imports: [KtDisclosure, KtDisclosureToggle, KtDisclosureContent],
  template: `
    <div ktDisclosure #d="ktDisclosure" [(expanded)]="open">
      <button ktDisclosureToggle>{{ d.expanded() ? 'Voir moins' : 'Voir plus' }}</button>
      <kt-disclosure-content>
        <p>Contenu du panneau</p>
      </kt-disclosure-content>
    </div>
  `,
})
class TestHost {
  open = signal(false);
}

describe('Disclosure', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let root: HTMLElement;
  let toggle: HTMLButtonElement;
  let content: HTMLElement;

  function setup(): void {
    TestBed.configureTestingModule({ imports: [TestHost] });
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    root = fixture.nativeElement.querySelector('[ktDisclosure]');
    toggle = fixture.nativeElement.querySelector('[ktDisclosureToggle]');
    content = fixture.nativeElement.querySelector('kt-disclosure-content');
  }

  afterEach(() => {
    fixture?.destroy();
  });

  describe('état initial', () => {
    beforeEach(() => setup());

    it('est replié par défaut', () => {
      expect(root.getAttribute('data-expanded')).toBe('false');
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      expect(toggle.textContent?.trim()).toBe('Voir plus');
    });

    it('rend le panneau inert quand il est fermé', () => {
      expect(content.hasAttribute('inert')).toBe(true);
    });

    it('câble aria-controls sur l’id du panneau', () => {
      const id = content.getAttribute('id');
      expect(id).toBeTruthy();
      expect(id).toMatch(/^kt-disclosure-content-/);
      expect(toggle.getAttribute('aria-controls')).toBe(id);
    });

    it('force type="button" sur le déclencheur quand le type est absent', () => {
      expect(toggle.getAttribute('type')).toBe('button');
    });

    it('applique la classe chevron par défaut', () => {
      expect(toggle.classList.contains('kt-disclosure-toggle--chevron')).toBe(true);
    });
  });

  describe('type explicite', () => {
    it('ne surcharge pas un type posé par le consommateur', () => {
      @Component({
        imports: [KtDisclosure, KtDisclosureToggle, KtDisclosureContent],
        template: `
          <div ktDisclosure>
            <button ktDisclosureToggle type="submit">Détails</button>
            <kt-disclosure-content>x</kt-disclosure-content>
          </div>
        `,
      })
      class ExplicitTypeHost {}
      TestBed.configureTestingModule({ imports: [ExplicitTypeHost] });
      const f = TestBed.createComponent(ExplicitTypeHost);
      f.detectChanges();
      const btn: HTMLButtonElement = f.nativeElement.querySelector('[ktDisclosureToggle]');
      expect(btn.getAttribute('type')).toBe('submit');
      f.destroy();
    });
  });

  describe('chevron', () => {
    it('retire la classe quand [chevron]="false"', () => {
      @Component({
        imports: [KtDisclosure, KtDisclosureToggle, KtDisclosureContent],
        template: `
          <div ktDisclosure>
            <button ktDisclosureToggle [chevron]="false">Détails</button>
            <kt-disclosure-content>x</kt-disclosure-content>
          </div>
        `,
      })
      class NoChevronHost {}
      TestBed.configureTestingModule({ imports: [NoChevronHost] });
      const f = TestBed.createComponent(NoChevronHost);
      f.detectChanges();
      const btn: HTMLButtonElement = f.nativeElement.querySelector('[ktDisclosureToggle]');
      expect(btn.classList.contains('kt-disclosure-toggle--chevron')).toBe(false);
      f.destroy();
    });
  });

  describe('interaction', () => {
    beforeEach(() => setup());

    it('ouvre puis ferme au clic', () => {
      toggle.click();
      fixture.detectChanges();
      expect(root.getAttribute('data-expanded')).toBe('true');
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      expect(content.hasAttribute('inert')).toBe(false);
      expect(toggle.textContent?.trim()).toBe('Voir moins');

      toggle.click();
      fixture.detectChanges();
      expect(root.getAttribute('data-expanded')).toBe('false');
      expect(content.hasAttribute('inert')).toBe(true);
    });

    it('propage l’état via la liaison bidirectionnelle [(expanded)]', () => {
      host.open.set(true);
      fixture.detectChanges();
      expect(root.getAttribute('data-expanded')).toBe('true');
      expect(content.hasAttribute('inert')).toBe(false);

      toggle.click();
      fixture.detectChanges();
      expect(host.open()).toBe(false);
    });
  });

  describe('méthodes impératives', () => {
    it('expand / collapse / toggle pilotent l’état', () => {
      TestBed.configureTestingModule({ imports: [TestHost] });
      const f = TestBed.createComponent(TestHost);
      f.detectChanges();
      const dir = f.debugElement.query((de) => de.nativeElement.matches?.('[ktDisclosure]')).injector.get(KtDisclosure);

      dir.expand();
      expect(dir.expanded()).toBe(true);
      dir.collapse();
      expect(dir.expanded()).toBe(false);
      dir.toggle();
      expect(dir.expanded()).toBe(true);
      f.destroy();
    });
  });

  describe('garde-fou a11y (dev)', () => {
    it('avertit quand le déclencheur n’a pas de nom accessible', async () => {
      vi.useFakeTimers();
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      @Component({
        imports: [KtDisclosure, KtDisclosureToggle, KtDisclosureContent],
        template: `
          <div ktDisclosure>
            <button ktDisclosureToggle></button>
            <kt-disclosure-content>x</kt-disclosure-content>
          </div>
        `,
      })
      class NamelessHost {}
      TestBed.configureTestingModule({
        imports: [NamelessHost],
        providers: [{ provide: KT_AUDIT_ENABLED, useValue: true }],
      });
      const f = TestBed.createComponent(NamelessHost);
      f.detectChanges();
      await f.whenStable();
      vi.runAllTimers();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('[ktDisclosureToggle]'));
      f.destroy();
      TestBed.resetTestingModule();
    });

    it('n’avertit pas quand le déclencheur a un aria-label', async () => {
      vi.useFakeTimers();
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      @Component({
        imports: [KtDisclosure, KtDisclosureToggle, KtDisclosureContent],
        template: `
          <div ktDisclosure>
            <button ktDisclosureToggle aria-label="Détails"></button>
            <kt-disclosure-content>x</kt-disclosure-content>
          </div>
        `,
      })
      class LabelledHost {}
      TestBed.configureTestingModule({
        imports: [LabelledHost],
        providers: [{ provide: KT_AUDIT_ENABLED, useValue: true }],
      });
      const f = TestBed.createComponent(LabelledHost);
      f.detectChanges();
      await f.whenStable();
      vi.runAllTimers();
      expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('[ktDisclosureToggle]'));
      f.destroy();
      TestBed.resetTestingModule();
    });

    it('avertit quand l’hôte contient plusieurs panneaux', async () => {
      vi.useFakeTimers();
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      @Component({
        imports: [KtDisclosure, KtDisclosureToggle, KtDisclosureContent],
        template: `
          <div ktDisclosure>
            <button ktDisclosureToggle>T</button>
            <kt-disclosure-content>a</kt-disclosure-content>
            <kt-disclosure-content>b</kt-disclosure-content>
          </div>
        `,
      })
      class MultiPanelHost {}
      TestBed.configureTestingModule({
        imports: [MultiPanelHost],
        providers: [{ provide: KT_AUDIT_ENABLED, useValue: true }],
      });
      const f = TestBed.createComponent(MultiPanelHost);
      f.detectChanges();
      await f.whenStable();
      vi.runAllTimers();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('[ktDisclosure] attend UN seul'));
      f.destroy();
      TestBed.resetTestingModule();
    });

    it('n’avertit pas pour des disclosures imbriqués (un panneau chacun)', async () => {
      vi.useFakeTimers();
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      @Component({
        imports: [KtDisclosure, KtDisclosureToggle, KtDisclosureContent],
        template: `
          <div ktDisclosure>
            <button ktDisclosureToggle>Externe</button>
            <kt-disclosure-content>
              <div ktDisclosure>
                <button ktDisclosureToggle>Interne</button>
                <kt-disclosure-content>x</kt-disclosure-content>
              </div>
            </kt-disclosure-content>
          </div>
        `,
      })
      class NestedHost {}
      TestBed.configureTestingModule({
        imports: [NestedHost],
        providers: [{ provide: KT_AUDIT_ENABLED, useValue: true }],
      });
      const f = TestBed.createComponent(NestedHost);
      f.detectChanges();
      await f.whenStable();
      vi.runAllTimers();
      expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('[ktDisclosure] attend UN seul'));
      f.destroy();
      TestBed.resetTestingModule();
    });
  });
});
