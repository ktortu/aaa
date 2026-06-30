import { Injectable } from '@angular/core';
import { Temporal, type TemporalNamespace } from './temporal';

/** Source unique de l'heure courante et du **fuseau local** de l'utilisateur.
    Injectable (et donc figeable en test) : `vi.useFakeTimers()` ne fige PAS `Temporal.Now`.
    Règle d'équipe : ne jamais appeler `Temporal.Now.*` en direct ailleurs — passer par `KtClock`. */
@Injectable({ providedIn: 'root' })
export class KtClock {
  /** Fuseau IANA local de l'utilisateur (auto-détecté), ex. `"Europe/Paris"`.
      Sert de zone de référence pour `today()` et pour les conversions UTC↔local.
      @returns L'identifiant de fuseau IANA. */
  timeZoneId(): string {
    return Temporal.Now.timeZoneId();
  }

  /** Instant absolu courant, sur la ligne du temps (UTC), indépendant du fuseau.
      @returns L'instant présent en `Temporal.Instant`. */
  now(): TemporalNamespace.Instant {
    return Temporal.Now.instant();
  }

  /** Date civile du jour telle qu'observée dans le fuseau local (`timeZoneId()`).
      @returns Le jour courant en `Temporal.PlainDate`. */
  today(): TemporalNamespace.PlainDate {
    return Temporal.Now.plainDateISO(this.timeZoneId());
  }
}

/** Horloge figée pour les tests : fige l'instant ET le fuseau (sinon un test passe en France mais
    échoue sur un runner CI en UTC). À fournir via `{ provide: KtClock, useValue: new KtFixedClock(...) }`. */
export class KtFixedClock extends KtClock {
  /** Construit une horloge figée déterministe pour les tests.
      @param fixedInstant Instant absolu (UTC) renvoyé tel quel par `now()` et utilisé comme base de `today()`.
      @param zone Fuseau IANA fixe (ex. `"Europe/Paris"`) renvoyé par `timeZoneId()`.
   *
   * @example
   * ```ts
   * TestBed.configureTestingModule({
   *   providers: [
   *     { provide: KtClock, useValue: new KtFixedClock(Temporal.Instant.from('2026-06-18T10:00:00Z'), 'Europe/Paris') },
   *   ],
   * });
   * ```
   */
  constructor(
    private readonly fixedInstant: TemporalNamespace.Instant,
    private readonly zone: string,
  ) {
    super();
  }

  override timeZoneId(): string {
    return this.zone;
  }

  override now(): TemporalNamespace.Instant {
    return this.fixedInstant;
  }

  override today(): TemporalNamespace.PlainDate {
    return this.fixedInstant.toZonedDateTimeISO(this.zone).toPlainDate();
  }
}
