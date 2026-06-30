import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ValidationError } from '@angular/forms/signals';
import { vi } from 'vitest';
import { KtFieldErrorMatcher } from '../field/field-config';
import { KtCheckbox } from './checkbox';
import { KT_AUDIT_ENABLED } from '@ktortu/aaa/cdk';

@Component({
  imports: [KtCheckbox],
  template: `
    <kt-checkbox
      [(value)]="value"
      [label]="label()"
      [hint]="hint()"
      [errors]="errors()"
      [invalid]="invalid()"
      [disabled]="disabled()"
      [required]="required()"
      [indeterminate]="indeterminate()"
      [errorMatcher]="errorMatcher()"
      [pending]="pending()"
      [name]="name()"
      [ariaLabel]="ariaLabel()"
      [showAllErrors]="showAllErrors()"
    />
  `,
})
class CheckboxHost {
  value = signal(false);
  label = signal<string | undefined>('Accepter les CGU');
  hint = signal<string | undefined>('Obligatoire');
  errors = signal<readonly ValidationError[]>([]);
  invalid = signal(false);
  disabled = signal(false);
  required = signal(false);
  indeterminate = signal(false);
  errorMatcher = signal<KtFieldErrorMatcher | undefined>(undefined);
  pending = signal(false);
  name = signal('');
  ariaLabel = signal<string | undefined>(undefined);
  showAllErrors = signal(false);
}

describe('Checkbox', () => {
  let fixture: ComponentFixture<CheckboxHost>;
  let host: CheckboxHost;
  let el: HTMLElement;

  function setup(): void {
    TestBed.configureTestingModule({ imports: [CheckboxHost] });
    fixture = TestBed.createComponent(CheckboxHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  }

  function input(): HTMLInputElement {
    return el.querySelector('input[type="checkbox"]')!;
  }

  function labelElement(): HTMLLabelElement | null {
    return el.querySelector('label.kt-checkbox');
  }

  function errorContainer(): HTMLElement | null {
    return el.querySelector('.kt-checkbox-error-message');
  }

  function hintElement(): HTMLElement | null {
    return el.querySelector('.kt-checkbox-hint');
  }

  beforeEach(() => setup());

  afterEach(() => {
    fixture?.destroy();
  });

  it('renders a native checkbox input and its label', () => {
    expect(input()).toBeTruthy();
    expect(input().type).toBe('checkbox');
    expect(input().checked).toBe(false);
    expect(labelElement()?.textContent).toContain('Accepter les CGU');
  });

  it('reflects the bound value into the checked property', () => {
    host.value.set(true);
    fixture.detectChanges();
    expect(input().checked).toBe(true);
  });

  it('updates the bound value on change', () => {
    input().click();
    fixture.detectChanges();
    expect(host.value()).toBe(true);
    expect(input().checked).toBe(true);
  });

  it('updates the bound value on label click', () => {
    labelElement()!.click();
    fixture.detectChanges();
    expect(host.value()).toBe(true);
  });

  it('reflects the indeterminate property on the native input', () => {
    host.indeterminate.set(true);
    fixture.detectChanges();
    expect(input().indeterminate).toBe(true);

    host.indeterminate.set(false);
    fixture.detectChanges();
    expect(input().indeterminate).toBe(false);
  });

  it('does not update when disabled', () => {
    host.disabled.set(true);
    fixture.detectChanges();
    expect(input().disabled).toBe(true);

    labelElement()!.click();
    fixture.detectChanges();
    expect(host.value()).toBe(false);
  });

  it('renders a required marker when required input is true', () => {
    host.required.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.kt-checkbox__required')).toBeTruthy();
    expect(input().getAttribute('aria-required')).toBe('true');
  });

  it('renders a hint when provided', () => {
    expect(hintElement()?.textContent).toContain('Obligatoire');
  });

  it('focuses the native checkbox via focus() (Signal Forms focusBoundControl)', () => {
    const cb = fixture.debugElement.query((de) => de.componentInstance instanceof KtCheckbox)
      .componentInstance as KtCheckbox;
    cb.focus();
    expect(document.activeElement).toBe(input());
  });

  it('reflects the pending state via aria-busy and data-pending', () => {
    host.pending.set(true);
    fixture.detectChanges();
    expect(input().getAttribute('aria-busy')).toBe('true');
    expect(el.querySelector('.kt-checkbox-field')?.getAttribute('data-pending')).toBe('');
  });

  it('does not mark invalid or show errors before the control is touched', () => {
    host.invalid.set(true);
    host.errors.set([{ kind: 'required', message: 'Vous devez accepter les CGU' }]);
    fixture.detectChanges();

    expect(input().getAttribute('aria-invalid')).not.toBe('true');
    expect(errorContainer()).toBeNull();
    expect(hintElement()).toBeTruthy();
  });

  it('marks invalid and shows errors after interaction (touched)', () => {
    host.invalid.set(true);
    host.errors.set([{ kind: 'required', message: 'Vous devez accepter les CGU' }]);

    input().click();
    fixture.detectChanges();

    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(errorContainer()?.textContent).toContain('Vous devez accepter les CGU');
    expect(hintElement()).toBeNull();
  });

  it('shows errors immediately with a custom errorMatcher', () => {
    host.errorMatcher.set((s) => s.invalid);
    host.invalid.set(true);
    host.errors.set([{ kind: 'required', message: 'Vous devez accepter les CGU' }]);
    fixture.detectChanges();

    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(errorContainer()?.textContent).toContain('Vous devez accepter les CGU');
  });

  it('aria-describedby pointe vers le hint quand un hint est fourni (sans erreur)', () => {
    const id = input().id;
    expect(input().getAttribute('aria-describedby')).toBe(`${id}-hint`);
  });

  it('aria-describedby bascule du hint vers l’erreur quand l’erreur s’affiche', () => {
    host.errorMatcher.set((s) => s.invalid);
    host.invalid.set(true);
    host.errors.set([{ kind: 'required', message: 'Requis' }]);
    fixture.detectChanges();
    const id = input().id;
    const describedBy = input().getAttribute('aria-describedby') ?? '';
    expect(describedBy).toContain(`${id}-error`);
    expect(describedBy).not.toContain(`${id}-hint`);
  });

  it('pose aria-label sur l’input quand ariaLabel est fourni', () => {
    host.ariaLabel.set('Accepter les conditions');
    fixture.detectChanges();
    expect(input().getAttribute('aria-label')).toBe('Accepter les conditions');
  });

  it('le marqueur requis est aria-hidden="true" (décoratif)', () => {
    host.required.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.kt-checkbox__required')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('la région d’erreur est une live region (aria-live="polite"), présente même sans erreur', () => {
    const region = el.querySelector('.kt-checkbox-error')!;
    expect(region).toBeTruthy();
    expect(region.getAttribute('aria-live')).toBe('polite');
    expect(errorContainer()).toBeNull();
  });

  it('onBlur marque touched et révèle l’erreur (chemin distinct du change)', () => {
    host.invalid.set(true);
    host.errors.set([{ kind: 'required', message: 'Requis' }]);
    fixture.detectChanges();
    expect(input().getAttribute('aria-invalid')).not.toBe('true');

    input().dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(errorContainer()?.textContent).toContain('Requis');
  });

  it('reflète name positivement et l’omet quand vide', () => {
    expect(input().hasAttribute('name')).toBe(false);
    host.name.set('cgu');
    fixture.detectChanges();
    expect(input().getAttribute('name')).toBe('cgu');
  });

  it('résout le message d’erreur par défaut (kind sans message) et écarte la suppression message:""', () => {
    host.errorMatcher.set((s) => s.invalid);
    host.invalid.set(true);
    host.errors.set([{ kind: 'required' }]); // sans message → message EN par défaut
    fixture.detectChanges();
    expect(errorContainer()?.textContent).toContain('This field is required.');

    host.errors.set([{ kind: 'required', message: '' }]); // suppression explicite
    fixture.detectChanges();
    expect(errorContainer()).toBeNull();
  });

  it('showAllErrors affiche toutes les erreurs au lieu de la première', () => {
    host.errorMatcher.set((s) => s.invalid);
    host.invalid.set(true);
    host.errors.set([
      { kind: 'required', message: 'Requis' },
      { kind: 'custom', message: 'Autre' },
    ]);
    fixture.detectChanges();
    expect(el.querySelectorAll('.kt-checkbox-error-message').length).toBe(1);

    host.showAllErrors.set(true);
    fixture.detectChanges();
    expect(el.querySelectorAll('.kt-checkbox-error-message').length).toBe(2);
  });
});

describe('Checkbox — garde-fou a11y dev (nom accessible)', () => {
  it('avertit quand la case n’a ni label, ni ariaLabel, ni contenu projeté', async () => {
    vi.useFakeTimers();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    @Component({ imports: [KtCheckbox], template: `<kt-checkbox />` })
    class BareCheckbox {}
    TestBed.configureTestingModule({
      imports: [BareCheckbox],
      providers: [{ provide: KT_AUDIT_ENABLED, useValue: true }],
    });
    const f = TestBed.createComponent(BareCheckbox);
    f.detectChanges();
    await f.whenStable();
    vi.runAllTimers();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('sans nom accessible'));
    f.destroy();
    TestBed.resetTestingModule();
  });

  it('n’avertit pas quand un label est présent', async () => {
    vi.useFakeTimers();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    @Component({ imports: [KtCheckbox], template: `<kt-checkbox label="Accepter" />` })
    class NamedCheckbox {}
    TestBed.configureTestingModule({
      imports: [NamedCheckbox],
      providers: [{ provide: KT_AUDIT_ENABLED, useValue: true }],
    });
    const f = TestBed.createComponent(NamedCheckbox);
    f.detectChanges();
    await f.whenStable();
    vi.runAllTimers();
    expect(warn).not.toHaveBeenCalled();
    f.destroy();
    TestBed.resetTestingModule();
  });
});
