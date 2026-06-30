import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KtClock, KtFixedClock } from './clock';
import { Temporal } from './temporal';
import { KtTemporalDatePipe } from './temporal-date.pipe';

describe('TemporalDatePipe', () => {
  function pipeWith(locale: string, clock?: KtClock): KtTemporalDatePipe {
    TestBed.configureTestingModule({
      providers: [
        KtTemporalDatePipe,
        { provide: LOCALE_ID, useValue: locale },
        ...(clock ? [{ provide: KtClock, useValue: clock }] : []),
      ],
    });
    return TestBed.inject(KtTemporalDatePipe);
  }

  it('returns an empty string for null/undefined', () => {
    const pipe = pipeWith('en-US');
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('formats a PlainDate according to the active locale', () => {
    const pipe = pipeWith('en-US');
    expect(pipe.transform(Temporal.PlainDate.from('2026-06-08'), { month: 'long' })).toBe('June');
  });

  it('honours a different locale', () => {
    const pipe = pipeWith('fr-FR');
    expect(pipe.transform(Temporal.PlainDate.from('2026-06-08'), { month: 'long' })).toBe('juin');
  });

  it('renders an Instant in the local time zone', () => {
    const paris = new KtFixedClock(Temporal.Instant.from('2026-06-08T08:00:00Z'), 'Europe/Paris');
    const pipe = pipeWith('fr-FR', paris);
    const out = pipe.transform(Temporal.Instant.from('2026-06-08T08:00:00Z'), {
      hour: '2-digit',
      minute: '2-digit',
    });
    expect(out).toContain('10'); // 08:00Z → 10:00 Paris
    expect(out).not.toContain('08');
  });

  it('uses the CLOCK time zone for an Instant, not the system zone (deterministic)', () => {
    const instant = Temporal.Instant.from('2026-06-08T08:00:00Z');
    const opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
    const render = (zone: string): string => {
      TestBed.resetTestingModule();
      return pipeWith('fr-FR', new KtFixedClock(instant, zone)).transform(instant, opts);
    };
    // Deux horloges de zones distinctes DOIVENT produire des heures différentes : preuve que la
    // conversion passe par l'horloge (et non par la zone système, qui rendrait les deux identiques).
    expect(render('Europe/Paris')).not.toBe(render('Asia/Tokyo'));
  });

  it('renders a ZonedDateTime in its own zone (ignores the local clock)', () => {
    const paris = new KtFixedClock(Temporal.Instant.from('2026-06-08T08:00:00Z'), 'Europe/Paris');
    const pipe = pipeWith('fr-FR', paris);
    const tokyo = Temporal.Instant.from('2026-06-08T08:00:00Z').toZonedDateTimeISO('Asia/Tokyo');
    const out = pipe.transform(tokyo, { hour: '2-digit', minute: '2-digit' });
    expect(out).toContain('17'); // 08:00Z → 17:00 Tokyo (UTC+9)
  });
});
