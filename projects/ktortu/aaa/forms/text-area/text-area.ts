import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { KtBaseInputField } from '../base-input/base-input';
import { KtField } from '../field/field';
import { KtFieldControl } from '../field/field-control';

/**
 * Zone de texte multi-ligne (valeur `string`) intégrée aux Signal Forms via `FormValueControl`.
 * Autosize en CSS (`field-sizing: content`) ; hérite de la présentation commune de `KtBaseInputField`.
 *
 * @example
 * ```html
 * <kt-text-area label="Commentaire" [(value)]="comment" [rows]="4" />
 * ```
 */
@Component({
  selector: 'kt-text-area',
  imports: [KtField, KtFieldControl, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './text-area.html',
})
export class KtTextArea extends KtBaseInputField<string> implements FormValueControl<string> {
  /** Valeur saisie (two-way). @default '' */
  readonly value = model<string>('');
  /** Hauteur initiale (lignes). L'autosize est géré en CSS via `field-sizing: content`. @default 3 */
  readonly rows = input<number>(3);
  /** Plancher de caractères (attribut `minlength` natif ; poussé par le validateur minLength). @default undefined */
  readonly minLength = input<number>();
  /** Plafond de caractères ; poussé par le form (validateur maxLength) ou par le consommateur. @default undefined */
  readonly maxLength = input<number>();

  protected parse(raw: string): string {
    return raw;
  }

  protected emptyValue(): string {
    return '';
  }

  protected isEmpty(value: string): boolean {
    return value.length === 0;
  }
}
