import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ValidationError } from '@angular/forms/signals';
import { KtCheckbox } from './checkbox';
import { KtCheckboxGroup } from './checkbox-group';

interface Tag {
  id: number;
  label: string;
}

@Component({
  imports: [KtCheckboxGroup, KtCheckbox],
  template: `
    <kt-checkbox-group
      [(value)]="value"
      [label]="label()"
      [hint]="hint()"
      [ariaLabel]="ariaLabel()"
      [errors]="errors()"
      [invalid]="invalid()"
      [disabled]="disabled()"
      [required]="required()"
      [pending]="pending()"
      [showAllErrors]="showAllErrors()"
      [id]="id()"
    >
      <kt-checkbox optionValue="tech" label="Tech" [disabled]="techDisabled()" />
      <kt-checkbox optionValue="design" label="Design" [disabled]="designDisabled()" />
      <kt-checkbox optionValue="data" label="Data" />
    </kt-checkbox-group>
  `,
})
class GroupHost {
  value = signal<string[]>(['tech']);
  label = signal<string | undefined>('Centres');
  hint = signal<string | undefined>(undefined);
  ariaLabel = signal<string | undefined>(undefined);
  errors = signal<readonly ValidationError[]>([]);
  invalid = signal(false);
  disabled = signal(false);
  required = signal(false);
  designDisabled = signal(false);
  techDisabled = signal(false);
  pending = signal(false);
  showAllErrors = signal(false);
  id = signal<string | undefined>(undefined);
}

@Component({
  imports: [KtCheckboxGroup, KtCheckbox],
  template: `
    <kt-checkbox-group [(value)]="value" label="Tags" [compareWith]="sameId">
      @for (t of tags; track t.id) {
        <kt-checkbox [optionValue]="t" [label]="t.label" />
      }
    </kt-checkbox-group>
  `,
})
class ObjectGroupHost {
  tags: Tag[] = [
    { id: 1, label: 'A' },
    { id: 2, label: 'B' },
    { id: 3, label: 'C' },
  ];
  value = signal<Tag[]>([]);
  sameId = (a: Tag, b: Tag): boolean => a.id === b.id;
}

describe('CheckboxGroup', () => {
  function inputs(el: HTMLElement): HTMLInputElement[] {
    return Array.from(el.querySelectorAll('input[type="checkbox"]'));
  }

  describe('valeurs primitives', () => {
    let fixture: ComponentFixture<GroupHost>;
    let host: GroupHost;
    let el: HTMLElement;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [GroupHost] });
      fixture = TestBed.createComponent(GroupHost);
      host = fixture.componentInstance;
      el = fixture.nativeElement;
      fixture.detectChanges();
    });

    it('exposes a group role labelled by the legend', () => {
      const group = el.querySelector('[role="group"]')!;
      const legend = el.querySelector('.kt-checkbox-group__legend')!;
      expect(group.getAttribute('aria-labelledby')).toBe(legend.id);
      expect(legend.textContent).toContain('Centres');
    });

    it('checks the boxes whose option value is in the array', () => {
      const checked = inputs(el).map((i) => i.checked);
      expect(checked).toEqual([true, false, false]);
    });

    it('adds an option value on check', () => {
      inputs(el)[2].click(); // data
      fixture.detectChanges();
      expect(host.value()).toEqual(['tech', 'data']);
    });

    it('removes an option value on uncheck', () => {
      inputs(el)[0].click(); // tech off
      fixture.detectChanges();
      expect(host.value()).toEqual([]);
    });

    it('keeps every box independently tabbable (no roving, no shared name)', () => {
      expect(inputs(el).some((i) => i.hasAttribute('name'))).toBe(false);
      expect(inputs(el).every((i) => i.tabIndex >= 0 || i.tabIndex === 0 || !i.hasAttribute('tabindex'))).toBe(true);
    });

    it('disables every box when the group is disabled', () => {
      host.disabled.set(true);
      fixture.detectChanges();
      expect(inputs(el).every((i) => i.disabled)).toBe(true);

      inputs(el)[1].click();
      fixture.detectChanges();
      expect(host.value()).toEqual(['tech']);
    });

    it('disables only the targeted box when set per option', () => {
      host.designDisabled.set(true);
      fixture.detectChanges();
      expect(inputs(el).map((i) => i.disabled)).toEqual([false, true, false]);
    });

    it('focuses the first enabled checkbox via focus() (Signal Forms focusBoundControl)', () => {
      const group = fixture.debugElement.query((de) => de.componentInstance instanceof KtCheckboxGroup)
        .componentInstance as KtCheckboxGroup<string>;
      group.focus();
      expect(document.activeElement).toBe(inputs(el)[0]);
    });

    it('reflects the pending state via aria-busy and data-pending', () => {
      host.pending.set(true);
      fixture.detectChanges();
      const group = el.querySelector('[role="group"]')!;
      expect(group.getAttribute('aria-busy')).toBe('true');
      expect(group.getAttribute('data-pending')).toBe('');
    });

    it('shows group-level errors only after touched', () => {
      host.invalid.set(true);
      host.errors.set([{ kind: 'required', message: 'Choisissez au moins un centre' }]);
      fixture.detectChanges();
      expect(el.querySelector('.kt-checkbox-group__error-message')).toBeNull();

      inputs(el)[2].click();
      fixture.detectChanges();
      expect(el.querySelector('.kt-checkbox-group__error-message')?.textContent).toContain(
        'Choisissez au moins un centre',
      );
    });

    it('affiche le message par défaut quand le validateur ne fournit pas de message', () => {
      host.invalid.set(true);
      host.errors.set([{ kind: 'required' } as never]);
      inputs(el)[2].click();
      fixture.detectChanges();
      expect(el.querySelector('.kt-checkbox-group__error-message')?.textContent).toContain('This field is required.');
    });

    it("n'affiche aucun texte quand le message est explicitement vide, mais reste invalide", () => {
      host.invalid.set(true);
      host.errors.set([{ kind: 'required', message: '' }]);
      inputs(el)[2].click();
      fixture.detectChanges();
      expect(el.querySelector('.kt-checkbox-group__error-message')).toBeNull();
      expect(el.querySelector('[role="group"]')?.getAttribute('aria-invalid')).toBe('true');
    });

    function groupInstance(): KtCheckboxGroup<string> {
      return fixture.debugElement.query((de) => de.componentInstance instanceof KtCheckboxGroup)
        .componentInstance as KtCheckboxGroup<string>;
    }

    it('pose aria-required="true" sur le groupe et un astérisque aria-hidden dans la légende', () => {
      host.required.set(true);
      fixture.detectChanges();
      expect(el.querySelector('[role="group"]')!.getAttribute('aria-required')).toBe('true');
      const mark = el.querySelector('.kt-checkbox-group__required')!;
      expect(mark).toBeTruthy();
      expect(mark.getAttribute('aria-hidden')).toBe('true');
    });

    it('repli sur aria-label quand le label est absent (aria-labelledby retiré)', () => {
      host.label.set(undefined);
      host.ariaLabel.set('Centres d’intérêt');
      fixture.detectChanges();
      const group = el.querySelector('[role="group"]')!;
      expect(group.hasAttribute('aria-labelledby')).toBe(false);
      expect(group.getAttribute('aria-label')).toBe('Centres d’intérêt');
    });

    it('aria-describedby pointe vers le hint puis bascule vers l’erreur', () => {
      host.hint.set('Au moins un');
      fixture.detectChanges();
      const group = el.querySelector('[role="group"]')!;
      const id = group.querySelector('.kt-checkbox-group__hint')!.id;
      expect(group.getAttribute('aria-describedby')).toBe(id);

      host.invalid.set(true);
      host.errors.set([{ kind: 'required', message: 'Requis' }]);
      groupInstance().touched.set(true);
      fixture.detectChanges();
      const describedBy = group.getAttribute('aria-describedby') ?? '';
      expect(describedBy).toContain('-error');
      expect(describedBy).not.toContain('-hint');
    });

    it('la région d’erreur est une live region (aria-live="polite")', () => {
      const region = el.querySelector('.kt-checkbox-group__error')!;
      expect(region.getAttribute('aria-live')).toBe('polite');
    });

    it('focus() saute les cases désactivées et vise la première ACTIVABLE', () => {
      host.techDisabled.set(true);
      fixture.detectChanges();
      groupInstance().focus();
      expect(document.activeElement).toBe(inputs(el)[1]); // tech désactivée → design
    });

    it('showAllErrors : une seule erreur par défaut, toutes avec le flag', () => {
      host.invalid.set(true);
      host.errors.set([
        { kind: 'required', message: 'Requis' },
        { kind: 'custom', message: 'Autre' },
      ]);
      groupInstance().touched.set(true);
      fixture.detectChanges();
      expect(el.querySelectorAll('.kt-checkbox-group__error-message').length).toBe(1);

      host.showAllErrors.set(true);
      fixture.detectChanges();
      expect(el.querySelectorAll('.kt-checkbox-group__error-message').length).toBe(2);
    });

    it('toggle() est un no-op et ne marque PAS touched quand le groupe est désactivé', () => {
      host.disabled.set(true);
      fixture.detectChanges();
      const group = groupInstance();
      group.toggle('data', true);
      expect(host.value()).toEqual(['tech']);
      expect(group.touched()).toBe(false);
    });

    it('toggle() est idempotent (pas de doublon, décocher un absent ne fait rien)', () => {
      const group = groupInstance();
      group.toggle('tech', true); // déjà présent
      expect(host.value()).toEqual(['tech']);
      group.toggle('absent', false); // absent
      expect(host.value()).toEqual(['tech']);
    });

    it('tolère une value null (isSelected/toggle via ?? [])', () => {
      host.value.set(null as never);
      fixture.detectChanges();
      expect(inputs(el).every((i) => !i.checked)).toBe(true);
      groupInstance().toggle('data', true);
      expect(host.value()).toEqual(['data']);
    });

    it('un id imposé propage des ids déterministes', () => {
      host.id.set('centres');
      host.hint.set('Au moins un');
      fixture.detectChanges();
      const group = el.querySelector('[role="group"]')!;
      expect(group.querySelector('.kt-checkbox-group__legend')!.id).toBe('centres-label');
      expect(group.querySelector('.kt-checkbox-group__hint')!.id).toBe('centres-hint');
      expect(el.querySelector('.kt-checkbox-group__error')!.id).toBe('centres-error');
      expect(group.getAttribute('aria-labelledby')).toBe('centres-label');
    });

    it('le blur d’une case enfant marque le GROUPE touched (et révèle l’erreur)', () => {
      host.invalid.set(true);
      host.errors.set([{ kind: 'required', message: 'Requis' }]);
      fixture.detectChanges();
      expect(el.querySelector('.kt-checkbox-group__error-message')).toBeNull();

      inputs(el)[2].dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      expect(groupInstance().touched()).toBe(true);
      expect(el.querySelector('.kt-checkbox-group__error-message')?.textContent).toContain('Requis');
    });
  });

  describe('valeurs objet (compareWith)', () => {
    let fixture: ComponentFixture<ObjectGroupHost>;
    let host: ObjectGroupHost;
    let el: HTMLElement;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [ObjectGroupHost] });
      fixture = TestBed.createComponent(ObjectGroupHost);
      host = fixture.componentInstance;
      el = fixture.nativeElement;
      fixture.detectChanges();
    });

    it('checks boxes via compareWith on different object instances', () => {
      host.value.set([{ id: 2, label: 'B' }]);
      fixture.detectChanges();
      expect(inputs(el).map((i) => i.checked)).toEqual([false, true, false]);
    });

    it('accumulates whole objects on check', () => {
      inputs(el)[0].click();
      inputs(el)[2].click();
      fixture.detectChanges();
      expect(host.value()).toEqual([
        { id: 1, label: 'A' },
        { id: 3, label: 'C' },
      ]);
    });
  });
});
