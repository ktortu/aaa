import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { KtBaseTimeTemporalField } from '../base-time-temporal-field';
import { KtField } from '../field/field';
import { KtFieldControl } from '../field/field-control';
import { Temporal, type TemporalNamespace } from '../temporal/temporal';

/** Champ « date-heure sans fuseau » : valeur = `Temporal.PlainDateTime`, input
    natif `type="datetime-local"`. Volontairement SANS timezone (heure « au mur »).
 *
 * @example
 * ```html
 * <kt-date-time-field label="Début de l'événement" [(value)]="startsAt" />
 * ```
 */
@Component({
  selector: 'kt-date-time-field',
  imports: [KtField, KtFieldControl, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './date-time-field.html',
})
export class KtDateTimeField
  extends KtBaseTimeTemporalField<TemporalNamespace.PlainDateTime>
  implements FormValueControl<TemporalNamespace.PlainDateTime | null>
{
  /** Valeur du champ : un `Temporal.PlainDateTime` (date + heure « au mur », sans fuseau).
      `null` = champ vide.
      @default null */
  value = model<TemporalNamespace.PlainDateTime | null>(null);

  protected override fromString(raw: string): TemporalNamespace.PlainDateTime {
    return Temporal.PlainDateTime.from(raw);
  }

  protected override serialize(value: TemporalNamespace.PlainDateTime): string {
    // Précision pilotée par `precision()` : minute (défaut) ou seconde.
    return value.toString({ smallestUnit: this.precision() });
  }
}
