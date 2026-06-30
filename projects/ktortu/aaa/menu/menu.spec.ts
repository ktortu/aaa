import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Menu, MenuItem, MenuTrigger } from '@angular/aria/menu';

import { KtMenu, KtMenuItem, KtMenuSeparator } from './menu';
import { KtMenuItemCheckbox, KtMenuItemRadio, KtMenuRadioGroup } from './menu-toggle';
import { KtMenuTrigger } from './menu-trigger';

// Ces specs couvrent la logique PROPRE à la lib (le comportement accessible — clavier, focus,
// ouverture — appartient à @angular/aria et est testé chez eux). On vérifie : la sémantique du
// séparateur, la prise en charge d'aria-checked (le trou comblé), l'exclusivité radio, et le
// câblage d'ancrage CSS du déclencheur.

@Component({
  imports: [KtMenuSeparator],
  template: `<hr ktMenuSeparator />`,
})
class SeparatorHost {}

@Component({
  imports: [KtMenuItemCheckbox],
  template: `<button ktMenuItemCheckbox role="menuitemcheckbox" [(checked)]="checked">Retour à la ligne</button>`,
})
class CheckboxHost {
  readonly checked = signal(false);
}

@Component({
  imports: [KtMenuRadioGroup, KtMenuItemRadio],
  template: `
    <div ktMenuRadioGroup [(value)]="value">
      <button ktMenuItemRadio role="menuitemradio" [value]="'name'">Nom</button>
      <button ktMenuItemRadio role="menuitemradio" [value]="'date'">Date</button>
      <button ktMenuItemRadio role="menuitemradio" [value]="'size'">Taille</button>
    </div>
  `,
})
class RadioHost {
  readonly value = signal<string | null>('name');
}

@Component({
  imports: [Menu, MenuItem, MenuTrigger, KtMenu, KtMenuItem, KtMenuTrigger],
  template: `
    <button ngMenuTrigger ktMenuTrigger [menu]="m">Ouvrir</button>
    <div ngMenu ktMenu #m="ngMenu">
      <button ngMenuItem ktMenuItem [value]="'a'">A</button>
    </div>
  `,
})
class TriggerHost {}

@Component({
  imports: [Menu, MenuItem, MenuTrigger, KtMenu, KtMenuItem, KtMenuTrigger],
  template: `
    <button ngMenuTrigger ktMenuTrigger [menu]="m">Ouvrir</button>
    <div ngMenu ktMenu id="m" #m="ngMenu">
      <button ngMenuItem ktMenuItem [value]="'sub'" [submenu]="sub">Sub</button>
    </div>
    <div ngMenu ktMenu id="sub" #sub="ngMenu">
      <button ngMenuItem ktMenuItem [value]="'b'">B</button>
    </div>
  `,
})
class SubmenuHost {}

describe('Menu', () => {
  describe('KtMenuSeparator', () => {
    it('should expose the separator role', () => {
      TestBed.configureTestingModule({ imports: [SeparatorHost] });
      const f = TestBed.createComponent(SeparatorHost);
      f.detectChanges();
      const sep: HTMLElement = f.nativeElement.querySelector('[ktMenuSeparator]');
      expect(sep.getAttribute('role')).toBe('separator');
    });
  });

  describe('KtMenuItemCheckbox', () => {
    let fixture: ComponentFixture<CheckboxHost>;
    let host: CheckboxHost;
    let item: HTMLButtonElement;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [CheckboxHost] });
      fixture = TestBed.createComponent(CheckboxHost);
      host = fixture.componentInstance;
      item = fixture.nativeElement.querySelector('[ktMenuItemCheckbox]');
      fixture.detectChanges();
    });

    it('should reflect the checked state through aria-checked (the gap aria leaves)', () => {
      expect(item.getAttribute('aria-checked')).toBe('false');

      host.checked.set(true);
      fixture.detectChanges();
      expect(item.getAttribute('aria-checked')).toBe('true');
    });

    it('should toggle on activation (click), updating the two-way binding', () => {
      item.click();
      fixture.detectChanges();
      expect(host.checked()).toBe(true);
      expect(item.getAttribute('aria-checked')).toBe('true');

      item.click();
      fixture.detectChanges();
      expect(host.checked()).toBe(false);
      expect(item.getAttribute('aria-checked')).toBe('false');
    });

    it('should toggle on keydown.enter', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      item.dispatchEvent(event);
      fixture.detectChanges();
      expect(host.checked()).toBe(true);
      expect(item.getAttribute('aria-checked')).toBe('true');
    });

    it('should toggle on keydown.space', () => {
      const event = new KeyboardEvent('keydown', { key: ' ' });
      item.dispatchEvent(event);
      fixture.detectChanges();
      expect(host.checked()).toBe(true);
      expect(item.getAttribute('aria-checked')).toBe('true');
    });
  });

  describe('KtMenuItemCheckbox — anti double-bascule', () => {
    it('keydown.enter : preventDefault appelé → une seule bascule', () => {
      TestBed.configureTestingModule({ imports: [CheckboxHost] });
      const f = TestBed.createComponent(CheckboxHost);
      f.detectChanges();
      const item: HTMLButtonElement = f.nativeElement.querySelector('[ktMenuItemCheckbox]');
      const ev = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
      item.dispatchEvent(ev);
      f.detectChanges();
      expect(ev.defaultPrevented).toBe(true); // neutralise le click synthétique
      expect(f.componentInstance.checked()).toBe(true); // une seule bascule
    });
  });

  describe('KtMenuItemRadio / KtMenuRadioGroup', () => {
    let fixture: ComponentFixture<RadioHost>;
    let host: RadioHost;
    let radios: HTMLButtonElement[];

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [RadioHost] });
      fixture = TestBed.createComponent(RadioHost);
      host = fixture.componentInstance;
      radios = Array.from(fixture.nativeElement.querySelectorAll('[ktMenuItemRadio]'));
      fixture.detectChanges();
    });

    it('should mark only the radio matching the group value as checked', () => {
      expect(radios.map((r) => r.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false']);
    });

    it('should select on activation and stay mutually exclusive', () => {
      radios[1].click(); // Date
      fixture.detectChanges();

      expect(host.value()).toBe('date');
      expect(radios.map((r) => r.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false']);
    });

    it('sélectionne au clavier (Entrée puis Espace)', () => {
      radios[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
      fixture.detectChanges();
      expect(host.value()).toBe('date');

      radios[2].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', cancelable: true }));
      fixture.detectChanges();
      expect(host.value()).toBe('size');
      expect(radios.map((r) => r.getAttribute('aria-checked'))).toEqual(['false', 'false', 'true']);
    });
  });

  describe('KtMenuItemRadio sans groupe parent', () => {
    it('aria-checked reste "false" et l’activation est un no-op sans crash', () => {
      @Component({
        imports: [KtMenuItemRadio],
        template: `<button ktMenuItemRadio role="menuitemradio" [value]="'x'">Orphelin</button>`,
      })
      class OrphanRadioHost {}
      TestBed.configureTestingModule({ imports: [OrphanRadioHost] });
      const f = TestBed.createComponent(OrphanRadioHost);
      f.detectChanges();
      const radio: HTMLButtonElement = f.nativeElement.querySelector('[ktMenuItemRadio]');
      expect(radio.getAttribute('aria-checked')).toBe('false');
      expect(() => radio.click()).not.toThrow();
      expect(radio.getAttribute('aria-checked')).toBe('false');
    });
  });

  describe('garde-fous dev (console.warn)', () => {
    it('checkbox sans role="menuitemcheckbox" avertit', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      @Component({
        imports: [KtMenuItemCheckbox],
        template: `<button ktMenuItemCheckbox [(checked)]="checked">X</button>`,
      })
      class NoRoleCheckboxHost {
        checked = signal(false);
      }
      TestBed.configureTestingModule({ imports: [NoRoleCheckboxHost] });
      TestBed.createComponent(NoRoleCheckboxHost).detectChanges();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('[ktMenuItemCheckbox]'));
    });

    it('radio hors d’un ktMenuRadioGroup avertit', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      @Component({
        imports: [KtMenuItemRadio],
        template: `<button ktMenuItemRadio role="menuitemradio" [value]="'x'">X</button>`,
      })
      class NoGroupRadioHost {}
      TestBed.configureTestingModule({ imports: [NoGroupRadioHost] });
      TestBed.createComponent(NoGroupRadioHost).detectChanges();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('[ktMenuItemRadio]'));
    });
  });

  describe('KtMenuTrigger anchoring', () => {
    it('should anchor the menu surface to the trigger (anchor-name ↔ position-anchor)', () => {
      TestBed.configureTestingModule({ imports: [TriggerHost] });
      const f = TestBed.createComponent(TriggerHost);
      f.detectChanges();

      const trigger: HTMLElement = f.nativeElement.querySelector('[ktMenuTrigger]');
      const menu: HTMLElement = f.nativeElement.querySelector('[ktMenu]');

      const anchorName = trigger.style.getPropertyValue('anchor-name');
      expect(anchorName).toMatch(/^--kt-menu-anchor-\d+$/);
      expect(menu.style.getPropertyValue('position-anchor')).toBe(anchorName);
    });
  });

  describe('KtMenuItem submenu anchoring', () => {
    it('should anchor the submenu surface to the parent menuitem (anchor-name ↔ position-anchor)', () => {
      TestBed.configureTestingModule({ imports: [SubmenuHost] });
      const f = TestBed.createComponent(SubmenuHost);
      f.detectChanges();

      // Enclencher l'ouverture pour instancier les liens d'ancre du sous-menu
      const trigger: HTMLElement = f.nativeElement.querySelector('[ktMenuTrigger]');
      trigger.click();
      f.detectChanges();

      const parentItem: HTMLElement = f.nativeElement.querySelector('[ktMenuItem]');
      const submenuSurface: HTMLElement = f.nativeElement.querySelector('#sub');

      const anchorName = parentItem.style.getPropertyValue('anchor-name');
      expect(anchorName).toMatch(/^--kt-submenu-anchor-\d+$/);
      expect(submenuSurface.style.getPropertyValue('position-anchor')).toBe(anchorName);
      expect(submenuSurface.getAttribute('data-kt-submenu')).toBe('');
    });
  });
});
