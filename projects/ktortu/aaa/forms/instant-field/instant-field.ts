import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, model } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { KtBaseTimeTemporalField } from '../base-time-temporal-field';
import { KtField } from '../field/field';
import { KtFieldControl } from '../field/field-control';
import { KtClock } from '../temporal/clock';
import { Temporal, type TemporalNamespace } from '../temporal/temporal';

/** Champ « instant absolu » : valeur = `Temporal.Instant` (UTC), saisi et affiché en **heure
    locale** via un input `type="datetime-local"`. Conçu pour le flux serveur-UTC → affichage/édition
    locale → renvoi UTC. Le fuseau local vient du service `KtClock` (injecté → testable).

    Conversion UTC↔heure locale : à l'affichage, l'`Instant` UTC est projeté dans le fuseau
    local (`KtClock.timeZoneId()`) pour produire l'heure « au mur » montrée à l'utilisateur ; à la
    saisie, cette heure locale est réinterprétée dans le même fuseau puis reconvertie en `Instant`
    UTC. Fournir un `KtClock` figé en test garantit une conversion déterministe.
 *
 * @example
 * ```html
 * <kt-instant-field label="Horodatage" [(value)]="recordedAt" />
 * ```
 */
@Component({
  selector: 'kt-instant-field',
  imports: [KtField, KtFieldControl, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './instant-field.html',
})
export class KtInstantField
  extends KtBaseTimeTemporalField<TemporalNamespace.Instant>
  implements FormValueControl<TemporalNamespace.Instant | null>
{
  private readonly clock = inject(KtClock);

  /** Valeur du champ : un `Temporal.Instant` (instant absolu en UTC), saisi/affiché en heure
      locale via `KtClock`. `null` = champ vide.
      @default null */
  value = model<TemporalNamespace.Instant | null>(null);

  // Heure locale saisie (wall-clock) → instant absolu. Disambiguation 'compatible' par défaut
  // (ne lève pas sur un créneau DST ambigu).
  protected override fromString(raw: string): TemporalNamespace.Instant {
    return Temporal.PlainDateTime.from(raw).toZonedDateTime(this.clock.timeZoneId()).toInstant();
  }

  // Instant absolu → heure locale ; précision pilotée par `precision()` (minute par défaut).
  protected override serialize(value: TemporalNamespace.Instant): string {
    return value
      .toZonedDateTimeISO(this.clock.timeZoneId())
      .toPlainDateTime()
      .toString({ smallestUnit: this.precision() });
  }
}
