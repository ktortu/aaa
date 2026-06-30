import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { KtBaseTimeTemporalField } from '../base-time-temporal-field';
import { KtField } from '../field/field';
import { KtFieldControl } from '../field/field-control';
import { Temporal, type TemporalNamespace } from '../temporal/temporal';

/** Champ « heure sans date » : valeur = `Temporal.PlainTime`, input natif `type="time"`.
 *
 * @example
 * ```html
 * <kt-time-field label="Heure de rendez-vous" [(value)]="appointmentTime" />
 * ```
 */
@Component({
  selector: 'kt-time-field',
  imports: [KtField, KtFieldControl, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './time-field.html',
})
export class KtTimeField
  extends KtBaseTimeTemporalField<TemporalNamespace.PlainTime>
  implements FormValueControl<TemporalNamespace.PlainTime | null>
{
  /** Valeur du champ : un `Temporal.PlainTime` (heure « au mur », sans date ni fuseau).
      `null` = champ vide.
      @default null */
  value = model<TemporalNamespace.PlainTime | null>(null);

  protected override fromString(raw: string): TemporalNamespace.PlainTime {
    return Temporal.PlainTime.from(raw);
  }

  protected override serialize(value: TemporalNamespace.PlainTime): string {
    // Précision pilotée par `precision()` : minute (défaut) ou seconde.
    return value.toString({ smallestUnit: this.precision() });
  }
}
