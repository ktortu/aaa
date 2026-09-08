import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
} from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import type { ValidationError, WithOptionalFieldTree } from '@angular/forms/signals';
import { KT_FIELD_CONFIG, type KtFieldErrorMatcher, defaultKtFieldErrorMatcher } from '../field/field-config';
import { KtFieldErrorResolver } from '../field/error-messages';
import { KtIdGenerator } from '@ktortu/aaa/cdk';

/**
 * Groupe de cases à cocher (Checkbox Group) conforme à l'ARIA APG / RGAA.
 * Orchestrateur : porte une valeur TABLEAU (`FormValueControl<V[]>`) et la sémantique de groupe
 * (`role="group"`, légende, `aria-required`/`aria-invalid`, erreurs).
 *
 * Différence APG avec le radio-group : PAS de roving tabindex — chaque `kt-checkbox` reste
 * tabbable et coche/décoche indépendamment. Les options sont fournies par le dev (boucle `@for`
 * ou en dur) ; `compareWith` gère l'égalité quand les valeurs d'option sont des objets.
 *
 * @example
 * ```html
 * <kt-checkbox-group label="Centres d'intérêt" [(value)]="interests" required>
 *   <kt-checkbox [optionValue]="'sport'" label="Sport" />
 *   <kt-checkbox [optionValue]="'musique'" label="Musique" />
 *   <kt-checkbox [optionValue]="'cinema'" label="Cinéma" />
 * </kt-checkbox-group>
 * ```
 */
@Component({
  selector: 'kt-checkbox-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './checkbox-group.css',
  host: {
    '[attr.id]': 'null',
  },
  template: `
    <div
      class="kt-checkbox-group-field"
      [id]="baseId()"
      [class.kt-checkbox-group-field--invalid]="showInvalid()"
      [class.kt-checkbox-group-field--disabled]="disabled()"
      role="group"
      [attr.aria-labelledby]="label() ? labelId() : null"
      [attr.aria-label]="!label() ? resolvedAriaLabel() : null"
      [attr.aria-describedby]="describedBy()"
      [attr.aria-required]="required() ? 'true' : null"
      [attr.aria-invalid]="showInvalid() ? 'true' : null"
      [attr.aria-busy]="pending() ? 'true' : null"
      [attr.data-pending]="pending() ? '' : null"
    >
      @if (label(); as labelText) {
        <span [id]="labelId()" class="kt-checkbox-group__legend">
          {{ labelText }}
          @if (required()) {
            <span class="kt-checkbox-group__required" aria-hidden="true">*</span>
          }
        </span>
      }

      <div class="kt-checkbox-group__options">
        <ng-content></ng-content>
      </div>

      @if (hint() && !showInvalid()) {
        <p [id]="hintId()" class="kt-checkbox-group__hint">{{ hint() }}</p>
      }
      <div [id]="errorId()" class="kt-checkbox-group__error" aria-live="polite">
        @if (showInvalid()) {
          @for (error of displayedErrors(); track $index) {
            <span class="kt-checkbox-group__error-message">{{ error.message }}</span>
          }
        }
      </div>
    </div>
  `,
})
export class KtCheckboxGroup<V> implements FormValueControl<V[]> {
  private readonly config = inject(KT_FIELD_CONFIG, { optional: true });

  /** Sélection courante : tableau des valeurs d'options cochées (two-way). @default [] */
  readonly value = model<V[]>([]);

  // --- État poussé par [formField] ---
  /** État « touché » (two-way), généralement piloté par `[formField]`. @default false */
  readonly touched = model<boolean>(false);
  /** Désactive le groupe entier (hérité par chaque case enfant). @default false */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Marque le groupe comme invalide (combiné à `touched`/`dirty` via l'`errorMatcher`). @default false */
  readonly invalid = input<boolean, unknown>(false, { transform: booleanAttribute });
  /** Affiche l'astérisque requis et `aria-required` sur le groupe. @default false */
  readonly required = input(false, { transform: booleanAttribute });
  /** État « modifié » (entre dans la logique d'affichage des erreurs). @default false */
  readonly dirty = input<boolean, unknown>(false, { transform: booleanAttribute });
  /** Validation asynchrone en cours (poussé par `[field]`) : pose `aria-busy` + `data-pending`. @default false */
  readonly pending = input<boolean, unknown>(false, { transform: booleanAttribute });
  /** Erreurs de validation à afficher sous le groupe. @default [] */
  readonly errors = input<readonly WithOptionalFieldTree<ValidationError>[]>([]);
  /** Nom logique du groupe, à titre INDICATIF : contrairement à `kt-radio-group` (où `name` est
      propagé aux `<input>` natifs pour le regroupement radio), il n'est PAS répercuté sur les cases
      enfants (les checkboxes n'ont pas besoin d'un `name` partagé). @default '' */
  readonly name = input<string>('');

  // --- Présentation ---
  /** id imposé (sélecteurs de test stables) ; sinon auto-généré, anti-collision. @default undefined */
  readonly id = input<string>();
  /** Légende du groupe (`aria-labelledby`). @default undefined */
  readonly label = input<string>();
  /** Texte d'aide affiché sous le groupe (masqué quand une erreur s'affiche). @default undefined */
  readonly hint = input<string>();
  /** Nom accessible (`aria-label`) du groupe quand `label` est absent. @default undefined */
  readonly ariaLabel = input<string>();
  /** Stratégie décidant quand afficher les erreurs (sinon celle du `KT_FIELD_CONFIG`). @default undefined */
  readonly errorMatcher = input<KtFieldErrorMatcher>();
  /** Afficher toutes les erreurs au lieu de la première seule. @default KT_FIELD_CONFIG.showAllErrors ?? false */
  readonly showAllErrors = input<boolean, unknown>(this.config?.showAllErrors ?? false, {
    transform: booleanAttribute,
  });

  /** Égalité des valeurs en mode objet (défaut : identité `===`). */
  readonly compareWith = input<(a: V, b: V) => boolean>();

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly errorResolver = inject(KtFieldErrorResolver);
  private readonly idGen = inject(KtIdGenerator);
  private readonly uid = this.idGen.generateId('checkbox-group');
  protected readonly baseId = computed(() => this.id() ?? `kt-checkbox-group-${this.uid}`);
  protected readonly labelId = computed(() => `${this.baseId()}-label`);
  protected readonly hintId = computed(() => `${this.baseId()}-hint`);
  protected readonly errorId = computed(() => `${this.baseId()}-error`);

  private readonly matcher = computed(
    () => this.errorMatcher() ?? this.config?.errorMatcher ?? defaultKtFieldErrorMatcher,
  );

  protected readonly showInvalid = computed(() =>
    this.matcher()({ invalid: this.invalid(), touched: this.touched(), dirty: this.dirty() }),
  );

  /** Erreurs résolues (messages par défaut appliqués, suppressions `message: ''` écartées). */
  protected readonly resolvedErrors = computed(() => this.errorResolver.resolveAll(this.errors()));

  protected readonly displayedErrors = computed(() =>
    this.showAllErrors() ? this.resolvedErrors() : this.resolvedErrors().slice(0, 1),
  );

  protected readonly resolvedAriaLabel = computed(() => this.ariaLabel() ?? null);

  protected readonly describedBy = computed(() => {
    const ids: string[] = [];
    if (this.hint() && !this.showInvalid()) ids.push(this.hintId());
    if (this.showInvalid() && this.resolvedErrors().length > 0) ids.push(this.errorId());
    return ids.length ? ids.join(' ') : null;
  });

  private readonly comparator = computed(() => this.compareWith() ?? ((a: V, b: V) => a === b));

  /** La valeur d'option d'un enfant est-elle dans la sélection ? (lu dans le `computed` enfant) */
  isSelected(optionValue: V): boolean {
    const arr = this.value() ?? [];
    const cmp = this.comparator();
    return arr.some((v) => cmp(v, optionValue));
  }

  /** Focus la première case activable (utilisé par Signal Forms `focusBoundControl`). */
  focus(options?: FocusOptions): void {
    this.el.nativeElement.querySelector<HTMLInputElement>('input[type="checkbox"]:not([disabled])')?.focus(options);
  }

  /** Ajoute/retire une valeur d'option de la sélection (émis par un enfant au `change` natif). */
  toggle(optionValue: V, checked: boolean): void {
    if (this.disabled()) return;
    const arr = this.value() ?? [];
    const cmp = this.comparator();
    const exists = arr.some((v) => cmp(v, optionValue));
    if (checked && !exists) {
      this.value.set([...arr, optionValue]);
    } else if (!checked && exists) {
      this.value.set(arr.filter((v) => !cmp(v, optionValue)));
    }
    this.touched.set(true);
  }
}
