import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ValidationError } from '@angular/forms/signals';
import { Temporal, type TemporalNamespace } from '../temporal/temporal';
import { KtYearMonthField } from './year-month-field';

@Component({
  imports: [KtYearMonthField],
  template: `<kt-year-month-field
    [(value)]="value"
    [label]="label()"
    [clearable]="clearable()"
    [disabled]="disabled()"
    [readonly]="readonly()"
    [required]="required()"
    [invalid]="invalid()"
    [errors]="errors()"
    [pending]="pending()"
    [min]="min()"
    [max]="max()"
  />`,
})
class YearMonthFieldHost {
  value = signal<TemporalNamespace.PlainYearMonth | null>(null);
  label = signal<string | undefined>('Expiration');
  clearable = signal(false);
  disabled = signal(false);
  readonly = signal(false);
  required = signal(false);
  invalid = signal(false);
  errors = signal<readonly ValidationError[]>([]);
  pending = signal(false);
  min = signal<TemporalNamespace.PlainYearMonth | undefined>(undefined);
  max = signal<TemporalNamespace.PlainYearMonth | undefined>(undefined);
}

describe('YearMonthField', () => {
  let fixture: ComponentFixture<YearMonthFieldHost>;
  let host: YearMonthFieldHost;
  let el: HTMLElement;

  function setup(): void {
    TestBed.configureTestingModule({ imports: [YearMonthFieldHost] });
    fixture = TestBed.createComponent(YearMonthFieldHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  }

  function input(): HTMLInputElement {
    return el.querySelector('input')!;
  }

  beforeEach(() => setup());

  it('renders a month input', () => {
    expect(input().getAttribute('type')).toBe('month');
  });

  it('reflects a PlainYearMonth into the input', () => {
    host.value.set(Temporal.PlainYearMonth.from('2026-09'));
    fixture.detectChanges();
    expect(input().value).toBe('2026-09');
  });

  it('parses the input into a PlainYearMonth', () => {
    input().value = '2026-09';
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.value()?.toString()).toBe('2026-09');
  });

  it('sets the value to null when emptied', () => {
    host.value.set(Temporal.PlainYearMonth.from('2026-09'));
    fixture.detectChanges();
    input().value = '';
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.value()).toBeNull();
  });

  it('clears to null AND empties the native input when clearable', () => {
    host.clearable.set(true);
    host.value.set(Temporal.PlainYearMonth.from('2026-09'));
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

  it('required → aria-required ; invalide+blur → aria-invalid + erreur', () => {
    host.required.set(true);
    fixture.detectChanges();
    expect(input().getAttribute('aria-required')).toBe('true');

    host.invalid.set(true);
    host.errors.set([{ kind: 'required', message: 'Requis' }]);
    input().dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(el.querySelector('.kt-field__error')?.textContent).toContain('Requis');
  });

  it('disabled : input désactivé + data-disabled + clear masqué', () => {
    host.clearable.set(true);
    host.value.set(Temporal.PlainYearMonth.from('2026-09'));
    host.disabled.set(true);
    fixture.detectChanges();
    expect(input().disabled).toBe(true);
    expect(el.querySelector('.kt-field-box')!.getAttribute('data-disabled')).toBe('');
    expect(clearButton()).toBeNull();
  });

  it('readonly : input en lecture seule + clear masqué', () => {
    host.clearable.set(true);
    host.value.set(Temporal.PlainYearMonth.from('2026-09'));
    host.readonly.set(true);
    fixture.detectChanges();
    expect(input().readOnly).toBe(true);
    expect(clearButton()).toBeNull();
  });

  it('bouton clear : aria-label "Clear", icône aria-hidden, et refocus de l’input', () => {
    host.clearable.set(true);
    host.value.set(Temporal.PlainYearMonth.from('2026-09'));
    fixture.detectChanges();
    const btn = clearButton()!;
    expect(btn.getAttribute('aria-label')).toBe('Clear');
    expect(btn.querySelector('.kt-field-box__icon')!.getAttribute('aria-hidden')).toBe('true');
    btn.click();
    fixture.detectChanges();
    expect(document.activeElement).toBe(input());
  });

  it('pending : aria-busy + data-pending', () => {
    host.pending.set(true);
    fixture.detectChanges();
    expect(input().getAttribute('aria-busy')).toBe('true');
    expect(el.querySelector('.kt-field-box')!.getAttribute('data-pending')).toBe('');
  });

  it('parsing tolérant : "2026-13"/"abc"/"2026" → null sans exception', () => {
    for (const bad of ['2026-13', 'abc', '2026']) {
      expect(() => {
        input().value = bad;
        input().dispatchEvent(new Event('input'));
        fixture.detectChanges();
      }).not.toThrow();
      expect(host.value()).toBeNull();
    }
  });

  it('Échap efface (preventDefault) et vide l’input natif', () => {
    host.clearable.set(true);
    host.value.set(Temporal.PlainYearMonth.from('2026-09'));
    fixture.detectChanges();
    const ev = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    input().dispatchEvent(ev);
    fixture.detectChanges();
    expect(host.value()).toBeNull();
    expect(input().value).toBe('');
    expect(ev.defaultPrevented).toBe(true);
  });

  it('garde anti-écrasement : input focalisé + value→null préserve le DOM', () => {
    host.value.set(Temporal.PlainYearMonth.from('2026-09'));
    fixture.detectChanges();
    input().focus();
    host.value.set(null);
    fixture.detectChanges();
    expect(input().value).toBe('2026-09');
  });

  it('bornes min/max sérialisées "YYYY-MM" ; absentes sinon', () => {
    expect(input().hasAttribute('min')).toBe(false);
    host.min.set(Temporal.PlainYearMonth.from('2026-01'));
    host.max.set(Temporal.PlainYearMonth.from('2026-12'));
    fixture.detectChanges();
    expect(input().getAttribute('min')).toBe('2026-01');
    expect(input().getAttribute('max')).toBe('2026-12');
  });

  it('le blur marque touched (déclencheur d’erreur)', () => {
    const field = fixture.debugElement.query((de) => de.componentInstance instanceof KtYearMonthField)
      .componentInstance as KtYearMonthField;
    expect(field.touched()).toBe(false);
    input().dispatchEvent(new Event('blur'));
    expect(field.touched()).toBe(true);
  });

  it('showClear : bouton absent quand vide', () => {
    host.clearable.set(true);
    fixture.detectChanges();
    expect(clearButton()).toBeNull(); // vide → pas de bouton
  });
});
