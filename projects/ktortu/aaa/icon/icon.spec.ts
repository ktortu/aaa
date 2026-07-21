import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { KT_AUDIT_ENABLED } from '@ktortu/aaa/cdk';
import { KT_ICON_CONFIG, KtIcon, provideKtIcon } from './icon';
import { KtIconHarness } from './icon.harness';

@Component({
  imports: [KtIcon],
  template: `<span [ktIcon]="name()" [font]="font()" [ariaLabel]="ariaLabel()" [size]="size()" [fill]="fill()"></span>`,
})
class TestHost {
  name = signal<string>('');
  font = signal<string | undefined>(undefined);
  ariaLabel = signal<string | undefined>(undefined);
  size = signal<string | undefined>(undefined);
  fill = signal(false);
}

// Hôte en mode PROJECTION (set à classes) : ktIcon vide + contenu projeté.
@Component({
  imports: [KtIcon],
  template: `<span ktIcon [ariaLabel]="ariaLabel()"><i class="fa-solid fa-user"></i></span>`,
})
class ProjectionHost {
  ariaLabel = signal<string | undefined>(undefined);
}

// Hôte avec aria-label NATIF (sans input ariaLabel) : doit être préservé.
@Component({
  imports: [KtIcon],
  template: `<span ktIcon="home" aria-label="Accueil natif"></span>`,
})
class NativeAriaHost {}

describe('Icon', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  function setup(providers: unknown[] = []): void {
    TestBed.configureTestingModule({
      imports: [TestHost],
      // Audit désactivé par défaut : évite les fuites de console.warn entre tests (isolation CI).
      providers: [{ provide: KT_AUDIT_ENABLED, useValue: false }, ...(providers as [])],
    });
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement.querySelector('.kt-icon');
  }

  afterEach(() => {
    fixture?.destroy();
  });

  describe('ligature (data-icon)', () => {
    beforeEach(() => setup());

    it('should not set data-icon when the name is empty (laisse place à la projection)', () => {
      expect(el.hasAttribute('data-icon')).toBe(false);
    });

    it('should reflect the icon name through data-icon', () => {
      host.name.set('home');
      fixture.detectChanges();
      expect(el.getAttribute('data-icon')).toBe('home');
    });

    it('should trim the name and drop data-icon for a whitespace-only name', () => {
      host.name.set('   ');
      fixture.detectChanges();
      expect(el.hasAttribute('data-icon')).toBe(false);

      host.name.set('  search  ');
      fixture.detectChanges();
      expect(el.getAttribute('data-icon')).toBe('search');
    });
  });

  describe('accessibilité', () => {
    beforeEach(() => setup());

    it('should be decorative by default (aria-hidden, no role/label)', () => {
      host.name.set('home');
      fixture.detectChanges();
      expect(el.getAttribute('aria-hidden')).toBe('true');
      expect(el.hasAttribute('role')).toBe(false);
      expect(el.hasAttribute('aria-label')).toBe(false);
    });

    it('should become meaningful (role=img + aria-label) when ariaLabel is provided', () => {
      host.name.set('error');
      host.ariaLabel.set('Erreur');
      fixture.detectChanges();
      expect(el.getAttribute('role')).toBe('img');
      expect(el.getAttribute('aria-label')).toBe('Erreur');
      expect(el.hasAttribute('aria-hidden')).toBe(false);
    });

    it('should stay decorative for a whitespace-only ariaLabel', () => {
      host.ariaLabel.set('   ');
      fixture.detectChanges();
      expect(el.getAttribute('aria-hidden')).toBe('true');
      expect(el.hasAttribute('role')).toBe(false);
    });
  });

  describe('aria-label natif (préservation)', () => {
    it('should preserve a native aria-label when no input is provided (role=img, not hidden)', () => {
      TestBed.configureTestingModule({ imports: [NativeAriaHost] });
      const f = TestBed.createComponent(NativeAriaHost);
      f.detectChanges();
      const icon: HTMLElement = f.nativeElement.querySelector('.kt-icon');
      expect(icon.getAttribute('aria-label')).toBe('Accueil natif');
      expect(icon.getAttribute('role')).toBe('img');
      expect(icon.hasAttribute('aria-hidden')).toBe(false);
      f.destroy();
    });
  });

  describe('projection (set à classes)', () => {
    it('should render projected content without a ligature (no data-icon), decorative by default', () => {
      TestBed.configureTestingModule({ imports: [ProjectionHost] });
      const f = TestBed.createComponent(ProjectionHost);
      f.detectChanges();
      const icon: HTMLElement = f.nativeElement.querySelector('.kt-icon');
      expect(icon.hasAttribute('data-icon')).toBe(false);
      expect(icon.querySelector('i.fa-solid')).toBeTruthy();
      expect(icon.getAttribute('aria-hidden')).toBe('true');
      f.destroy();
    });

    it('should become meaningful (role=img) while data-icon stays absent', () => {
      TestBed.configureTestingModule({ imports: [ProjectionHost] });
      const f = TestBed.createComponent(ProjectionHost);
      const projHost = f.componentInstance;
      projHost.ariaLabel.set('Profil');
      f.detectChanges();
      const icon: HTMLElement = f.nativeElement.querySelector('.kt-icon');
      expect(icon.hasAttribute('data-icon')).toBe(false);
      expect(icon.getAttribute('role')).toBe('img');
      expect(icon.getAttribute('aria-label')).toBe('Profil');
      f.destroy();
    });
  });

  describe('taille', () => {
    beforeEach(() => setup());

    it('should not set --kt-icon-size by default', () => {
      expect(el.style.getPropertyValue('--kt-icon-size')).toBe('');
    });

    it('should expose the size through --kt-icon-size', () => {
      host.size.set('2rem');
      fixture.detectChanges();
      expect(el.style.getPropertyValue('--kt-icon-size')).toBe('2rem');
    });
  });

  describe('registre de polices', () => {
    it('should not set --kt-icon-font without a registry (falls back to the CSS cascade)', () => {
      setup();
      host.name.set('home');
      fixture.detectChanges();
      expect(el.style.getPropertyValue('--kt-icon-font')).toBe('');
    });

    it('should apply the default font and leave weight/variation unset when the font omits them', () => {
      setup([
        provideKtIcon({
          fonts: {
            material: { family: 'Material Symbols Outlined' },
            rounded: { family: 'Material Symbols Rounded', weight: 300, variationSettings: "'FILL' 0" },
          },
          defaultFont: 'material',
        }),
      ]);
      host.name.set('home');
      fixture.detectChanges();
      expect(el.style.getPropertyValue('--kt-icon-font')).toBe('Material Symbols Outlined');
      // Police sans weight/variation : les propriétés restent NON posées (pas de 'undefined' émis).
      expect(el.style.getPropertyValue('--kt-icon-font-weight')).toBe('');
      expect(el.style.getPropertyValue('--kt-icon-font-variation')).toBe('');
    });

    it('should resolve the family/weight/variation from an explicit [font] alias', () => {
      setup([
        provideKtIcon({
          fonts: {
            material: { family: 'Material Symbols Outlined' },
            rounded: { family: 'Material Symbols Rounded', weight: 300, variationSettings: "'FILL' 0" },
          },
          defaultFont: 'material',
        }),
      ]);
      host.name.set('favorite');
      host.font.set('rounded');
      fixture.detectChanges();
      expect(el.style.getPropertyValue('--kt-icon-font')).toBe('Material Symbols Rounded');
      expect(el.style.getPropertyValue('--kt-icon-font-weight')).toBe('300');
      expect(el.style.getPropertyValue('--kt-icon-font-variation')).toBe("'FILL' 0");
    });

    it('should ignore an unknown alias (no font styles applied)', () => {
      setup([provideKtIcon({ fonts: { material: { family: 'Material Symbols Outlined' } }, defaultFont: 'material' })]);
      host.name.set('home');
      host.font.set('does-not-exist');
      fixture.detectChanges();
      expect(el.style.getPropertyValue('--kt-icon-font')).toBe('');
    });
  });

  describe('fill (rempli / contour)', () => {
    it('should not set any variation by default (contour)', () => {
      setup();
      host.name.set('favorite');
      fixture.detectChanges();
      expect(el.style.getPropertyValue('--kt-icon-font-variation')).toBe('');
    });

    it('should force FILL 1 when [fill] is set, without a registry', () => {
      setup();
      host.name.set('favorite');
      host.fill.set(true);
      fixture.detectChanges();
      expect(el.style.getPropertyValue('--kt-icon-font-variation')).toBe("'FILL' 1");
    });

    it('should append FILL 1 while preserving the registry axes (last duplicate axis wins)', () => {
      setup([
        provideKtIcon({
          fonts: { rounded: { family: 'Material Symbols Rounded', variationSettings: "'FILL' 0, 'wght' 300" } },
          defaultFont: 'rounded',
        }),
      ]);
      host.name.set('favorite');
      host.fill.set(true);
      fixture.detectChanges();
      expect(el.style.getPropertyValue('--kt-icon-font-variation')).toBe("'FILL' 0, 'wght' 300, 'FILL' 1");
    });
  });

  describe('garde-fou dev (audit)', () => {
    it('should warn when an explicit alias is missing from the registry', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      setup([
        { provide: KT_AUDIT_ENABLED, useValue: true },
        provideKtIcon({ fonts: { material: { family: 'Material Symbols Outlined' } }, defaultFont: 'material' }),
      ]);
      host.font.set('ghost');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('[ktIcon] police "ghost"'));
      warn.mockRestore();
    });

    it('should warn when defaultFont itself is missing from the registry (no explicit [font])', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      setup([
        { provide: KT_AUDIT_ENABLED, useValue: true },
        // defaultFont volontairement absent des fonts (le token bas-niveau contourne le typage de provideKtIcon).
        { provide: KT_ICON_CONFIG, useValue: { fonts: {}, defaultFont: 'rouded' } },
      ]);
      host.name.set('home');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('[ktIcon] police "rouded"'));
      warn.mockRestore();
    });

    it('should not warn for a known alias', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      setup([
        { provide: KT_AUDIT_ENABLED, useValue: true },
        provideKtIcon({ fonts: { material: { family: 'Material Symbols Outlined' } }, defaultFont: 'material' }),
      ]);
      host.font.set('material');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('[ktIcon]'));
      warn.mockRestore();
    });
  });

  describe('harness', () => {
    let loader: HarnessLoader;

    beforeEach(() => {
      setup();
      loader = TestbedHarnessEnvironment.loader(fixture);
    });

    it('should expose the name, decorative state, role and aria-label', async () => {
      host.name.set('home');
      fixture.detectChanges();
      let icon = await loader.getHarness(KtIconHarness);
      expect(await icon.getName()).toBe('home');
      expect(await icon.isDecorative()).toBe(true);
      expect(await icon.getRole()).toBeNull();
      expect(await icon.getAriaLabel()).toBeNull();

      host.ariaLabel.set('Accueil');
      fixture.detectChanges();
      icon = await loader.getHarness(KtIconHarness);
      expect(await icon.isDecorative()).toBe(false);
      expect(await icon.getRole()).toBe('img');
      expect(await icon.getAriaLabel()).toBe('Accueil');
    });

    it('should report null name in projection mode (no ligature)', async () => {
      // ktIcon reste vide → pas de data-icon.
      const icon = await loader.getHarness(KtIconHarness);
      expect(await icon.getName()).toBeNull();
    });

    it('should target an icon by name via the harness predicate', async () => {
      host.name.set('settings');
      fixture.detectChanges();
      const icon = await loader.getHarness(KtIconHarness.with({ name: 'settings' }));
      expect(await icon.getName()).toBe('settings');
    });

    it('should target an icon by fill state via the harness predicate', async () => {
      host.name.set('favorite');
      host.fill.set(true);
      fixture.detectChanges();
      const icon = await loader.getHarness(KtIconHarness.with({ filled: true }));
      expect(await icon.isFilled()).toBe(true);
    });

    it('should expose size and font family', async () => {
      host.size.set('2rem');
      host.name.set('home');
      fixture.detectChanges();
      const icon = await loader.getHarness(KtIconHarness);
      expect(await icon.getSize()).toBe('2rem');
      expect(await icon.getFontFamily()).toBe('');
    });
  });
});

@Component({
  imports: [KtIcon],
  template: `<span ktIcon="favorite" fill></span>`,
})
class BooleanFillHost {}

describe('Icon (boolean attribute shortcut)', () => {
  it('should accept the fill attribute without a binding (booleanAttribute)', () => {
    TestBed.configureTestingModule({ imports: [BooleanFillHost] });
    const f = TestBed.createComponent(BooleanFillHost);
    f.detectChanges();
    const icon: HTMLElement = f.nativeElement.querySelector('.kt-icon');
    expect(icon.style.getPropertyValue('--kt-icon-font-variation')).toBe("'FILL' 1");
    f.destroy();
  });
});

@Component({
  imports: [KtIcon],
  template: `<span ktIcon><button>Focusable</button></span>`,
})
class FocusableChildHost {}

describe('Icon (WCAG 4.1.2 audit)', () => {
  it('should warn when a decorative icon contains a focusable child', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      imports: [FocusableChildHost],
      providers: [{ provide: KT_AUDIT_ENABLED, useValue: true }],
    });
    const f = TestBed.createComponent(FocusableChildHost);
    f.detectChanges();
    await f.whenStable();

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[ktIcon] (WCAG 4.1.2)'));
    warn.mockRestore();
    f.destroy();
  });
});
