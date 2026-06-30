import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { type KtButtonColor, type KtButtonMode, type KtButtonSize, KT_BUTTON_CONFIG, KtButton } from './button';
import { KT_AUDIT_ENABLED } from '@ktortu/aaa/cdk';

@Component({
  imports: [KtButton],
  template: `
    <button
      ktButton
      [mode]="mode()"
      [color]="color()"
      [size]="size()"
      [fullWidth]="fullWidth()"
      [iconOnly]="iconOnly()"
      [ariaLabel]="ariaLabel()"
      [type]="type()"
      [loading]="loading()"
      [icon]="icon()"
      [iconPosition]="iconPosition()"
      [disabled]="disabled()"
      [disabledInteractive]="disabledInteractive()"
      (click)="onClicked()"
    >
      Test
    </button>
  `,
})
class TestHost {
  mode = signal<KtButtonMode>('filled');
  color = signal<KtButtonColor>('primary');
  size = signal<KtButtonSize>('md');
  fullWidth = signal(false);
  iconOnly = signal(false);
  ariaLabel = signal<string | undefined>(undefined);
  type = signal<'button' | 'submit' | 'reset'>('button');
  loading = signal(false);
  icon = signal<string | undefined>(undefined);
  iconPosition = signal<'start' | 'end'>('start');
  disabled = signal(false);
  disabledInteractive = signal(false);
  clickCount = 0;

  onClicked(): void {
    this.clickCount++;
  }
}

// Host sans binding [disabledInteractive] : laisse jouer le défaut du token
@Component({
  imports: [KtButton],
  template: `<button ktButton [disabled]="true">Test</button>`,
})
class ConfigHost {}

// Host avec aria-label NATIF (sans input ariaLabel) : doit être préservé.
@Component({
  imports: [KtButton],
  template: `<button ktButton iconOnly icon="close" aria-label="Fermer natif">x</button>`,
})
class NativeAriaHost {}

// Host pour la directive posée sur un lien <a>
@Component({
  imports: [KtButton],
  template: `
    <a
      ktButton
      href="/cible"
      [disabled]="disabled()"
      [disabledInteractive]="disabledInteractive()"
      (click)="onClicked()"
      >Lien</a
    >
  `,
})
class AnchorHost {
  disabled = signal(false);
  disabledInteractive = signal(false);
  clickCount = 0;

  onClicked(): void {
    this.clickCount++;
  }
}

describe('Button', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let button: HTMLButtonElement;

  function setup(enableAudit = false): void {
    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: enableAudit ? [{ provide: KT_AUDIT_ENABLED, useValue: true }] : [],
    });
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    button = fixture.nativeElement.querySelector('button');
    fixture.detectChanges();
  }

  afterEach(() => {
    fixture?.destroy();
  });

  describe('rendering', () => {
    beforeEach(() => setup());

    it('should apply the directive to the button', () => {
      expect(button).toBeTruthy();
    });
  });

  describe('mode', () => {
    beforeEach(() => setup());

    it('should default to filled', () => {
      expect(button.getAttribute('data-mode')).toBe('filled');
    });

    it('should reflect each mode through data-mode', () => {
      for (const mode of ['tonal', 'outlined', 'text', 'filled'] as const) {
        host.mode.set(mode);
        fixture.detectChanges();
        expect(button.getAttribute('data-mode')).toBe(mode);
      }
    });
  });

  describe('color', () => {
    beforeEach(() => setup());

    it('should default to primary', () => {
      expect(button.getAttribute('data-color')).toBe('primary');
    });

    it('should reflect each color through data-color', () => {
      for (const color of ['neutral', 'danger', 'primary'] as const) {
        host.color.set(color);
        fixture.detectChanges();
        expect(button.getAttribute('data-color')).toBe(color);
      }
    });
  });

  describe('size', () => {
    beforeEach(() => setup());

    it('should default to md', () => {
      expect(button.getAttribute('data-size')).toBe('md');
    });

    it('should reflect each size through data-size', () => {
      for (const size of ['sm', 'lg', 'md'] as const) {
        host.size.set(size);
        fixture.detectChanges();
        expect(button.getAttribute('data-size')).toBe(size);
      }
    });
  });

  describe('type', () => {
    beforeEach(() => setup());

    it('should default the native type to button (not submit)', () => {
      expect(button.getAttribute('type')).toBe('button');
    });

    it('should reflect submit and reset', () => {
      host.type.set('submit');
      fixture.detectChanges();
      expect(button.getAttribute('type')).toBe('submit');

      host.type.set('reset');
      fixture.detectChanges();
      expect(button.getAttribute('type')).toBe('reset');
    });
  });

  describe('fullWidth', () => {
    beforeEach(() => setup());

    it('should not set data-full-width by default', () => {
      expect(button.hasAttribute('data-full-width')).toBe(false);
    });

    it('should set data-full-width when enabled', () => {
      host.fullWidth.set(true);
      fixture.detectChanges();
      expect(button.hasAttribute('data-full-width')).toBe(true);
    });
  });

  describe('iconOnly', () => {
    beforeEach(() => setup());

    it('should not set data-icon-only by default', () => {
      expect(button.hasAttribute('data-icon-only')).toBe(false);
    });

    it('should set data-icon-only when enabled', () => {
      host.iconOnly.set(true);
      host.icon.set('close');
      host.ariaLabel.set('Fermer');
      fixture.detectChanges();
      expect(button.hasAttribute('data-icon-only')).toBe(true);
    });
  });

  describe('ariaLabel', () => {
    beforeEach(() => setup());

    it('should not set aria-label by default', () => {
      expect(button.hasAttribute('aria-label')).toBe(false);
    });

    it('should reflect the ariaLabel input', () => {
      host.ariaLabel.set('Supprimer');
      fixture.detectChanges();
      expect(button.getAttribute('aria-label')).toBe('Supprimer');
    });
  });

  describe('iconOnly accessibility guard', () => {
    it('should warn when iconOnly has no accessible name', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      setup(true);
      host.iconOnly.set(true);
      host.icon.set('close');
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('[ktButton] iconOnly'));
    });

    it('should not warn when iconOnly has an ariaLabel', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      setup(true);
      host.iconOnly.set(true);
      host.icon.set('close');
      host.ariaLabel.set('Fermer');
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('[ktButton] iconOnly'));
    });

    it('should preserve a native aria-label when no input is provided', () => {
      TestBed.configureTestingModule({ imports: [NativeAriaHost] });
      const nativeFixture = TestBed.createComponent(NativeAriaHost);
      nativeFixture.detectChanges();
      const nativeButton: HTMLButtonElement = nativeFixture.nativeElement.querySelector('button');

      expect(nativeButton.getAttribute('aria-label')).toBe('Fermer natif');
    });
  });

  describe('loading', () => {
    beforeEach(() => setup());

    it('should not have the loading class by default', () => {
      expect(button.classList.contains('loading')).toBe(false);
    });

    it('should toggle the loading class with the loading input', () => {
      host.loading.set(true);
      fixture.detectChanges();
      expect(button.classList.contains('loading')).toBe(true);

      host.loading.set(false);
      fixture.detectChanges();
      expect(button.classList.contains('loading')).toBe(false);
    });

    it('should make the button inert and busy while loading', () => {
      host.loading.set(true);
      fixture.detectChanges();
      expect(button.disabled).toBe(true);
      expect(button.classList.contains('disabled')).toBe(true);
      expect(button.getAttribute('aria-busy')).toBe('true');
    });
  });

  describe('icon', () => {
    beforeEach(() => setup());

    it('should not set the data-icon attribute when no icon is provided', () => {
      expect(button.hasAttribute('data-icon')).toBe(false);
    });

    it('should expose the icon through the data-icon attribute', () => {
      host.icon.set('search');
      fixture.detectChanges();
      expect(button.getAttribute('data-icon')).toBe('search');
    });

    it('should update the data-icon attribute when the icon changes', () => {
      host.icon.set('search');
      fixture.detectChanges();
      host.icon.set('home');
      fixture.detectChanges();
      expect(button.getAttribute('data-icon')).toBe('home');
    });

    it('should remove the data-icon attribute when the icon is cleared', () => {
      host.icon.set('search');
      fixture.detectChanges();
      host.icon.set(undefined);
      fixture.detectChanges();
      expect(button.hasAttribute('data-icon')).toBe(false);
    });
  });

  describe('iconPosition', () => {
    beforeEach(() => setup());

    it('should default to the start position', () => {
      expect(button.getAttribute('data-icon-position')).toBe('start');
    });

    it('should reflect the end position', () => {
      host.iconPosition.set('end');
      fixture.detectChanges();
      expect(button.getAttribute('data-icon-position')).toBe('end');
    });
  });

  describe('disabled', () => {
    beforeEach(() => setup());

    it('should use the native disabled attribute by default', () => {
      host.disabled.set(true);
      fixture.detectChanges();
      expect(button.disabled).toBe(true);
      expect(button.hasAttribute('aria-disabled')).toBe(false);
    });

    it('should halt click events when disabled', () => {
      host.disabled.set(true);
      fixture.detectChanges();
      button.click();
      expect(host.clickCount).toBe(0);
    });
  });

  describe('disabledInteractive', () => {
    beforeEach(() => setup());

    it('should keep the button focusable and use aria-disabled', () => {
      host.disabled.set(true);
      host.disabledInteractive.set(true);
      fixture.detectChanges();

      expect(button.disabled).toBe(false);
      expect(button.getAttribute('aria-disabled')).toBe('true');

      button.focus();
      expect(document.activeElement).toBe(button);
    });

    // La directive bloque l'action par défaut (submit/navigation) via preventDefault().
    // Le handler (click) du consommateur sur le même élément peut, lui, encore se déclencher
    // (cf. avertissement Material : à protéger côté composant).
    it('should prevent the default action while staying interactive', () => {
      host.disabled.set(true);
      host.disabledInteractive.set(true);
      fixture.detectChanges();

      const event = new MouseEvent('click', { cancelable: true, bubbles: true });
      const notDefaultPrevented = button.dispatchEvent(event);

      expect(notDefaultPrevented).toBe(false);
    });
  });

  describe('link (<a>)', () => {
    let anchorFixture: ComponentFixture<AnchorHost>;
    let anchorHost: AnchorHost;
    let anchor: HTMLAnchorElement;

    function setupAnchor(): void {
      TestBed.configureTestingModule({ imports: [AnchorHost] });
      anchorFixture = TestBed.createComponent(AnchorHost);
      anchorHost = anchorFixture.componentInstance;
      anchor = anchorFixture.nativeElement.querySelector('a');
      anchorFixture.detectChanges();
    }

    beforeEach(() => setupAnchor());

    it('should apply the directive to the anchor', () => {
      expect(anchor).toBeTruthy();
    });

    it('should never set a type attribute on a link', () => {
      expect(anchor.hasAttribute('type')).toBe(false);
    });

    it('should use aria-disabled (not a disabled attribute) when disabled', () => {
      anchorHost.disabled.set(true);
      anchorFixture.detectChanges();

      expect(anchor.getAttribute('aria-disabled')).toBe('true');
      expect(anchor.hasAttribute('disabled')).toBe(false);
    });

    it('should not be in tab order when disabled and not interactive', () => {
      anchorHost.disabled.set(true);
      anchorHost.disabledInteractive.set(false);
      anchorFixture.detectChanges();

      expect(anchor.getAttribute('tabindex')).toBe('-1');
    });

    it('should stay in tab order when disabled and interactive', () => {
      anchorHost.disabled.set(true);
      anchorHost.disabledInteractive.set(true);
      anchorFixture.detectChanges();

      expect(anchor.hasAttribute('tabindex')).toBe(false);
    });

    // preventDefault() bloque la navigation. Comme pour le bouton, le handler (click)
    // du consommateur sur le même élément peut encore se déclencher (à protéger côté composant).
    it('should prevent navigation when disabled', () => {
      anchorHost.disabled.set(true);
      anchorFixture.detectChanges();

      const event = new MouseEvent('click', { cancelable: true, bubbles: true });
      const notDefaultPrevented = anchor.dispatchEvent(event);

      expect(notDefaultPrevented).toBe(false);
    });

    it('should not set aria-disabled when enabled', () => {
      expect(anchor.hasAttribute('aria-disabled')).toBe(false);
    });

    it('reflète aussi data-color et data-size sur le lien (hôte tag-agnostique)', () => {
      expect(anchor.getAttribute('data-color')).toBe('primary');
      expect(anchor.getAttribute('data-size')).toBe('md');
    });

    it('lien désactivé + interactif : aria-disabled, aucun disabled, reste dans l’ordre de tab', () => {
      anchorHost.disabled.set(true);
      anchorHost.disabledInteractive.set(true);
      anchorFixture.detectChanges();
      expect(anchor.getAttribute('aria-disabled')).toBe('true');
      expect(anchor.hasAttribute('disabled')).toBe(false);
      expect(anchor.hasAttribute('tabindex')).toBe(false);
    });
  });

  describe('trous a11y complémentaires (audit)', () => {
    it('aria-busy est ABSENT quand loading=false', () => {
      setup();
      expect(button.hasAttribute('aria-busy')).toBe(false);
    });

    it('un <button> désactivé non-interactif ne reçoit JAMAIS de tabindex', () => {
      setup();
      host.disabled.set(true);
      fixture.detectChanges();
      expect(button.hasAttribute('tabindex')).toBe(false);
    });

    it('haltDisabledEvents — chemin positif : un clic sur bouton ACTIF traverse', () => {
      setup();
      button.click();
      expect(host.clickCount).toBe(1);
    });

    it('un ariaLabel d’espaces seuls ne pose PAS d’aria-label (retombe sur natif/null)', () => {
      setup();
      host.ariaLabel.set('   ');
      fixture.detectChanges();
      expect(button.hasAttribute('aria-label')).toBe(false);
    });

    it('data-full-width et data-icon-only sont posés à chaîne vide quand actifs', () => {
      setup();
      host.fullWidth.set(true);
      host.iconOnly.set(true);
      host.icon.set('close');
      host.ariaLabel.set('Fermer');
      fixture.detectChanges();
      expect(button.getAttribute('data-full-width')).toBe('');
      expect(button.getAttribute('data-icon-only')).toBe('');
    });

    it('avertit spécifiquement quand iconOnly sans [icon]', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      setup(true);
      host.iconOnly.set(true); // pas d'icône
      host.ariaLabel.set('Fermer'); // nom accessible OK → seule la garde "icône" doit parler
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(warn).toHaveBeenCalledWith('[ktButton] iconOnly attend une icône via [icon].');
    });
  });

  describe('trous a11y complémentaires — hôtes dédiés', () => {
    it('l’input ariaLabel l’emporte sur l’aria-label natif quand les deux sont présents', () => {
      @Component({
        imports: [KtButton],
        template: `<button ktButton aria-label="natif" ariaLabel="depuis-input">x</button>`,
      })
      class BothAriaHost {}
      TestBed.configureTestingModule({ imports: [BothAriaHost] });
      const f = TestBed.createComponent(BothAriaHost);
      f.detectChanges();
      expect(f.nativeElement.querySelector('button')!.getAttribute('aria-label')).toBe('depuis-input');
    });

    it('aria-labelledby sur l’hôte court-circuite la garde de nom accessible (pas d’avertissement)', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      @Component({
        imports: [KtButton],
        template: `<button ktButton iconOnly icon="close" aria-labelledby="ext">x</button>`,
      })
      class LabelledByHost {}
      TestBed.configureTestingModule({
        imports: [LabelledByHost],
        providers: [{ provide: KT_AUDIT_ENABLED, useValue: true }],
      });
      const f = TestBed.createComponent(LabelledByHost);
      f.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('sans nom accessible'));
      f.destroy();
    });
  });

  describe('global configuration', () => {
    it('should default disabledInteractive from BUTTON_CONFIG', () => {
      TestBed.configureTestingModule({
        imports: [ConfigHost],
        providers: [{ provide: KT_BUTTON_CONFIG, useValue: { disabledInteractive: true } }],
      });
      const configFixture = TestBed.createComponent(ConfigHost);
      configFixture.detectChanges();
      const configButton: HTMLButtonElement = configFixture.nativeElement.querySelector('button');

      expect(configButton.disabled).toBe(false);
      expect(configButton.getAttribute('aria-disabled')).toBe('true');
    });

    it('should default mode/color/size from BUTTON_CONFIG', () => {
      TestBed.configureTestingModule({
        imports: [ConfigHost],
        providers: [
          {
            provide: KT_BUTTON_CONFIG,
            useValue: { mode: 'tonal', color: 'danger', size: 'lg' },
          },
        ],
      });
      const configFixture = TestBed.createComponent(ConfigHost);
      configFixture.detectChanges();
      const configButton: HTMLButtonElement = configFixture.nativeElement.querySelector('button');

      expect(configButton.getAttribute('data-mode')).toBe('tonal');
      expect(configButton.getAttribute('data-color')).toBe('danger');
      expect(configButton.getAttribute('data-size')).toBe('lg');
    });
  });
});
