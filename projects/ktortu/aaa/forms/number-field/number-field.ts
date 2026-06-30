import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, model } from '@angular/core';
import { FormValueControl, transformedValue } from '@angular/forms/signals';
import { KtBaseInputField } from '../base-input/base-input';
import { KtField } from '../field/field';
import { KtFieldControl } from '../field/field-control';
import { type KtSuggestion, normalizeKtSuggestions } from '../datalist';
import { KtIdGenerator } from '@ktortu/aaa/cdk';

/**
 * Champ numérique : valeur `number | null` (champ vide ⇒ `null`, jamais `NaN`), intégré aux
 * Signal Forms via `FormValueControl`. Hérite de la présentation commune (label/hint/clear/
 * préfixe/suffixe/erreurs) de `KtBaseInputField`.
 *
 * @example
 * ```html
 * <kt-number-field label="Quantité" [(value)]="qty" [min]="0" [step]="1" />
 * ```
 */
@Component({
  selector: 'kt-number-field',
  imports: [KtField, KtFieldControl, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './number-field.html',
})
export class KtNumberField extends KtBaseInputField<number | null> implements FormValueControl<number | null> {
  /** Valeur saisie (two-way). `null` = champ vide. @default null */
  readonly value = model<number | null>(null);
  /** Borne minimale (attribut `min` natif). @default undefined */
  readonly min = input<number>();
  /** Borne maximale (attribut `max` natif). @default undefined */
  readonly max = input<number>();
  /** Pas d'incrément (attribut `step` natif). @default undefined */
  readonly step = input<number>();
  /** Suggestions d'autocomplétion proposées via un `<datalist>` natif (la saisie reste libre).
      Valeurs simples (`number[]`) ou couples `{ value, label }` pour distinguer libellé affiché et
      valeur insérée. @default undefined */
  readonly suggestions = input<readonly KtSuggestion<number>[]>();

  private readonly idGen = inject(KtIdGenerator);
  private readonly uid = this.idGen.generateId('number-field');
  protected readonly datalistId = `kt-number-field-list-${this.uid}`;
  protected readonly hasSuggestions = computed(() => (this.suggestions()?.length ?? 0) > 0);
  protected readonly datalistOptions = computed(() =>
    normalizeKtSuggestions(this.suggestions(), (value) => String(value)),
  );

  // Chemin de valeur unique : `parse()` (contrat de `KtBaseInputField`) est la SEULE source de
  // vérité du parsing numérique ; `transformedValue` ne fait que l'envelopper pour émettre une
  // erreur de validation Signal Forms sur une saisie non numérique (et formater pour l'affichage).
  protected readonly rawValue = transformedValue(this.value, {
    parse: (val: string) => {
      const trimmed = val.trim().replace(',', '.');
      if (trimmed !== '' && Number.isNaN(Number(trimmed))) {
        // Défaut anglais neutre ; surchargeable via KT_FIELD_CONFIG.numberParseError (cf. provideKtDefaultFR).
        return {
          error: { kind: 'parse', message: this.config?.numberParseError ?? 'Please enter a valid number.' },
        };
      }
      return { value: this.parse(val) };
    },
    format: (val) => (val === null ? '' : String(val)),
  });

  protected parse(raw: string): number | null {
    const trimmed = raw.trim().replace(',', '.');
    if (trimmed === '') return null;
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
  }

  protected override onKeyDown(event: KeyboardEvent): void {
    if (this.disabled() || this.readonly()) return;

    super.onKeyDown(event);
    if (event.defaultPrevented) return;

    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;

    const isUp = event.key === 'ArrowUp';
    this.adjustValue(isUp);
    event.preventDefault();
  }

  private adjustValue(isUp: boolean): void {
    const step = this.step() ?? 1;
    const min = this.min();
    const max = this.max();

    let newValue: number;

    if (this.value() === null) {
      if (min !== undefined) {
        newValue = min;
      } else if (max !== undefined) {
        newValue = max;
      } else {
        newValue = 0;
      }
    } else {
      const currentValue = this.value()!;
      newValue = isUp ? currentValue + step : currentValue - step;
    }

    if (min !== undefined && newValue < min) {
      newValue = min;
    }
    if (max !== undefined && newValue > max) {
      newValue = max;
    }

    // Arrondi pour éviter les erreurs de virgule flottante JS
    const stepStr = String(step);
    const decimalIdx = stepStr.indexOf('.');
    if (decimalIdx !== -1) {
      const precision = stepStr.length - decimalIdx - 1;
      newValue = Number(newValue.toFixed(precision));
    }

    this.value.set(newValue);
  }

  // `rawValue` est un `transformedValue` : on passe par son canal officiel (et non par
  // `nativeElement.value`) pour ne pas désynchroniser la représentation brute interne.
  override reset(): void {
    this.rawValue.set(this.value() === null ? '' : String(this.value()));
  }

  protected emptyValue(): number | null {
    return null;
  }

  protected isEmpty(value: number | null): boolean {
    return value === null;
  }
}
