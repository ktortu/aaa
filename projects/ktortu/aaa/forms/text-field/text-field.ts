import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, model } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { KtBaseInputField } from '../base-input/base-input';
import { KtField } from '../field/field';
import { KtFieldControl } from '../field/field-control';
import { type KtSuggestion, normalizeKtSuggestions } from '../datalist';
import { KtIdGenerator } from '@ktortu/aaa/cdk';

/** Types texte dont la valeur reste une string (number/date = composants séparés). */
export type KtTextFieldType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';

/**
 * Champ texte (valeur `string`) intégré aux Signal Forms via `FormValueControl`. Hérite de la
 * présentation commune (label/hint/clear/préfixe/suffixe/erreurs) de `KtBaseInputField`.
 *
 * @example
 * ```html
 * <kt-text-field label="E-mail" type="email" [(value)]="email" required />
 * ```
 */
@Component({
  selector: 'kt-text-field',
  imports: [KtField, KtFieldControl, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './text-field.html',
})
export class KtTextField extends KtBaseInputField<string> implements FormValueControl<string> {
  /** Valeur saisie (two-way). @default '' */
  readonly value = model<string>('');
  /** Variante HTML du champ (pilote `type` natif et le clavier mobile). @default 'text' */
  readonly type = input<KtTextFieldType>('text');
  /** Plancher de caractères (attribut `minlength` natif ; poussé par le validateur minLength). @default undefined */
  readonly minLength = input<number>();
  /** Plafond de caractères (attribut `maxlength` natif ; poussé par le validateur maxLength). @default undefined */
  readonly maxLength = input<number>();
  /** Motifs de validation (contrat Signal Forms). L'attribut natif `pattern` ne prend qu'une regex →
      seule la première est posée. @default [] */
  readonly pattern = input<readonly RegExp[]>([]);
  /** Source de la première regex pour l'attribut `pattern` natif (`null` si aucune). */
  protected readonly patternAttr = computed(() => this.pattern()[0]?.source ?? null);
  /** Suggestions d'autocomplétion proposées via un `<datalist>` natif (la saisie reste libre).
      Valeurs simples (`string[]`) ou couples `{ value, label }` pour distinguer libellé affiché et
      valeur insérée. @default undefined */
  readonly suggestions = input<readonly KtSuggestion<string>[]>();

  private readonly idGen = inject(KtIdGenerator);
  private readonly uid = this.idGen.generateId('text-field');
  protected readonly datalistId = `kt-text-field-list-${this.uid}`;
  protected readonly hasSuggestions = computed(() => (this.suggestions()?.length ?? 0) > 0);
  protected readonly datalistOptions = computed(() => normalizeKtSuggestions(this.suggestions(), (value) => value));

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
