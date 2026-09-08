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
 * Groupe de boutons radio (Radio Group) conforme à l'ARIA APG / RGAA.
 * Orchestrateur : porte la valeur (`FormValueControl<V | null>`), génère le `name` partagé et la
 * sémantique de groupe (`role="radiogroup"`, légende, `aria-required`/`aria-invalid`, erreurs).
 *
 * Le clavier (roving tabindex + flèches qui déplacent ET cochent) est laissé au NATIF : les
 * `<input type="radio">` des `kt-radio` enfants partagent le `name` du groupe — rien à réimplémenter.
 * Les options sont fournies par le dev (boucle `@for` ou déclaration en dur) ; `compareWith` gère
 * l'égalité quand `value` est un objet.
 *
 * @example
 * ```html
 * <kt-radio-group label="Civilité" [(value)]="civility" required>
 *   <kt-radio [optionValue]="'mme'" label="Madame" />
 *   <kt-radio [optionValue]="'m'" label="Monsieur" />
 *   <kt-radio [optionValue]="'autre'" label="Autre" />
 * </kt-radio-group>
 * ```
 */
@Component({
  selector: 'kt-radio-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './radio-group.css',
  host: {
    '[attr.id]': 'null',
  },
  template: `
    <div
      class="kt-radio-group-field"
      [id]="baseId()"
      [class.kt-radio-group-field--invalid]="showInvalid()"
      [class.kt-radio-group-field--disabled]="disabled()"
      role="radiogroup"
      [attr.aria-labelledby]="label() ? labelId() : null"
      [attr.aria-label]="!label() ? resolvedAriaLabel() : null"
      [attr.aria-describedby]="describedBy()"
      [attr.aria-required]="required() ? 'true' : null"
      [attr.aria-invalid]="showInvalid() ? 'true' : null"
      [attr.aria-busy]="pending() ? 'true' : null"
      [attr.data-pending]="pending() ? '' : null"
    >
      @if (label(); as labelText) {
        <span [id]="labelId()" class="kt-radio-group__legend">
          {{ labelText }}
          @if (required()) {
            <span class="kt-radio-group__required" aria-hidden="true">*</span>
          }
        </span>
      }

      <div class="kt-radio-group__options">
        <ng-content></ng-content>
      </div>

      @if (hint() && !showInvalid()) {
        <p [id]="hintId()" class="kt-radio-group__hint">{{ hint() }}</p>
      }
      <div [id]="errorId()" class="kt-radio-group__error" aria-live="polite">
        @if (showInvalid()) {
          @for (error of displayedErrors(); track $index) {
            <span class="kt-radio-group__error-message">{{ error.message }}</span>
          }
        }
      </div>
    </div>
  `,
})
export class KtRadioGroup<V> implements FormValueControl<V | null> {
  private readonly config = inject(KT_FIELD_CONFIG, { optional: true });

  /** Valeur sélectionnée (two-way), ou `null` si aucune option n'est cochée. @default null */
  readonly value = model<V | null>(null);

  // --- État poussé par [formField] ---
  /** État « touché » (two-way), généralement piloté par `[formField]`. @default false */
  readonly touched = model<boolean>(false);
  /** Désactive le groupe entier (hérité par chaque radio enfant). @default false */
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
  /** Base du `name` partagé par les radios enfants (sinon auto-généré). @default '' */
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

  /** Égalité des valeurs en mode objet (défaut : identité `===`). Seul rescapé du contrat select. */
  readonly compareWith = input<(a: V, b: V) => boolean>();

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly errorResolver = inject(KtFieldErrorResolver);
  private readonly idGen = inject(KtIdGenerator);
  private readonly uid = this.idGen.generateId('radio-group');
  protected readonly baseId = computed(() => this.id() ?? `kt-radio-group-${this.uid}`);
  /** `name` partagé par les radios enfants → regroupement clavier NATIF (roving + flèches). */
  readonly groupName = computed(() => this.name() || `${this.baseId()}-name`);
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

  /** L'`optionValue` d'un enfant correspond-il à la sélection courante ? (lu dans le `computed` enfant) */
  isSelected(radioValue: V): boolean {
    const v = this.value();
    if (v === null || v === undefined) return false;
    return this.comparator()(radioValue, v as V);
  }

  /** Focus l'option pertinente (utilisé par Signal Forms `focusBoundControl`) : le radio coché
      s'il existe, sinon le premier radio activable — conforme au roving tabindex natif. */
  focus(options?: FocusOptions): void {
    const root = this.el.nativeElement;
    const target =
      root.querySelector<HTMLInputElement>('input[type="radio"]:checked') ??
      root.querySelector<HTMLInputElement>('input[type="radio"]:not([disabled])');
    target?.focus(options);
  }

  /** Commit d'une sélection émis par un enfant au `change` natif. */
  select(radioValue: V): void {
    if (this.disabled()) return;
    this.value.set(radioValue);
    this.touched.set(true);
  }
}
