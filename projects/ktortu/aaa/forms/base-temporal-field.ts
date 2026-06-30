import { DOCUMENT } from '@angular/common';
import { Directive, computed, input, effect, inject } from '@angular/core';
import { KtBaseInputField } from './base-input/base-input';
import { type KtSuggestion, normalizeKtSuggestions } from './datalist';
import { KtIdGenerator } from '@ktortu/aaa/cdk';

/** Base partagée des champs Temporal (Date/Time/DateTime/YearMonth).
    Toute la logique commune (parsing tolérant, valeur vide `null`, synchronisation de l'input natif)
    vit ici ; chaque sous-classe ne fournit que la construction et la sérialisation propres
    à son type Temporal (`fromString` / `serialize`).

    Contrat abstrait : une sous-classe implémente uniquement le couple
    `fromString` (chaîne ISO de l'input natif → valeur typée `T`) et `serialize`
    (valeur `T` → chaîne ISO pour l'attribut `[value]` de l'input). La valeur exposée
    reste toujours `T | null`, où `null` représente le champ vide ; le parsing est
    tolérant (saisie partielle/invalide → `null`, jamais d'exception ni de valeur fausse).

    @template T Type Temporal porté par le champ (ex. `Temporal.PlainDate`,
    `Temporal.PlainTime`, …). Doit exposer `toString()`. La valeur du champ est `T | null`.

    @example
    ```ts
    // Sous-classer : ne fournir que fromString (input natif → T) et serialize (T → input natif).
    export class KtDateField extends KtBaseTemporalField<Temporal.PlainDate> {
      protected override fromString(raw: string): Temporal.PlainDate {
        return Temporal.PlainDate.from(raw);
      }
      protected override serialize(value: Temporal.PlainDate): string {
        return value.toString();
      }
    }
    ``` */
@Directive()
export abstract class KtBaseTemporalField<T extends { toString(): string }> extends KtBaseInputField<T | null> {
  private readonly doc = inject(DOCUMENT);

  constructor() {
    super();
    effect(() => {
      const val = this.value();
      const ref = this.inputRef();
      if (!ref) return;
      const inputEl = ref.nativeElement;
      const serialized = val === null ? '' : this.serialize(val);
      const isFocused = this.doc.activeElement === inputEl;
      if (inputEl.value !== serialized && (!isFocused || val !== null)) {
        inputEl.value = serialized;
      }
    });
  }

  /** Construit la valeur typée depuis la chaîne ISO de l'input natif (ex. `Temporal.PlainDate.from`). */
  protected abstract fromString(raw: string): T;
  /** Sérialise la valeur au format attendu par l'input natif (précision adaptée au type). */
  protected abstract serialize(value: T): string;

  protected override parse(raw: string): T | null {
    if (raw === '') return null;
    try {
      return this.fromString(raw);
    } catch {
      // Saisie partielle/invalide (RangeError) → vide, jamais une valeur fausse.
      return null;
    }
  }

  protected override displayValue(): string {
    const v = this.value();
    return v === null ? '' : this.serialize(v);
  }

  /** Efface AUSSI l'input natif. L'effet de synchro ignore une mise à `null` quand l'input est
      focalisé (pour ne pas écraser une saisie partielle en cours), or `clear()` focalise justement
      le champ — sans ce forçage, le bouton « effacer » (et Échap) resterait sans effet sur les
      champs temporels. */
  protected override clear(): void {
    super.clear();
    const el = this.inputRef()?.nativeElement;
    if (el) el.value = '';
  }

  protected override emptyValue(): T | null {
    return null;
  }

  protected override isEmpty(value: T | null): boolean {
    return value === null;
  }

  /** Borne minimale autorisée (membre `min` du contrat `FormValueControl`, aussi posé en attribut
      `min` natif via `serialize`). Non bornée par défaut. @default undefined */
  readonly min = input<T>();
  /** Borne maximale autorisée (membre `max` du contrat `FormValueControl`, aussi posé en attribut
      `max` natif via `serialize`). Non bornée par défaut. @default undefined */
  readonly max = input<T>();

  /** Représentation ISO de `min` pour l'attribut natif (`null` quand non borné). */
  protected readonly serializedMin = computed(() => {
    const value = this.min();
    return value == null ? null : this.serialize(value);
  });
  /** Représentation ISO de `max` pour l'attribut natif (`null` quand non borné). */
  protected readonly serializedMax = computed(() => {
    const value = this.max();
    return value == null ? null : this.serialize(value);
  });

  /** Suggestions proposées via un `<datalist>` natif (le picker date/heure reste disponible).
      Valeurs Temporal simples ou couples `{ value, label }` ; chaque valeur est sérialisée au
      format de l'input via `serialize`. @default undefined */
  readonly suggestions = input<readonly KtSuggestion<T>[]>();

  private readonly idGen = inject(KtIdGenerator);
  private readonly uid = this.idGen.generateId('temporal-field');
  protected readonly datalistId = `kt-temporal-field-list-${this.uid}`;
  protected readonly hasSuggestions = computed(() => (this.suggestions()?.length ?? 0) > 0);
  protected readonly datalistOptions = computed(() =>
    normalizeKtSuggestions(this.suggestions(), (value) => this.serialize(value)),
  );
}
