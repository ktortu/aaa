import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ValidationError } from '@angular/forms/signals';
import { type KtSuggestion } from '../datalist';
import { Temporal, type TemporalNamespace } from '../temporal/temporal';
import { KtDateField } from './date-field';

@Component({
  imports: [KtDateField],
  template: `<kt-date-field
    [(value)]="value"
    [label]="label()"
    [clearable]="clearable()"
    [min]="min()"
    [max]="max()"
    [disabled]="disabled()"
    [readonly]="readonly()"
    [required]="required()"
    [invalid]="invalid()"
    [errors]="errors()"
    [pending]="pending()"
    [name]="name()"
    [suggestions]="suggestions()"
  />`,
})
class DateFieldHost {
  value = signal<TemporalNamespace.PlainDate | null>(null);
  label = signal<string | undefined>('Date de naissance');
  clearable = signal(false);
  min = signal<TemporalNamespace.PlainDate | undefined>(undefined);
  max = signal<TemporalNamespace.PlainDate | undefined>(undefined);
  disabled = signal(false);
  readonly = signal(false);
  required = signal(false);
  invalid = signal(false);
  errors = signal<readonly ValidationError[]>([]);
  pending = signal(false);
  name = signal('');
  suggestions = signal<readonly KtSuggestion<TemporalNamespace.PlainDate>[] | undefined>(undefined);
}

describe('DateField', () => {
  let fixture: ComponentFixture<DateFieldHost>;
  let host: DateFieldHost;
  let el: HTMLElement;

  function setup(): void {
    TestBed.configureTestingModule({ imports: [DateFieldHost] });
    fixture = TestBed.createComponent(DateFieldHost);
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

  it('renders a date input', () => {
    expect(input().getAttribute('type')).toBe('date');
  });

  it('shows an empty input for a null value', () => {
    expect(input().value).toBe('');
  });

  it('reflects a PlainDate into the input as ISO', () => {
    host.value.set(Temporal.PlainDate.from('2026-06-08'));
    fixture.detectChanges();
    expect(input().value).toBe('2026-06-08');
  });

  it('parses the input into a PlainDate', () => {
    input().value = '2026-06-08';
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.value()?.toString()).toBe('2026-06-08');
  });

  it('sets the value to null when emptied', () => {
    host.value.set(Temporal.PlainDate.from('2026-06-08'));
    fixture.detectChanges();
    input().value = '';
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.value()).toBeNull();
  });

  it('clears to null and refocuses the input', () => {
    host.clearable.set(true);
    host.value.set(Temporal.PlainDate.from('2026-06-08'));
    fixture.detectChanges();
    expect(clearButton()).toBeTruthy();
    clearButton()!.click();
    fixture.detectChanges();
    expect(host.value()).toBeNull();
    expect(input().value).toBe(''); // l'input natif doit aussi être vidé (régression : l'était pas)
    expect(document.activeElement).toBe(input());
  });

  it('serializes min/max bounds onto the native input attributes', () => {
    expect(input().getAttribute('min')).toBeNull();
    expect(input().getAttribute('max')).toBeNull();
    host.min.set(Temporal.PlainDate.from('2026-01-01'));
    host.max.set(Temporal.PlainDate.from('2026-12-31'));
    fixture.detectChanges();
    expect(input().getAttribute('min')).toBe('2026-01-01');
    expect(input().getAttribute('max')).toBe('2026-12-31');
  });

  it('reset() re-syncs the native input to the serialized value', () => {
    const field = fixture.debugElement.query((de) => de.componentInstance instanceof KtDateField)
      .componentInstance as KtDateField;
    host.value.set(Temporal.PlainDate.from('2026-06-08'));
    fixture.detectChanges();
    input().value = ''; // désync : champ vidé en DOM, le modèle conserve la date
    field.reset();
    expect(input().value).toBe('2026-06-08');
  });

  it('falls back to null on invalid date inputs', () => {
    host.value.set(Temporal.PlainDate.from('2026-06-08'));
    fixture.detectChanges();
    input().value = 'invalid-date';
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.value()).toBeNull();
  });

  it('clears the field and refocuses the input when pressing Escape on a clearable field', () => {
    host.clearable.set(true);
    host.value.set(Temporal.PlainDate.from('2026-06-08'));
    fixture.detectChanges();

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    input().dispatchEvent(escapeEvent);
    fixture.detectChanges();

    expect(host.value()).toBeNull();
    expect(input().value).toBe(''); // l'input natif doit aussi être vidé
    expect(document.activeElement).toBe(input());
  });

  it('does not clear on Escape if field is not clearable', () => {
    host.clearable.set(false);
    host.value.set(Temporal.PlainDate.from('2026-06-08'));
    fixture.detectChanges();

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    input().dispatchEvent(escapeEvent);
    fixture.detectChanges();

    expect(host.value()?.toString()).toBe('2026-06-08');
  });

  it('blur marque touched et déclenche l’affichage de l’erreur', () => {
    host.invalid.set(true);
    host.errors.set([{ kind: 'required', message: 'Requise' }]);
    fixture.detectChanges();
    expect(input().getAttribute('aria-invalid')).not.toBe('true');

    input().dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(el.querySelector('.kt-field__error')?.textContent).toContain('Requise');
  });

  it('pending : aria-busy sur l’input + data-pending sur la field-box', () => {
    expect(input().hasAttribute('aria-busy')).toBe(false);
    host.pending.set(true);
    fixture.detectChanges();
    expect(input().getAttribute('aria-busy')).toBe('true');
    expect(el.querySelector('.kt-field-box')!.getAttribute('data-pending')).toBe('');
  });

  it('le bouton effacer est masqué quand disabled ou readonly (même clearable + valeur)', () => {
    host.clearable.set(true);
    host.value.set(Temporal.PlainDate.from('2026-06-08'));
    host.disabled.set(true);
    fixture.detectChanges();
    expect(clearButton()).toBeNull();
    expect(input().disabled).toBe(true);

    host.disabled.set(false);
    host.readonly.set(true);
    fixture.detectChanges();
    expect(clearButton()).toBeNull();
    expect(input().readOnly).toBe(true);
  });

  it('garde anti-écrasement : input focalisé + value→null ne réécrit pas l’input', () => {
    host.value.set(Temporal.PlainDate.from('2026-06-08'));
    fixture.detectChanges();
    input().focus();
    expect(document.activeElement).toBe(input());

    host.value.set(null); // mise à null SANS clear, alors que l'input est focalisé
    fixture.detectChanges();
    expect(input().value).toBe('2026-06-08'); // saisie partielle préservée
  });

  it('attribut name reflété si fourni, absent sinon', () => {
    expect(input().hasAttribute('name')).toBe(false);
    host.name.set('naissance');
    fixture.detectChanges();
    expect(input().getAttribute('name')).toBe('naissance');
  });

  it('datalist : list lié + options ISO quand suggestions, absent sinon', () => {
    expect(input().hasAttribute('list')).toBe(false);
    host.suggestions.set([Temporal.PlainDate.from('2026-01-01'), Temporal.PlainDate.from('2026-12-25')]);
    fixture.detectChanges();
    const listId = input().getAttribute('list')!;
    const datalist = el.querySelector(`#${listId}`)!;
    expect(datalist.tagName.toLowerCase()).toBe('datalist');
    const opts = Array.from(datalist.querySelectorAll('option')).map((o) => o.getAttribute('value'));
    expect(opts).toEqual(['2026-01-01', '2026-12-25']);
  });
});
