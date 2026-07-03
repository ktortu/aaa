import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  signal,
  afterRenderEffect,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FormValueControl } from '@angular/forms/signals';
import type { ValidationError, WithOptionalFieldTree } from '@angular/forms/signals';
import { KT_FIELD_CONFIG, type KtFieldErrorMatcher, defaultKtFieldErrorMatcher } from '../field/field-config';
import { KtFieldErrorResolver } from '../field/error-messages';
import { KtIdGenerator } from '@ktortu/aaa/cdk';

/**
 * Groupe de puces sélectionnables (Chip Listbox) conforme à l'ARIA Listbox / WCAG AAA.
 * Orchestrateur : s'intègre aux formulaires réactifs ou de modèle via `FormValueControl`.
 * Permet la sélection simple ou multiple, avec gestion du roving tabindex et des touches fléchées
 * de façon autonome et robuste.
 *
 * @example
 * ```html
 * <kt-chip-listbox label="Filtres" [(value)]="selectedTags" multiple>
 *   <kt-chip [value]="'angular'">Angular</kt-chip>
 *   <kt-chip [value]="'react'">React</kt-chip>
 * </kt-chip-listbox>
 * ```
 */
@Component({
  selector: 'kt-chip-listbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './chip-listbox.css',
  host: {
    class: 'kt-chip-listbox-container',
    '(keydown)': 'onKeydown($event)',
    '(focusin)': 'onFocusin($event)',
  },
  template: `
    <div
      class="kt-chip-listbox-field"
      [class.kt-chip-listbox-field--invalid]="showInvalid()"
      [class.kt-chip-listbox-field--disabled]="disabled()"
    >
      @if (label(); as labelText) {
        <span [id]="labelId()" class="kt-chip-listbox__legend">
          {{ labelText }}
          @if (required()) {
            <span class="kt-chip-listbox__required" aria-hidden="true">*</span>
          }
        </span>
      }

      <div
        class="kt-chip-listbox__options"
        role="listbox"
        [id]="baseId()"
        [attr.aria-multiselectable]="multiple() ? 'true' : null"
        [attr.aria-labelledby]="label() ? labelId() : null"
        [attr.aria-label]="!label() ? resolvedAriaLabel() : null"
        [attr.aria-describedby]="describedBy()"
        [attr.aria-required]="required() ? 'true' : null"
        [attr.aria-invalid]="showInvalid() ? 'true' : null"
        [attr.aria-disabled]="disabled() ? 'true' : null"
      >
        <ng-content />
      </div>

      @if (hint() && !showInvalid()) {
        <p [id]="hintId()" class="kt-chip-listbox__hint">{{ hint() }}</p>
      }
      <div [id]="errorId()" class="kt-chip-listbox__error" aria-live="polite">
        @if (showInvalid()) {
          @for (error of displayedErrors(); track $index) {
            <span class="kt-chip-listbox__error-message">{{ error.message }}</span>
          }
        }
      </div>
    </div>
  `,
})
export class KtChipListbox<V> implements FormValueControl<V | V[] | null> {
  private readonly config = inject(KT_FIELD_CONFIG, { optional: true });
  private readonly doc = inject(DOCUMENT);

  /** Valeur sélectionnée (two-way) : tableau de valeurs (si multiple) ou valeur unique (si simple). */
  readonly value = model<V | V[] | null>(null);

  // --- État poussé par [formField] ---
  /** État « touché » (two-way), piloté par `[formField]`. @default false */
  readonly touched = model<boolean>(false);
  /** Désactive le groupe de puces. @default false */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Mode lecture seule (bloque la sélection). @default false */
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Marque le groupe comme invalide. @default false */
  readonly invalid = input<boolean, unknown>(false, { transform: booleanAttribute });
  /** Affiche l'astérisque requis et aria-required sur le groupe. @default false */
  readonly required = input(false, { transform: booleanAttribute });
  /** État « modifié » (dirty). @default false */
  readonly dirty = input<boolean, unknown>(false, { transform: booleanAttribute });
  /** Validation asynchrone en cours. @default false */
  readonly pending = input<boolean, unknown>(false, { transform: booleanAttribute });
  /** Erreurs de validation à afficher. @default [] */
  readonly errors = input<readonly WithOptionalFieldTree<ValidationError>[]>([]);

  // --- Configuration ---
  /** Autorise la sélection de plusieurs puces. @default false */
  readonly multiple = input(false, { transform: booleanAttribute });
  /** Identifiant du composant (sélecteurs de test stables). @default auto-généré */
  readonly id = input<string>();
  /** Libellé (légende) du groupe de puces. @default undefined */
  readonly label = input<string>();
  /** Texte d'aide affiché sous le groupe. @default undefined */
  readonly hint = input<string>();
  /** Nom accessible (aria-label) quand label est absent. @default undefined */
  readonly ariaLabel = input<string>();
  /** Stratégie d'affichage des erreurs. @default undefined */
  readonly errorMatcher = input<KtFieldErrorMatcher>();
  /** Afficher toutes les erreurs. @default false */
  readonly showAllErrors = input<boolean, unknown>(this.config?.showAllErrors ?? false, {
    transform: booleanAttribute,
  });
  /** Fonction de comparaison de valeurs pour déterminer la sélection. */
  readonly compareWith = input<(a: V, b: V) => boolean>();

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly errorResolver = inject(KtFieldErrorResolver);
  private readonly idGen = inject(KtIdGenerator);
  private readonly uid = this.idGen.generateId('chip-listbox');
  protected readonly baseId = computed(() => this.id() ?? `kt-chip-listbox-${this.uid}`);
  protected readonly labelId = computed(() => `${this.baseId()}-label`);
  protected readonly hintId = computed(() => `${this.baseId()}-hint`);
  protected readonly errorId = computed(() => `${this.baseId()}-error`);

  protected readonly activeIndex = signal(0);

  private readonly matcher = computed(
    () => this.errorMatcher() ?? this.config?.errorMatcher ?? defaultKtFieldErrorMatcher,
  );

  protected readonly showInvalid = computed(() =>
    this.matcher()({ invalid: this.invalid(), touched: this.touched(), dirty: this.dirty() }),
  );

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

  constructor() {
    // Roving tabindex : un seul chip porte tabindex=0 (les autres -1) dans la liste
    afterRenderEffect(() => {
      this.value();
      const active = this.activeIndex();
      const focusables = this.query('.kt-chip');
      if (focusables.length === 0) return;
      const clamped = Math.min(Math.max(active, 0), focusables.length - 1);
      for (let i = 0; i < focusables.length; i++) {
        focusables[i].tabIndex = i === clamped ? 0 : -1;
      }
    });
  }

  private query(selector: string): HTMLElement[] {
    return Array.from(this.el.nativeElement.querySelectorAll<HTMLElement>(selector));
  }

  /** Détermine si une valeur d'option est sélectionnée. */
  isSelected(optionValue: V): boolean {
    const val = this.value();
    if (val === null || val === undefined) return false;
    const cmp = this.comparator();
    if (this.multiple()) {
      return Array.isArray(val) && val.some((v) => cmp(v, optionValue));
    }
    return cmp(val as V, optionValue);
  }

  /** Bascule la sélection d'une valeur d'option. */
  toggle(optionValue: V): void {
    if (this.disabled() || this.readonly()) return;
    const cmp = this.comparator();
    if (this.multiple()) {
      const arr = (this.value() as V[]) ?? [];
      const exists = arr.some((v) => cmp(v, optionValue));
      if (exists) {
        this.value.set(arr.filter((v) => !cmp(v, optionValue)));
      } else {
        this.value.set([...arr, optionValue]);
      }
    } else {
      const current = this.value() as V | null;
      if (current !== null && cmp(current, optionValue)) {
        this.value.set(null);
      } else {
        this.value.set(optionValue);
      }
    }
    this.touched.set(true);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const key = event.key;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', ' ', 'Enter'].includes(key)) {
      return;
    }

    const focusables = this.query('.kt-chip');
    if (focusables.length === 0) return;

    const currentIndex = focusables.indexOf(this.doc.activeElement as HTMLElement);

    if (key === ' ' || key === 'Enter') {
      event.preventDefault();
      if (currentIndex >= 0) {
        // Déclenche l'événement click natif du chip, qui est intercepté par le listener du chip
        focusables[currentIndex].click();
      }
      return;
    }

    let nextIndex = currentIndex;
    if (key === 'ArrowRight' || key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % focusables.length;
    } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + focusables.length) % focusables.length;
    } else if (key === 'Home') {
      nextIndex = 0;
    } else if (key === 'End') {
      nextIndex = focusables.length - 1;
    }

    if (nextIndex >= 0 && nextIndex < focusables.length) {
      event.preventDefault();
      this.activeIndex.set(nextIndex);
      focusables[nextIndex].focus();
    }
  }

  protected onFocusin(event: FocusEvent): void {
    const index = this.query('.kt-chip').indexOf(event.target as HTMLElement);
    if (index >= 0) this.activeIndex.set(index);
  }

  /** Focus la première option active. */
  focus(options?: FocusOptions): void {
    this.el.nativeElement.querySelector<HTMLElement>('.kt-chip:not([disabled])')?.focus(options);
  }
}
