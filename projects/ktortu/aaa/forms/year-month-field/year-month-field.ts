import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { KtBaseTemporalField } from '../base-temporal-field';
import { KtField } from '../field/field';
import { KtFieldControl } from '../field/field-control';
import { Temporal, type TemporalNamespace } from '../temporal/temporal';

/** Champ « mois/année » (ex. expiration de carte) : valeur = `Temporal.PlainYearMonth`,
    input natif `type="month"`.
 *
 * @example
 * ```html
 * <kt-year-month-field label="Expiration" [(value)]="cardExpiry" />
 * ```
 */
@Component({
  selector: 'kt-year-month-field',
  imports: [KtField, KtFieldControl, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './year-month-field.html',
})
export class KtYearMonthField
  extends KtBaseTemporalField<TemporalNamespace.PlainYearMonth>
  implements FormValueControl<TemporalNamespace.PlainYearMonth | null>
{
  /** Valeur du champ : un `Temporal.PlainYearMonth` (mois + année, sans jour ni fuseau).
      `null` = champ vide.
      @default null */
  value = model<TemporalNamespace.PlainYearMonth | null>(null);

  protected override fromString(raw: string): TemporalNamespace.PlainYearMonth {
    return Temporal.PlainYearMonth.from(raw);
  }

  protected override serialize(value: TemporalNamespace.PlainYearMonth): string {
    return value.toString();
  }
}
