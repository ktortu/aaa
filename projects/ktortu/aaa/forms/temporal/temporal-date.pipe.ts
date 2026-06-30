import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';
import { KtClock } from './clock';
import { Temporal, type TemporalNamespace } from './temporal';

/** Valeurs Temporal formatables pour l'affichage (toutes exposent `toLocaleString`). */
type FormattableTemporal =
  | TemporalNamespace.PlainDate
  | TemporalNamespace.PlainTime
  | TemporalNamespace.PlainDateTime
  | TemporalNamespace.PlainYearMonth
  | TemporalNamespace.Instant
  | TemporalNamespace.ZonedDateTime;

/** Formate une valeur Temporal pour l'affichage selon la locale active.
    `DatePipe` n'accepte pas Temporal (seulement `Date|string|number`) → pipe dédié, basé sur
    `toLocaleString` (interface `Intl.DateTimeFormat`). Cohérent avec la neutralité i18n de la lib
    (format au runtime via `LOCALE_ID`, pas `$localize`).

    Un `Instant` n'a pas de fuseau propre → il est affiché dans la **zone locale** (via `KtClock`).
    Un `ZonedDateTime` est affiché dans **sa propre** zone. Les `Plain*` n'ont pas de fuseau.
 *
 * @example
 * ```html
 * <!-- format par défaut de la locale active -->
 * {{ d | temporalDate }}
 * <!-- options Intl.DateTimeFormat -->
 * {{ d | temporalDate:{ month: 'long' } }}
 * {{ d | temporalDate:{ dateStyle: 'full' } }}
 * ```
 */
// Exception R1 ASSUMÉE : le name `temporalDate` (non préfixé `kt`) relève du domaine Temporal,
// exempté de préfixe au même titre que le namespace `Temporal` et ses alias de types. La CLASSE
// reste préfixée (`KtTemporalDatePipe`). Choix ergonomique acté (ADR-4).
// Stryker disable next-line all: le `name` du pipe doit rester statiquement analysable par l'AOT (NG1010).
@Pipe({ name: 'temporalDate' })
export class KtTemporalDatePipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);
  private readonly clock = inject(KtClock);

  /** Formate la valeur Temporal en chaîne localisée via `toLocaleString`.
   * @param value Valeur Temporal à formater (`Plain*`, `Instant` ou `ZonedDateTime`) ; `null`/`undefined` → chaîne vide.
   * @param options Options `Intl.DateTimeFormatOptions` transmises telles quelles. Styles globaux :
   *   `dateStyle`/`timeStyle` (`'full' | 'long' | 'medium' | 'short'`). Champs fins :
   *   `weekday`/`era`/`month` (`'long' | 'short' | 'narrow'`), `year`/`day`/`hour`/`minute`/`second`
   *   (`'numeric' | '2-digit'`), `hour12`, `timeZoneName`, `timeZone`, etc. Omis → format par défaut de la locale.
   * @returns La chaîne formatée selon la locale active (`LOCALE_ID`), ou `''` si la valeur est absente. */
  transform(value: FormattableTemporal | null | undefined, options?: Intl.DateTimeFormatOptions): string {
    if (value == null) return '';
    if (value instanceof Temporal.Instant) {
      return value.toZonedDateTimeISO(this.clock.timeZoneId()).toLocaleString(this.locale, options);
    }
    return value.toLocaleString(this.locale, options);
  }
}
