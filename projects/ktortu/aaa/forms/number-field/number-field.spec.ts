import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ValidationError } from '@angular/forms/signals';
import { KtFieldErrorMatcher } from '../field/field-config';
import { type KtSuggestion } from '../datalist';
import { KtNumberField } from './number-field';

@Component({
  imports: [KtNumberField],
  template: `
    <kt-number-field
      [(value)]="value"
      [label]="label()"
      [hint]="hint()"
      [errors]="errors()"
      [invalid]="invalid()"
      [required]="required()"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [clearable]="clearable()"
      [min]="min()"
      [max]="max()"
      [step]="step()"
      [name]="name()"
      [autocomplete]="autocomplete()"
      [suggestions]="suggestions()"
      [errorMatcher]="errorMatcher()"
      [pending]="pending()"
    />
  `,
})
class NumberFieldHost {
  value = signal<number | null>(null);
  label = signal<string | undefined>('Âge');
  hint = signal<string | undefined>(undefined);
  errors = signal<readonly ValidationError[]>([]);
  invalid = signal(false);
  required = signal(false);
  disabled = signal(false);
  readonly = signal(false);
  clearable = signal(false);
  min = signal<number | undefined>(undefined);
  max = signal<number | undefined>(undefined);
  step = signal<number | undefined>(undefined);
  name = signal('');
  autocomplete = signal<AutoFill | undefined>(undefined);
  suggestions = signal<readonly KtSuggestion<number>[] | undefined>(undefined);
  errorMatcher = signal<KtFieldErrorMatcher | undefined>(undefined);
  pending = signal(false);
}

describe('NumberField', () => {
  let fixture: ComponentFixture<NumberFieldHost>;
  let host: NumberFieldHost;
  let el: HTMLElement;

  function setup(): void {
    TestBed.configureTestingModule({ imports: [NumberFieldHost] });
    fixture = TestBed.createComponent(NumberFieldHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  }

  function input(): HTMLInputElement {
    return el.querySelector('input')!;
  }

  function clearButton(): HTMLButtonElement | null {
    return el.querySelector('.kt-field-box__clear');
  }

  beforeEach(() => setup());

  it('renders a decimal input', () => {
    expect(input().getAttribute('type')).toBe('text');
    expect(input().getAttribute('inputmode')).toBe('decimal');
  });

  it('shows an empty input for a null value', () => {
    expect(input().value).toBe('');
  });

  it('reflects a numeric value into the input', () => {
    host.value.set(42);
    fixture.detectChanges();
    expect(input().value).toBe('42');
  });

  it('parses the input into a number', () => {
    input().value = '42';
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.value()).toBe(42);
  });

  it('sets the value to null when emptied', () => {
    host.value.set(42);
    fixture.detectChanges();
    input().value = '';
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.value()).toBeNull();
  });

  it('reflects the pending state via aria-busy and data-pending', () => {
    host.pending.set(true);
    fixture.detectChanges();
    expect(input().getAttribute('aria-busy')).toBe('true');
    expect(el.querySelector('.kt-field-box')?.getAttribute('data-pending')).toBe('');
  });

  it('reset() clears the stale raw text left by an invalid entry', () => {
    const field = fixture.debugElement.query(By.directive(KtNumberField)).componentInstance as KtNumberField;
    input().value = 'abc';
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.value()).toBeNull();
    expect(input().value).toBe('abc'); // texte brut résiduel non parsable

    field.reset();
    fixture.detectChanges();
    expect(input().value).toBe('');
  });

  it('treats 0 as a real value, not empty', () => {
    host.clearable.set(true);
    host.value.set(0);
    fixture.detectChanges();
    expect(input().value).toBe('0');
    expect(clearButton()).toBeTruthy();
  });

  it('clears to null and refocuses the input', () => {
    host.clearable.set(true);
    host.value.set(5);
    fixture.detectChanges();
    clearButton()!.click();
    fixture.detectChanges();
    expect(host.value()).toBeNull();
    expect(document.activeElement).toBe(input());
  });

  it('applies the min attribute to the native input', () => {
    host.min.set(18);
    fixture.detectChanges();
    expect(input().getAttribute('min')).toBe('18');
  });

  it('reports a parse error and preserves raw input when typing non-numeric values', () => {
    const ipt = input();
    ipt.value = 'abc';
    ipt.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.value()).toBeNull();
    expect(ipt.value).toBe('abc');
    const component = fixture.debugElement.query(By.directive(KtNumberField)).componentInstance as unknown as {
      rawValue: { parseErrors: () => { kind: string; message: string }[] };
    };
    expect(component.rawValue.parseErrors()).toEqual([{ kind: 'parse', message: 'Please enter a valid number.' }]);
  });

  it('allows typing negative and decimal numbers without wiping partial inputs', () => {
    const ipt = input();
    ipt.value = '-';
    ipt.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.value()).toBeNull();
    expect(ipt.value).toBe('-');

    ipt.value = '-5';
    ipt.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.value()).toBe(-5);
    expect(ipt.value).toBe('-5');
  });

  it('parses both commas and dots as decimal separators', () => {
    const ipt = input();
    ipt.value = '12.5';
    ipt.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.value()).toBe(12.5);

    ipt.value = '12,5';
    ipt.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.value()).toBe(12.5);
  });

  it('increments and decrements the value on ArrowUp/ArrowDown key presses', () => {
    const ipt = input();

    ipt.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    fixture.detectChanges();
    expect(host.value()).toBe(0);

    ipt.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    fixture.detectChanges();
    expect(host.value()).toBe(1);

    ipt.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();
    expect(host.value()).toBe(0);
  });

  it('respects min, max boundaries and step sizes on arrow keys', () => {
    const ipt = input();
    host.min.set(5);
    fixture.detectChanges();

    ipt.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    fixture.detectChanges();
    expect(host.value()).toBe(5);

    ipt.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();
    expect(host.value()).toBe(5);
  });

  function field(): KtNumberField {
    return fixture.debugElement.query(By.directive(KtNumberField)).componentInstance as KtNumberField;
  }

  it('expose role="spinbutton" et reflète aria-valuemin/max/now + max natif', () => {
    expect(input().getAttribute('role')).toBe('spinbutton');
    host.min.set(0);
    host.max.set(100);
    host.value.set(42);
    fixture.detectChanges();
    expect(input().getAttribute('aria-valuemin')).toBe('0');
    expect(input().getAttribute('aria-valuemax')).toBe('100');
    expect(input().getAttribute('aria-valuenow')).toBe('42');
    expect(input().getAttribute('max')).toBe('100');
  });

  it('disabled : input désactivé + data-disabled, flèches inertes', () => {
    host.value.set(5);
    host.disabled.set(true);
    fixture.detectChanges();
    expect(input().disabled).toBe(true);
    expect(el.querySelector('.kt-field-box')!.getAttribute('data-disabled')).toBe('');
    input().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    fixture.detectChanges();
    expect(host.value()).toBe(5); // inerte
  });

  it('readonly : input en lecture seule, clear masqué, flèches inertes', () => {
    host.clearable.set(true);
    host.value.set(5);
    host.readonly.set(true);
    fixture.detectChanges();
    expect(input().readOnly).toBe(true);
    expect(clearButton()).toBeNull();
    input().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    fixture.detectChanges();
    expect(host.value()).toBe(5);
  });

  it('required : aria-required="true"', () => {
    host.required.set(true);
    fixture.detectChanges();
    expect(input().getAttribute('aria-required')).toBe('true');
  });

  it('erreur via matcher : aria-invalid + data-invalid + describedby DOM', () => {
    host.errorMatcher.set((s) => s.invalid);
    host.invalid.set(true);
    host.errors.set([{ kind: 'min', message: 'Trop petit' }]);
    fixture.detectChanges();
    const id = input().id;
    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(el.querySelector('.kt-field-box')!.getAttribute('data-invalid')).toBe('');
    expect(input().getAttribute('aria-describedby')).toContain(`${id}-error`);
  });

  it('pas décimal : arrondi anti-flottant (step 0.1 : 0.2 → 0.3)', () => {
    host.value.set(0.2);
    host.step.set(0.1);
    fixture.detectChanges();
    input().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    fixture.detectChanges();
    expect(host.value()).toBe(0.3);
  });

  it('datalist : list lié + options quand suggestions, absent sinon', () => {
    expect(input().hasAttribute('list')).toBe(false);
    host.suggestions.set([10, { value: 20, label: 'Vingt' }]);
    fixture.detectChanges();
    const listId = input().getAttribute('list')!;
    const datalist = el.querySelector(`#${listId}`)!;
    expect(datalist.tagName.toLowerCase()).toBe('datalist');
    expect(datalist.querySelectorAll('option').length).toBe(2);
  });

  it('Échap efface quand clearable et non vide (super.onKeyDown)', () => {
    host.clearable.set(true);
    host.value.set(7);
    fixture.detectChanges();
    const ev = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    input().dispatchEvent(ev);
    fixture.detectChanges();
    expect(host.value()).toBeNull();
    expect(ev.defaultPrevented).toBe(true);
  });

  it('seed sur null avec max (sans min) : ArrowUp part de max', () => {
    host.max.set(10);
    fixture.detectChanges();
    input().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    fixture.detectChanges();
    expect(host.value()).toBe(10);
  });

  it('plafonnement à max sur incrément', () => {
    host.max.set(10);
    host.value.set(9);
    fixture.detectChanges();
    input().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    fixture.detectChanges();
    expect(host.value()).toBe(10);
    input().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    fixture.detectChanges();
    expect(host.value()).toBe(10); // ne dépasse pas
  });

  it('reset() ré-aligne le texte brut sur une valeur NON nulle (String(value))', () => {
    input().value = '007'; // brut '007' → valeur 7, mais le texte affiché reste '007'
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.value()).toBe(7);
    expect(input().value).toBe('007');

    field().reset();
    fixture.detectChanges();
    expect(input().value).toBe('7'); // re-synchronisé sur String(7)
  });

  it('name et autocomplete posés si non vides', () => {
    expect(input().hasAttribute('name')).toBe(false);
    host.name.set('age');
    host.autocomplete.set('off');
    fixture.detectChanges();
    expect(input().getAttribute('name')).toBe('age');
    expect(input().getAttribute('autocomplete')).toBe('off');
  });
});
