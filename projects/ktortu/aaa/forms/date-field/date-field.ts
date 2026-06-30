import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { KtBaseTemporalField } from '../base-temporal-field';
import { KtField } from '../field/field';
import { KtFieldControl } from '../field/field-control';
import { Temporal, type TemporalNamespace } from '../temporal/temporal';

/** Champ « date sans heure » : valeur = `Temporal.PlainDate`, input natif `type="date"`.
 *
 * @example
 * ```html
 * <kt-date-field label="Date de naissance" [(value)]="birthDate" />
 * ```
 */
@Component({
  selector: 'kt-date-field',
  imports: [KtField, KtFieldControl, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './date-field.html',
})
export class KtDateField
  extends KtBaseTemporalField<TemporalNamespace.PlainDate>
  implements FormValueControl<TemporalNamespace.PlainDate | null>
{
  /** Valeur du champ : un `Temporal.PlainDate` (date civile sans heure ni fuseau).
      `null` = champ vide.
      @default null */
  value = model<TemporalNamespace.PlainDate | null>(null);

  protected override fromString(raw: string): TemporalNamespace.PlainDate {
    return Temporal.PlainDate.from(raw);
  }

  protected override serialize(value: TemporalNamespace.PlainDate): string {
    return value.toString();
  }
}
