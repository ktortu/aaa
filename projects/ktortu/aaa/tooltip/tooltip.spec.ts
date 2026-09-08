import { Component, TemplateRef, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { KtTooltip, KT_TOOLTIP_CONFIG, provideKtTooltip, type KtTooltipPosition } from './tooltip';
import { KtTooltipHarness } from './tooltip.harness';

@Component({
  imports: [KtTooltip],
  template: `
    <button
      [ktTooltip]="content()"
      [tooltipPosition]="position()"
      [tooltipDisabled]="disabled()"
      [showDelay]="showDelay()"
      [hideDelay]="hideDelay()"
    >
      Trigger
    </button>
    <ng-template #rich>
      <strong>Titre</strong>
      <ul>
        <li>Ligne 1</li>
        <li>Ligne 2</li>
      </ul>
    </ng-template>
  `,
})
class TestHost {
  rich = viewChild.required<TemplateRef<unknown>>('rich');

  content = signal<string | TemplateRef<unknown>>('Mon info-bulle');
  position = signal<KtTooltipPosition>('top');
  disabled = signal(false);
  showDelay = signal(100);
  hideDelay = signal(100);
}

describe('Tooltip', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let trigger: HTMLButtonElement;

  function setup(): void {
    TestBed.configureTestingModule({ imports: [TestHost] });
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    trigger = fixture.nativeElement.querySelector('button');
    fixture.detectChanges();
  }

  function currentTip(): HTMLElement | null {
    return document.body.querySelector('.kt-tooltip');
  }

  // jsdom n'implémente pas toujours showPopover/hidePopover : on garantit leur présence,
  // puis on les espionne avec une implémentation qui bascule un attribut observable.
  beforeAll(() => {
    HTMLElement.prototype.showPopover ??= function () {
      /* noop : Popover API non implémentée par jsdom */
    };
    HTMLElement.prototype.hidePopover ??= function () {
      /* noop : Popover API non implémentée par jsdom */
    };
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(HTMLElement.prototype, 'showPopover').mockImplementation(function (this: HTMLElement) {
      this.setAttribute('data-open', '');
    });
    vi.spyOn(HTMLElement.prototype, 'hidePopover').mockImplementation(function (this: HTMLElement) {
      this.removeAttribute('data-open');
    });
  });

  afterEach(() => {
    currentTip()?.remove();
    document.body.querySelectorAll('.kt-tooltip').forEach((node) => node.remove());
  });

  describe('creation & accessibility wiring', () => {
    beforeEach(() => {
      setup();
      // On affiche le tooltip pour déclencher la création lazy DOM
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      vi.advanceTimersByTime(100);
      fixture.detectChanges();
    });

    it('creates a tooltip element with role="tooltip" and a unique id', async () => {
      const tip = await TestbedHarnessEnvironment.documentRootLoader(fixture).getHarness(KtTooltipHarness);
      expect(await tip.getRole()).toBe('tooltip');
      expect(await tip.getId()).toMatch(/^kt-tooltip-\d+$/);
    });

    it('wires aria-describedby on the trigger to the tooltip id', () => {
      expect(trigger.getAttribute('aria-describedby')).toBe(currentTip()?.id);
    });

    it('reflects the tooltipPosition through data-position and updates it', () => {
      expect(currentTip()?.getAttribute('data-position')).toBe('top');

      host.position.set('bottom');
      fixture.detectChanges();
      expect(currentTip()?.getAttribute('data-position')).toBe('bottom');
    });

    it('reflète aussi les positions left et right', () => {
      for (const pos of ['left', 'right'] as const) {
        host.position.set(pos);
        fixture.detectChanges();
        expect(currentTip()?.getAttribute('data-position')).toBe(pos);
      }
    });

    it('le tip est un popover="manual" affiché via showPopover()', () => {
      const tip = currentTip()!;
      expect(tip.getAttribute('popover')).toBe('manual');
      // On asserte l'APPEL réel de l'API (le `data-open` n'est qu'un proxy posé par le mock jsdom).
      expect(HTMLElement.prototype.showPopover).toHaveBeenCalled();
      expect(tip.hasAttribute('data-open')).toBe(true);
    });

    it('ancrage CSS : anchor-name sur le trigger, position-anchor sur le tip', () => {
      expect(trigger.style.getPropertyValue('anchor-name')).toMatch(/^--kt-tooltip-anchor-\d+$/);
      expect(currentTip()!.style.getPropertyValue('position-anchor')).toMatch(/^--kt-tooltip-anchor-\d+$/);
    });
  });

  describe('unique identifiers', () => {
    it('gives two instances distinct ids (counter, no randomness)', () => {
      @Component({
        imports: [KtTooltip],
        template: `
          <button id="btnA" [ktTooltip]="'A'">A</button>
          <button id="btnB" [ktTooltip]="'B'">B</button>
        `,
      })
      class TwoHost {}

      TestBed.configureTestingModule({ imports: [TwoHost] });
      const twoFixture = TestBed.createComponent(TwoHost);
      twoFixture.detectChanges();

      const btnA = twoFixture.nativeElement.querySelector('#btnA');
      const btnB = twoFixture.nativeElement.querySelector('#btnB');

      btnA.dispatchEvent(new MouseEvent('mouseenter'));
      btnB.dispatchEvent(new MouseEvent('mouseenter'));
      vi.advanceTimersByTime(200);
      twoFixture.detectChanges();

      const ids = Array.from(twoFixture.nativeElement.ownerDocument.body.querySelectorAll('.kt-tooltip')).map(
        (t) => (t as HTMLElement).id,
      );
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.length).toBeGreaterThanOrEqual(2);

      twoFixture.destroy();
    });
  });

  describe('content', () => {
    beforeEach(() => {
      setup();
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      vi.advanceTimersByTime(100);
      fixture.detectChanges();
    });

    it('renders a string as textContent and keeps it in sync', () => {
      expect(currentTip()?.textContent?.trim()).toBe('Mon info-bulle');

      host.content.set('Texte mis à jour');
      fixture.detectChanges();
      expect(currentTip()?.textContent?.trim()).toBe('Texte mis à jour');
    });

    it('projects a TemplateRef as non-interactive rich content', () => {
      host.content.set(host.rich());
      fixture.detectChanges();

      const tip = currentTip();
      expect(tip?.querySelector('strong')?.textContent).toBe('Titre');
      expect(tip?.querySelectorAll('li')).toHaveLength(2);
    });

    it('correctly handles swapping between string and TemplateRef dynamically', () => {
      // 1. Initialement : string
      expect(currentTip()?.textContent?.trim()).toBe('Mon info-bulle');

      // 2. Switch vers TemplateRef
      host.content.set(host.rich());
      fixture.detectChanges();
      let tip = currentTip();
      expect(tip?.querySelector('strong')?.textContent).toBe('Titre');
      expect(tip?.textContent?.includes('Mon info-bulle')).toBe(false);

      // 3. Switch vers un autre string
      host.content.set('Nouveau texte');
      fixture.detectChanges();
      tip = currentTip();
      expect(tip?.querySelector('strong')).toBeNull();
      expect(tip?.textContent?.trim()).toBe('Nouveau texte');
    });
  });

  describe('show / hide', () => {
    beforeEach(() => setup());

    it('shows on focusin after the show delay', () => {
      trigger.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      vi.advanceTimersByTime(100);
      fixture.detectChanges();
      expect(currentTip()?.hasAttribute('data-open')).toBe(true);
    });

    it('shows on mouseenter after the show delay', () => {
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      vi.advanceTimersByTime(100);
      fixture.detectChanges();
      expect(currentTip()?.hasAttribute('data-open')).toBe(true);
    });

    it('hides on mouseleave after the hide delay', () => {
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      vi.advanceTimersByTime(100);
      fixture.detectChanges();

      trigger.dispatchEvent(new MouseEvent('mouseleave'));
      vi.advanceTimersByTime(100);
      fixture.detectChanges();
      expect(currentTip()).toBeNull();
    });

    it('hides on focusout (blur) after the hide delay', () => {
      trigger.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      vi.advanceTimersByTime(100);
      fixture.detectChanges();

      trigger.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      vi.advanceTimersByTime(100);
      fixture.detectChanges();
      expect(currentTip()).toBeNull();
    });

    it('retire aria-describedby du trigger après fermeture (mouseleave)', () => {
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      vi.advanceTimersByTime(100);
      fixture.detectChanges();
      expect(trigger.hasAttribute('aria-describedby')).toBe(true);

      trigger.dispatchEvent(new MouseEvent('mouseleave'));
      vi.advanceTimersByTime(100);
      fixture.detectChanges();
      expect(trigger.hasAttribute('aria-describedby')).toBe(false);
    });

    it('se ferme quand on quitte le tooltip lui-même (mouseleave sur le tip)', () => {
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      vi.advanceTimersByTime(100);
      fixture.detectChanges();
      const tip = currentTip()!;

      tip.dispatchEvent(new MouseEvent('mouseleave'));
      vi.advanceTimersByTime(100);
      fixture.detectChanges();
      expect(currentTip()).toBeNull();
    });

    it('anti-flicker : mouseenter puis mouseleave avant showDelay n’affiche jamais le tip', () => {
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      vi.advanceTimersByTime(50); // avant les 100ms de showDelay
      trigger.dispatchEvent(new MouseEvent('mouseleave'));
      vi.advanceTimersByTime(200);
      fixture.detectChanges();
      expect(currentTip()).toBeNull();
    });

    it('stays open when the pointer moves from the trigger onto the tooltip (hoverable)', () => {
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      vi.advanceTimersByTime(100);
      fixture.detectChanges();
      const tip = currentTip();

      // Quitte le trigger puis entre dans le tooltip avant la fin du hideDelay.
      trigger.dispatchEvent(new MouseEvent('mouseleave'));
      vi.advanceTimersByTime(50);
      fixture.detectChanges();
      tip?.dispatchEvent(new MouseEvent('mouseenter'));
      vi.advanceTimersByTime(100);
      fixture.detectChanges();

      expect(tip?.hasAttribute('data-open')).toBe(true);
    });
  });

  describe('dismiss à l’activation (pointerdown)', () => {
    beforeEach(() => setup());

    it('ferme immédiatement l’infobulle affichée quand on presse la cible (ex. ouverture d’une sheet)', () => {
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      vi.advanceTimersByTime(100);
      fixture.detectChanges();
      expect(currentTip()).toBeTruthy();

      // Activation (clic/tap) : fermeture SANS attendre le hideDelay.
      trigger.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      fixture.detectChanges();
      expect(currentTip()).toBeNull();
    });

    it('annule un affichage EN ATTENTE (pointerdown avant la fin du showDelay)', () => {
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      vi.advanceTimersByTime(50); // avant les 100ms de showDelay
      trigger.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      vi.advanceTimersByTime(200);
      fixture.detectChanges();
      expect(currentTip()).toBeNull();
    });
  });

  describe('dismiss with Escape', () => {
    beforeEach(() => setup());

    it('hides on Escape and stops propagation when triggered on the host', () => {
      trigger.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      vi.advanceTimersByTime(100);
      fixture.detectChanges();

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
      const stopSpy = vi.spyOn(event, 'stopPropagation');
      trigger.dispatchEvent(event);
      fixture.detectChanges();

      expect(currentTip()).toBeNull();
      expect(stopSpy).toHaveBeenCalled();
    });

    it('hides on global Escape even if focus is not on the trigger', () => {
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      vi.advanceTimersByTime(100);
      fixture.detectChanges();

      expect(currentTip()).toBeTruthy();

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
      document.dispatchEvent(event);
      fixture.detectChanges();

      expect(currentTip()).toBeNull();
    });

    it('Échap sans rien d’affiché : ne stoppe pas la propagation (garde isShown)', () => {
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
      const stopSpy = vi.spyOn(event, 'stopPropagation');
      trigger.dispatchEvent(event); // aucun tooltip affiché
      expect(stopSpy).not.toHaveBeenCalled();
    });
  });

  describe('défauts & cascade de configuration', () => {
    it('délais par défaut : show 150ms / hide 100ms', () => {
      @Component({ imports: [KtTooltip], template: `<button [ktTooltip]="'x'">T</button>` })
      class DefaultDelayHost {}
      TestBed.configureTestingModule({ imports: [DefaultDelayHost] });
      const f = TestBed.createComponent(DefaultDelayHost);
      f.detectChanges();
      const btn: HTMLButtonElement = f.nativeElement.querySelector('button');

      btn.dispatchEvent(new MouseEvent('mouseenter'));
      vi.advanceTimersByTime(149);
      f.detectChanges();
      expect(document.body.querySelector('.kt-tooltip')).toBeNull(); // pas encore (défaut 150)
      vi.advanceTimersByTime(1);
      f.detectChanges();
      expect(document.body.querySelector('.kt-tooltip')).toBeTruthy();
      f.destroy();
    });

    it('KT_TOOLTIP_CONFIG (provideKtTooltip) pilote délai et position', () => {
      @Component({ imports: [KtTooltip], template: `<button [ktTooltip]="'x'">T</button>` })
      class ConfigHost {}
      TestBed.configureTestingModule({
        imports: [ConfigHost],
        providers: [provideKtTooltip({ showDelay: 300, position: 'bottom' })],
      });
      const f = TestBed.createComponent(ConfigHost);
      f.detectChanges();
      const btn: HTMLButtonElement = f.nativeElement.querySelector('button');

      btn.dispatchEvent(new MouseEvent('mouseenter'));
      vi.advanceTimersByTime(299);
      f.detectChanges();
      expect(document.body.querySelector('.kt-tooltip')).toBeNull(); // défaut config 300ms
      vi.advanceTimersByTime(1);
      f.detectChanges();
      expect(document.body.querySelector('.kt-tooltip')?.getAttribute('data-position')).toBe('bottom');
      f.destroy();
    });

    it('valide aussi la lecture brute du token KT_TOOLTIP_CONFIG', () => {
      expect(KT_TOOLTIP_CONFIG.toString()).toContain('KT_TOOLTIP_CONFIG');
    });
  });

  describe('garde-fou contenu interactif (dev)', () => {
    it('avertit quand un TemplateRef contient un élément interactif, pas sinon', () => {
      @Component({
        imports: [KtTooltip],
        template: `
          <button [ktTooltip]="tpl()">T</button>
          <ng-template #richTpl><button>cliquable</button></ng-template>
        `,
      })
      class InteractiveTplHost {
        tpl = viewChild.required<TemplateRef<unknown>>('richTpl');
      }
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      TestBed.configureTestingModule({ imports: [InteractiveTplHost] });
      const f = TestBed.createComponent(InteractiveTplHost);
      f.detectChanges();
      const btn: HTMLButtonElement = f.nativeElement.querySelector('button');
      btn.dispatchEvent(new MouseEvent('mouseenter'));
      vi.advanceTimersByTime(150);
      f.detectChanges();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('ne doit pas contenir'));
      f.destroy();
    });
  });

  describe('disabled & empty content', () => {
    it('does not create a tooltip nor describe the trigger when disabled', () => {
      host = (setup(), host);
      host.disabled.set(true);
      fixture.detectChanges();

      expect(currentTip()).toBeNull();
      expect(trigger.hasAttribute('aria-describedby')).toBe(false);
    });

    it('treats whitespace-only string content as inactive', () => {
      setup();
      host.content.set('   ');
      fixture.detectChanges();

      expect(currentTip()).toBeNull();
      expect(trigger.hasAttribute('aria-describedby')).toBe(false);
    });

    it('disables the tooltip while it is open without crashing with signal write in effect error', () => {
      setup();
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      vi.advanceTimersByTime(100);
      fixture.detectChanges();
      expect(currentTip()).toBeTruthy();

      host.disabled.set(true);
      fixture.detectChanges();

      expect(currentTip()).toBeNull();
      expect(trigger.hasAttribute('aria-describedby')).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('removes the tooltip element from the body on destroy', () => {
      setup();
      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      vi.advanceTimersByTime(100);
      fixture.detectChanges();
      expect(currentTip()).toBeTruthy();

      fixture.destroy();
      expect(currentTip()).toBeNull();
    });
  });
});
