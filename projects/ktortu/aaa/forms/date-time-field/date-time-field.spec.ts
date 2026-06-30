import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ValidationError } from '@angular/forms/signals';
import { type KtSuggestion } from '../datalist';
import { type KtTimePrecision } from '../base-time-temporal-field';
import { Temporal, type TemporalNamespace } from '../temporal/temporal';
import { KtDateTimeField } from './date-time-field';

@Component({
  imports: [KtDateTimeField],
  template: `<kt-date-time-field
    [(value)]="value"
    [label]="label()"
    [clearable]="clearable()"
    [disabled]="disabled()"
    [readonly]="readonly()"
    [required]="required()"
    [invalid]="invalid()"
    [errors]="errors()"
    [pending]="pending()"
    [precision]="precision()"
    [min]="min()"
    [max]="max()"
    [name]="name()"
    [suggestions]="suggestions()"
  />`,
})
class DateTimeFieldHost {
  value = signal<TemporalNamespace.PlainDateTime | null>(null);
  label = signal<string | undefined>('Rendez-vous');
  clearable = signal(false);
  disabled = signal(false);
  readonly = signal(false);
  required = signal(false);
  invalid = signal(false);
  errors = signal<readonly ValidationError[]>([]);
  pending = signal(false);
  precision = signal<KtTimePrecision>('minute');
  min = signal<TemporalNamespace.PlainDateTime | undefined>(undefined);
  max = signal<TemporalNamespace.PlainDateTime | undefined>(undefined);
  name = signal('');
  suggestions = signal<readonly KtSuggestion<TemporalNamespace.PlainDateTime>[] | undefined>(undefined);
}

describe('DateTimeField', () => {
  let fixture: ComponentFixture<DateTimeFieldHost>;
  let host: DateTimeFieldHost;
  let el: HTMLElement;

  function setup(): void {
    TestBed.configureTestingModule({ imports: [DateTimeFieldHost] });
    fixture = TestBed.createComponent(DateTimeFieldHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  }

  function input(): HTMLInputElement {
    return el.querySelector('input')!;
  }

  beforeEach(() => setup());

  it('renders a datetime-local input', () => {
    expect(input().getAttribute('type')).toBe('datetime-local');
  });

  it('serializes to minute precision (drops seconds)', () => {
    host.value.set(Temporal.PlainDateTime.from('2026-06-08T14:00:30'));
    fixture.detectChanges();
    expect(input().value).toBe('2026-06-08T14:00');
  });

  it('parses the input into a PlainDateTime', () => {
    input().value = '2026-06-08T14:00';
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.value()?.toString({ smallestUnit: 'minute' })).toBe('2026-06-08T14:00');
  });

  it('sets the value to null when emptied', () => {
    host.value.set(Temporal.PlainDateTime.from('2026-06-08T14:00'));
    fixture.detectChanges();
    input().value = '';
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.value()).toBeNull();
  });

  it('clears to null AND empties the native input when clearable', () => {
    host.clearable.set(true);
    host.value.set(Temporal.PlainDateTime.from('2026-06-08T14:00'));
    fixture.detectChanges();
    const clearBtn = el.querySelector<HTMLButtonElement>('.kt-field-box__clear');
    expect(clearBtn).toBeTruthy();
    clearBtn!.click();
    fixture.detectChanges();
    expect(host.value()).toBeNull();
    expect(input().value).toBe(''); // régression : l'input natif doit aussi être vidé
  });

  function clearButton(): HTMLButtonElement | null {
    return el.querySelector('.kt-field-box__clear');
  }

  it('associe le label à l’input via for/id', () => {
    const id = input().id;
    expect(id).toBeTruthy();
    expect(el.querySelector('label')!.getAttribute('for')).toBe(id);
  });

  it('required → aria-required="true"', () => {
    host.required.set(true);
    fixture.detectChanges();
    expect(input().getAttribute('aria-required')).toBe('true');
  });

  it('invalide + touché → aria-invalid + message d’erreur', () => {
    host.invalid.set(true);
    host.errors.set([{ kind: 'required', message: 'Requis' }]);
    input().dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(el.querySelector('.kt-field__error')?.textContent).toContain('Requis');
  });

  it('disabled : input natif + data-disabled + croix masquée', () => {
    host.clearable.set(true);
    host.value.set(Temporal.PlainDateTime.from('2026-06-08T14:00'));
    host.disabled.set(true);
    fixture.detectChanges();
    expect(input().disabled).toBe(true);
    expect(el.querySelector('.kt-field-box')!.getAttribute('data-disabled')).toBe('');
    expect(clearButton()).toBeNull();
  });

  it('readonly : input en lecture seule + croix masquée', () => {
    host.clearable.set(true);
    host.value.set(Temporal.PlainDateTime.from('2026-06-08T14:00'));
    host.readonly.set(true);
    fixture.detectChanges();
    expect(input().readOnly).toBe(true);
    expect(clearButton()).toBeNull();
  });

  it('clear redonne le focus à l’input et le bouton porte aria-label "Clear"', () => {
    host.clearable.set(true);
    host.value.set(Temporal.PlainDateTime.from('2026-06-08T14:00'));
    fixture.detectChanges();
    expect(clearButton()!.getAttribute('aria-label')).toBe('Clear');
    clearButton()!.click();
    fixture.detectChanges();
    expect(document.activeElement).toBe(input());
  });

  it('pending : aria-busy + data-pending ; absent sinon', () => {
    expect(input().hasAttribute('aria-busy')).toBe(false);
    host.pending.set(true);
    fixture.detectChanges();
    expect(input().getAttribute('aria-busy')).toBe('true');
    expect(el.querySelector('.kt-field-box')!.getAttribute('data-pending')).toBe('');
  });

  it('precision "second" : sérialise à la seconde et pose step="1"', () => {
    host.precision.set('second');
    host.value.set(Temporal.PlainDateTime.from('2026-06-08T14:00:30'));
    fixture.detectChanges();
    // jsdom normalise datetime-local (peut ajouter .000) → on vérifie la précision seconde.
    expect(input().value).toMatch(/^2026-06-08T14:00:30/);
    expect(input().getAttribute('step')).toBe('1');
  });

  it('precision par défaut (minute) : attribut step ABSENT', () => {
    expect(input().hasAttribute('step')).toBe(false);
  });

  it('bornes min/max sérialisées en attributs natifs ; absentes sinon', () => {
    expect(input().hasAttribute('min')).toBe(false);
    host.min.set(Temporal.PlainDateTime.from('2026-01-01T08:00'));
    host.max.set(Temporal.PlainDateTime.from('2026-12-31T18:00'));
    fixture.detectChanges();
    expect(input().getAttribute('min')).toBe('2026-01-01T08:00');
    expect(input().getAttribute('max')).toBe('2026-12-31T18:00');
  });

  it('parsing tolérant : saisie invalide → null sans exception', () => {
    host.value.set(Temporal.PlainDateTime.from('2026-06-08T14:00'));
    fixture.detectChanges();
    expect(() => {
      input().value = 'pas une date';
      input().dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }).not.toThrow();
    expect(host.value()).toBeNull();
  });

  it('Échap efface (clearable), no-op sinon', () => {
    host.clearable.set(true);
    host.value.set(Temporal.PlainDateTime.from('2026-06-08T14:00'));
    fixture.detectChanges();
    const ev = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    input().dispatchEvent(ev);
    fixture.detectChanges();
    expect(host.value()).toBeNull();
    expect(ev.defaultPrevented).toBe(true);

    host.value.set(Temporal.PlainDateTime.from('2026-06-08T14:00'));
    host.clearable.set(false);
    fixture.detectChanges();
    const ev2 = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    input().dispatchEvent(ev2);
    expect(ev2.defaultPrevented).toBe(false);
  });

  it('datalist : list lié + options sérialisées datetime-local', () => {
    expect(input().hasAttribute('list')).toBe(false);
    host.suggestions.set([Temporal.PlainDateTime.from('2026-01-01T09:00')]);
    fixture.detectChanges();
    const listId = input().getAttribute('list')!;
    const opt = el.querySelector(`#${listId} option`)!;
    expect(opt.getAttribute('value')).toBe('2026-01-01T09:00');
  });

  it('garde anti-écrasement : input focalisé + value→null préserve le DOM', () => {
    host.value.set(Temporal.PlainDateTime.from('2026-06-08T14:00'));
    fixture.detectChanges();
    input().focus();
    host.value.set(null);
    fixture.detectChanges();
    expect(input().value).toBe('2026-06-08T14:00');
  });

  it('attribut name reflété si fourni, absent sinon', () => {
    expect(input().hasAttribute('name')).toBe(false);
    host.name.set('rdv');
    fixture.detectChanges();
    expect(input().getAttribute('name')).toBe('rdv');
  });
});
