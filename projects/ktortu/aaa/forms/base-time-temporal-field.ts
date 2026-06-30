import { Directive, computed, input } from '@angular/core';
import { KtBaseTemporalField } from './base-temporal-field';

/** Précision de saisie/sérialisation des champs Temporal porteurs d'une heure. */
export type KtTimePrecision = 'minute' | 'second';

/** Base des champs Temporal porteurs d'une heure (`Time`, `DateTime`, `Instant`). Ajoute le réglage
    `precision` qui pilote, d'un seul point, la sérialisation (`smallestUnit` du `toString`) et
    l'attribut `step` natif de l'input — un input `time`/`datetime-local` n'affiche le sélecteur de
    secondes que si `step` < 60. Les champs sans heure (`Date`, `YearMonth`) n'héritent pas de cette
    base. Chaque sous-classe lit `precision()` dans son `serialize`.

    @example
    ```ts
    // Sous-classer : lire precision() dans serialize pour piloter smallestUnit.
    export class KtTimeField extends KtBaseTimeTemporalField<Temporal.PlainTime> {
      protected override fromString(raw: string): Temporal.PlainTime {
        return Temporal.PlainTime.from(raw);
      }
      protected override serialize(value: Temporal.PlainTime): string {
        return value.toString({ smallestUnit: this.precision() });
      }
    }
    ``` */
@Directive()
export abstract class KtBaseTimeTemporalField<T extends { toString(): string }> extends KtBaseTemporalField<T> {
  /** Précision de l'heure : `'minute'` (secondes masquées) ou `'second'`.
      @default 'minute' */
  readonly precision = input<KtTimePrecision>('minute');

  /** Attribut `step` natif : `'1'` (seconde) en précision seconde, sinon `null` (pas natif = minute). */
  protected readonly step = computed<string | null>(() => (this.precision() === 'second' ? '1' : null));
}
