import { KtClock, KtFixedClock } from './clock';
import { Temporal } from './temporal';

describe('Clock', () => {
  it('reports a non-empty local time zone id', () => {
    expect(new KtClock().timeZoneId()).toBeTruthy();
  });

  it('reports the current instant', () => {
    expect(new KtClock().now()).toBeInstanceOf(Temporal.Instant);
  });

  describe('FixedClock', () => {
    const clock = new KtFixedClock(Temporal.Instant.from('2026-06-08T08:00:00Z'), 'Europe/Paris');

    it('freezes the time zone', () => {
      expect(clock.timeZoneId()).toBe('Europe/Paris');
    });

    it('freezes now()', () => {
      expect(clock.now().toString()).toBe('2026-06-08T08:00:00Z');
    });

    it('computes today() in the fixed zone (08:00Z is still the 8th in Paris)', () => {
      expect(clock.today().toString()).toBe('2026-06-08');
    });
  });
});
