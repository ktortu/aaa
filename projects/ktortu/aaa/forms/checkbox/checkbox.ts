import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  input,
  inject,
  model,
  viewChild,
} from '@angular/core';
import { KT_AUDIT_ENABLED } from '@ktortu/aaa/cdk';
import { FormValueControl } from '@angular/forms/signals';
import type { ValidationError, WithOptionalFieldTree } from '@angular/forms/signals';
import { KT_FIELD_CONFIG, type KtFieldErrorMatcher, defaultKtFieldErrorMatcher } from '../field/field-config';
import { KtFieldErrorResolver } from '../field/error-messages';
import { KtCheckboxGroup } from './checkbox-group';
import { KtIdGenerator } from '@ktortu/aaa/cdk';

/**
 * Case à cocher (Checkbox) accessible conforme aux normes WAI-ARIA / RGAA.
 * Bâtie sur un `<input type="checkbox">` NATIF (clavier, clic-label, état `indeterminate`,
 * mode contraste élevé gratuits), redessinée via `appearance: none` + pseudo-éléments thémés.
 *
 * DEUX MODES, selon la présence d'un `kt-checkbox-group` parent :
 *  - Autonome : `value` est l'état coché (`boolean`, two-way), intégré aux Signal Forms via
 *    `FormValueControl<boolean>` (même contrat que `kt-switch`).
 *  - Dans un groupe : `optionValue` porte la VALEUR d'option représentée ; l'état coché dérive de
 *    l'appartenance au tableau du groupe, et le (dé)cochage met à jour ce tableau. `value` est
 *    alors ignoré (c'est le groupe qui détient la sélection).
 *
 * Libellé : `label` (texte) par défaut ; un contenu projeté le remplace visuellement pour les
 * rendus riches (carte/option), `ariaLabel` portant alors le nom accessible si besoin.
 *
 * @example
 * ```html
 * <!-- Autonome -->
 * <kt-checkbox label="Accepter les conditions" [(value)]="accepted" required />
 *
 * <!-- Dans un groupe -->
 * <kt-checkbox-group label="Centres d'intérêt" [(value)]="interests">
 *   <kt-checkbox [optionValue]="'sport'" label="Sport" />
 *   <kt-checkbox [optionValue]="'musique'" label="Musique" />
 * </kt-checkbox-group>
 * ```
 */
@Component({
  selector: 'kt-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './checkbox.css',
  template: `
    <div
      class="kt-checkbox-field"
      [class.kt-checkbox-field--invalid]="showInvalid()"
      [class.kt-checkbox-field--disabled]="isDisabled()"
      [attr.data-pending]="pending() ? '' : null"
    >
      <label class="kt-checkbox">
        <input
          #input
          type="checkbox"
          class="kt-checkbox__input"
          [id]="baseId()"
          [checked]="isChecked()"
          [disabled]="isDisabled()"
          [attr.name]="name() || null"
          [attr.aria-label]="resolvedAriaLabel()"
          [attr.aria-describedby]="describedBy()"
          [attr.aria-invalid]="showInvalid() ? 'true' : null"
          [attr.aria-required]="required() ? 'true' : null"
          [attr.aria-busy]="pending() ? 'true' : null"
          (change)="onChange($event)"
          (blur)="onBlur()"
        />
        <span class="kt-checkbox__label">
          <ng-content>{{ label() }}</ng-content>
          @if (required()) {
            <span class="kt-checkbox__required" aria-hidden="true">*</span>
          }
        </span>
      </label>

      @if (hint() && !showInvalid()) {
        <p [id]="hintId()" class="kt-checkbox-hint">{{ hint() }}</p>
      }
      <div [id]="errorId()" class="kt-checkbox-error" aria-live="polite">
        @if (showInvalid()) {
          @for (error of displayedErrors(); track $index) {
            <span class="kt-checkbox-error-message">{{ error.message }}</span>
          }
        }
      </div>
    </div>
  `,
})
export class KtCheckbox<V = unknown> implements FormValueControl<boolean>, AfterViewInit {
  private readonly config = inject(KT_FIELD_CONFIG, { optional: true });

  /** Groupe parent optionnel : présent ⇒ la case appartient à un `kt-checkbox-group`. */
  protected readonly group = inject(KtCheckboxGroup, { optional: true }) as KtCheckboxGroup<V> | null;

  /** État coché (`boolean`, two-way) en mode autonome. Ignoré en mode groupe : c'est alors
      `optionValue` + le tableau du groupe qui font foi. @default false */
  readonly value = model<boolean>(false);

  /** Mode groupe uniquement : valeur d'option contribuée au tableau du `kt-checkbox-group` parent
      quand la case est cochée. Sans effet en mode autonome. @default undefined */
  readonly optionValue = input<V>();

  /** Tri-état visuel (parent d'une arborescence) : propriété DOM `indeterminate`, pas un attribut. */
  readonly indeterminate = input<boolean, unknown>(false, { transform: booleanAttribute });

  // --- État poussé par [formField] (mode autonome) ---
  /** État « touché » (two-way), généralement piloté par `[formField]`. @default false */
  readonly touched = model<boolean>(false);
  /** Désactive la case (héritable du groupe parent). @default false */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Marque la case comme invalide (combiné à `touched`/`dirty` via l'`errorMatcher`). @default false */
  readonly invalid = input<boolean, unknown>(false, { transform: booleanAttribute });
  /** Affiche l'astérisque requis et `aria-required`. @default false */
  readonly required = input(false, { transform: booleanAttribute });
  /** État « modifié » (entre dans la logique d'affichage des erreurs). @default false */
  readonly dirty = input<boolean, unknown>(false, { transform: booleanAttribute });
  /** Validation asynchrone en cours (poussé par `[field]`) : pose `aria-busy` + `data-pending`. @default false */
  readonly pending = input<boolean, unknown>(false, { transform: booleanAttribute });
  /** Erreurs de validation à afficher sous la case. @default [] */
  readonly errors = input<readonly WithOptionalFieldTree<ValidationError>[]>([]);
  /** Attribut `name` du `<input>` natif. @default '' */
  readonly name = input<string>('');

  // --- Présentation ---
  /** id imposé (sélecteurs de test stables) ; sinon auto-généré, anti-collision. @default undefined */
  readonly id = input<string>();
  /** Texte du libellé (remplacé visuellement par un contenu projeté). @default undefined */
  readonly label = input<string>();
  /** Texte d'aide affiché sous la case (masqué quand une erreur s'affiche). @default undefined */
  readonly hint = input<string>();
  /** Nom accessible (`aria-label`) pour une case sans libellé textuel. @default undefined */
  readonly ariaLabel = input<string>();
  /** Stratégie décidant quand afficher les erreurs (sinon celle du `KT_FIELD_CONFIG`). @default undefined */
  readonly errorMatcher = input<KtFieldErrorMatcher>();
  /** Afficher toutes les erreurs au lieu de la première seule. @default KT_FIELD_CONFIG.showAllErrors ?? false */
  readonly showAllErrors = input<boolean, unknown>(this.config?.showAllErrors ?? false, {
    transform: booleanAttribute,
  });

  private readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('input');
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly errorResolver = inject(KtFieldErrorResolver);
  private readonly auditEnabled = inject(KT_AUDIT_ENABLED);
  private isDestroyed = false;

  private readonly idGen = inject(KtIdGenerator);
  private readonly uid = this.idGen.generateId('checkbox');
  protected readonly baseId = computed(() => this.id() ?? `kt-checkbox-${this.uid}`);
  protected readonly hintId = computed(() => `${this.baseId()}-hint`);
  protected readonly errorId = computed(() => `${this.baseId()}-error`);

  /** Coché : appartenance au groupe le cas échéant, sinon l'état booléen propre.
      (Nommé `isChecked` car `FormValueControl` réserve la propriété `checked`.) */
  protected readonly isChecked = computed(() =>
    this.group ? this.group.isSelected(this.optionValue() as V) : this.value(),
  );

  /** Désactivé : hérité du groupe le cas échéant. */
  protected readonly isDisabled = computed(() => (this.group?.disabled() ?? false) || this.disabled());

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

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.isDestroyed = true;
    });

    // `indeterminate` est une PROPRIÉTÉ (non un attribut) : poussée impérativement sur l'input natif.
    effect(() => {
      this.inputEl().nativeElement.indeterminate = this.indeterminate();
    });
  }

  ngAfterViewInit(): void {
    // Garde-fou a11y (navigateur uniquement) : nom accessible = `label`, `ariaLabel` OU contenu
    // projeté. Sans aucun des trois, la case est annoncée vide (WCAG 4.1.2).
    if (this.isDestroyed) return;
    if (!this.auditEnabled || this.label() || this.ariaLabel()) return;
    const labelText = this.el.nativeElement
      .querySelector('.kt-checkbox__label')
      ?.textContent?.replace('*', '')
      .trim();
    if (!labelText) {
      console.warn(
        '[ktCheckbox] sans `label`, `ariaLabel` ni contenu projeté : annoncée sans nom accessible (WCAG 4.1.2).',
      );
    }
  }

  /** Focus la case native (utilisé par Signal Forms `focusBoundControl`). */
  focus(options?: FocusOptions): void {
    this.inputEl().nativeElement.focus(options);
  }

  protected onChange(event: Event): void {
    if (this.isDisabled()) return;
    const checked = (event.target as HTMLInputElement).checked;
    if (this.group) {
      this.group.toggle(this.optionValue() as V, checked);
      this.group.touched.set(true);
      return;
    }
    this.value.set(checked);
    this.touched.set(true);
  }

  protected onBlur(): void {
    (this.group?.touched ?? this.touched).set(true);
  }
}
