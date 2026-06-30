import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Temporal, type TemporalNamespace } from '../temporal/temporal';
import { KtTimeField } from './time-field';

@Component({
  imports: [KtTimeField],
  template: `<kt-time-field
    [(value)]="value"
    [label]="label()"
    [clearable]="clearable()"
    [precision]="precision()"
    [disabled]="disabled()"
    [readonly]="readonly()"
    [pending]="pending()"
    [min]="min()"
    [max]="max()"
  />`,
})
class TimeFieldHost {
  value = signal<TemporalNamespace.PlainTime | null>(null);
  label = signal<string | undefined>('Heure');
  clearable = signal(false);
  precision = signal<'minute' | 'second'>('minute');
  disabled = signal(false);
  readonly = signal(false);
  pending = signal(false);
  min = signal<TemporalNamespace.PlainTime | undefined>(undefined);
  max = signal<TemporalNamespace.PlainTime | undefined>(undefined);
}

describe('TimeField', () => {
  let fixture: ComponentFixture<TimeFieldHost>;
  let host: TimeFieldHost;
  let el: HTMLElement;

  function setup(): void {
    TestBed.configureTestingModule({ imports: [TimeFieldHost] });
    fixture = TestBed.createComponent(TimeFieldHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  }

  function input(): HTMLInputElement {
    return el.querySelector('input')!;
  }

  beforeEach(() => setup());

  it('renders a time input', () => {
    expect(input().getAttribute('type')).toBe('time');
  });

  it('serializes to minute precision by default (drops seconds, no step)', () => {
    host.value.set(Temporal.PlainTime.from('18:30:45'));
    fixture.detectChanges();
    expect(input().value).toBe('18:30');
    expect(input().getAttribute('step')).toBeNull();
  });

  it('keeps seconds and sets step=1 when precision is "second"', () => {
    host.precision.set('second');
    host.value.set(Temporal.PlainTime.from('18:30:45'));
    fixture.detectChanges();
    expect(input().value).toBe('18:30:45');
    expect(input().getAttribute('step')).toBe('1');
  });

  it('parses the input into a PlainTime', () => {
    input().value = '18:30';
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.value()?.toString({ smallestUnit: 'minute' })).toBe('18:30');
  });

  it('sets the value to null when emptied', () => {
    host.value.set(Temporal.PlainTime.from('18:30'));
    fixture.detectChanges();
    input().value = '';
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.value()).toBeNull();
  });

  it('clears to null AND empties the native input when clearable', () => {
    host.clearable.set(true);
    host.value.set(Temporal.PlainTime.from('18:30'));
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

  it('clear redonne le focus à l’input natif', () => {
    host.clearable.set(true);
    host.value.set(Temporal.PlainTime.from('18:30'));
    fixture.detectChanges();
    clearButton()!.click();
    fixture.detectChanges();
    expect(document.activeElement).toBe(input());
  });

  it('disabled : input désactivé + bouton clear masqué', () => {
    host.clearable.set(true);
    host.value.set(Temporal.PlainTime.from('18:30'));
    host.disabled.set(true);
    fixture.detectChanges();
    expect(input().disabled).toBe(true);
    expect(clearButton()).toBeNull();
  });

  it('readonly : input en lecture seule + bouton clear masqué', () => {
    host.clearable.set(true);
    host.value.set(Temporal.PlainTime.from('18:30'));
    host.readonly.set(true);
    fixture.detectChanges();
    expect(input().readOnly).toBe(true);
    expect(clearButton()).toBeNull();
  });

  it('pending : aria-busy="true" sur l’input, absent sinon', () => {
    expect(input().hasAttribute('aria-busy')).toBe(false);
    host.pending.set(true);
    fixture.detectChanges();
    expect(input().getAttribute('aria-busy')).toBe('true');
  });

  it('bornes min/max sérialisées aux deux précisions', () => {
    host.min.set(Temporal.PlainTime.from('08:00'));
    host.max.set(Temporal.PlainTime.from('20:00'));
    fixture.detectChanges();
    expect(input().getAttribute('min')).toBe('08:00');
    expect(input().getAttribute('max')).toBe('20:00');

    host.precision.set('second');
    host.min.set(Temporal.PlainTime.from('08:00:30'));
    fixture.detectChanges();
    expect(input().getAttribute('min')).toBe('08:00:30');
  });

  it('parsing tolérant : heure invalide → null sans exception', () => {
    host.value.set(Temporal.PlainTime.from('18:30'));
    fixture.detectChanges();
    expect(() => {
      input().value = '99:99';
      input().dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }).not.toThrow();
    expect(host.value()).toBeNull();
  });

  it('Échap efface un champ clearable, n’efface pas sinon', () => {
    host.clearable.set(true);
    host.value.set(Temporal.PlainTime.from('18:30'));
    fixture.detectChanges();
    input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    fixture.detectChanges();
    expect(host.value()).toBeNull();

    host.value.set(Temporal.PlainTime.from('18:30'));
    host.clearable.set(false);
    fixture.detectChanges();
    input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    fixture.detectChanges();
    expect(host.value()?.toString({ smallestUnit: 'minute' })).toBe('18:30');
  });
});
