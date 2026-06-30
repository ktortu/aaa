import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { type KtSuggestion } from '../datalist';
import { KtClock, KtFixedClock } from '../temporal/clock';
import { Temporal, type TemporalNamespace } from '../temporal/temporal';
import { KtInstantField } from './instant-field';

@Component({
  imports: [KtInstantField],
  template: `<kt-instant-field
    [(value)]="value"
    [label]="label()"
    [clearable]="clearable()"
    [precision]="precision()"
    [disabled]="disabled()"
    [readonly]="readonly()"
    [pending]="pending()"
    [min]="min()"
    [max]="max()"
    [suggestions]="suggestions()"
  />`,
})
class InstantFieldHost {
  value = signal<TemporalNamespace.Instant | null>(null);
  label = signal<string | undefined>('Horodatage');
  clearable = signal(false);
  precision = signal<'minute' | 'second'>('minute');
  disabled = signal(false);
  readonly = signal(false);
  pending = signal(false);
  min = signal<TemporalNamespace.Instant | undefined>(undefined);
  max = signal<TemporalNamespace.Instant | undefined>(undefined);
  suggestions = signal<readonly KtSuggestion<TemporalNamespace.Instant>[] | undefined>(undefined);
}

describe('InstantField', () => {
  let fixture: ComponentFixture<InstantFieldHost>;
  let host: InstantFieldHost;
  let el: HTMLElement;

  function setup(): void {
    // Fuseau figé Europe/Paris (= UTC+2 en juin, DST) → conversions déterministes sur tout runner.
    const parisClock = new KtFixedClock(Temporal.Instant.from('2026-06-08T08:00:00Z'), 'Europe/Paris');
    TestBed.configureTestingModule({
      imports: [InstantFieldHost],
      providers: [{ provide: KtClock, useValue: parisClock }],
    });
    fixture = TestBed.createComponent(InstantFieldHost);
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

  it('displays a UTC instant in the local time zone', () => {
    host.value.set(Temporal.Instant.from('2026-06-08T08:00:00Z'));
    fixture.detectChanges();
    expect(input().value).toBe('2026-06-08T10:00'); // 08:00Z → 10:00 Paris
  });

  it('displays seconds and sets step=1 when precision is "second"', () => {
    host.precision.set('second');
    host.value.set(Temporal.Instant.from('2026-06-08T08:00:45Z'));
    fixture.detectChanges();
    // 08:00:45Z → 10:00:45 Paris. (happy-dom suffixe `.000` aux datetime-local ; un vrai
    // navigateur rend `2026-06-08T10:00:45` — d'où le `toContain`.)
    expect(input().value).toContain('2026-06-08T10:00:45');
    expect(input().getAttribute('step')).toBe('1');
  });

  it('parses local wall time with seconds back into a UTC instant', () => {
    host.precision.set('second');
    fixture.detectChanges();
    input().value = '2026-06-08T10:00:45';
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.value()?.toString()).toBe('2026-06-08T08:00:45Z');
  });

  it('parses local wall time back into a UTC instant', () => {
    input().value = '2026-06-08T10:00';
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.value()?.toString()).toBe('2026-06-08T08:00:00Z');
  });

  it('sets the value to null when emptied', () => {
    host.value.set(Temporal.Instant.from('2026-06-08T08:00:00Z'));
    fixture.detectChanges();
    input().value = '';
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.value()).toBeNull();
  });

  it('clears to null AND empties the native input when clearable', () => {
    host.clearable.set(true);
    host.value.set(Temporal.Instant.from('2026-06-08T08:00:00Z'));
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

  it('pending : aria-busy sur l’input + data-pending sur la field-box', () => {
    expect(input().hasAttribute('aria-busy')).toBe(false);
    host.pending.set(true);
    fixture.detectChanges();
    expect(input().getAttribute('aria-busy')).toBe('true');
    expect(el.querySelector('.kt-field-box')!.getAttribute('data-pending')).toBe('');
  });

  it('bornes min/max sérialisées en heure LOCALE (UTC→Paris)', () => {
    host.min.set(Temporal.Instant.from('2026-06-08T06:00:00Z')); // → 08:00 Paris
    host.max.set(Temporal.Instant.from('2026-06-08T16:00:00Z')); // → 18:00 Paris
    fixture.detectChanges();
    expect(input().getAttribute('min')).toBe('2026-06-08T08:00');
    expect(input().getAttribute('max')).toBe('2026-06-08T18:00');
  });

  it('datalist : options sérialisées en heure locale', () => {
    expect(input().hasAttribute('list')).toBe(false);
    host.suggestions.set([Temporal.Instant.from('2026-06-08T07:00:00Z')]); // → 09:00 Paris
    fixture.detectChanges();
    const listId = input().getAttribute('list')!;
    expect(el.querySelector(`#${listId} option`)!.getAttribute('value')).toBe('2026-06-08T09:00');
  });

  it('le bouton effacer N’apparaît PAS quand vide, disabled ou readonly', () => {
    expect(clearButton()).toBeNull(); // vide
    host.clearable.set(true);
    host.value.set(Temporal.Instant.from('2026-06-08T08:00:00Z'));
    host.disabled.set(true);
    fixture.detectChanges();
    expect(clearButton()).toBeNull(); // disabled
    host.disabled.set(false);
    host.readonly.set(true);
    fixture.detectChanges();
    expect(clearButton()).toBeNull(); // readonly
  });
});
