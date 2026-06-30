import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  computed,
  inject,
  input,
  isDevMode,
  model,
  viewChild,
} from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import type { ValidationError, WithOptionalFieldTree } from '@angular/forms/signals';
import { KT_FIELD_CONFIG, type KtFieldErrorMatcher, defaultKtFieldErrorMatcher } from '../field/field-config';
import { KtFieldErrorResolver } from '../field/error-messages';
import { KtIdGenerator } from '@ktortu/aaa/cdk';

/**
 * Bouton bascule (Switch / Slide-Toggle) accessible conforme aux normes WAI-ARIA.
 * Permet d'activer ou désactiver une option avec effet immédiat.
 * Intégré aux Signal Forms de l'application via FormValueControl.
 *
 * @example
 * ```html
 * <kt-switch label="Notifications par e-mail" [(value)]="emailNotif" />
 * ```
 */
@Component({
  selector: 'kt-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './switch.css',
  template: `
    <div
      class="kt-switch-field"
      [class.kt-switch-field--invalid]="showInvalid()"
      [class.kt-switch-field--disabled]="disabled()"
      [attr.data-pending]="pending() ? '' : null"
    >
      <div class="kt-switch-row">
        <button
          #switchBtn
          type="button"
          role="switch"
          [id]="baseId()"
          [attr.aria-checked]="value()"
          [attr.aria-label]="resolvedAriaLabel()"
          [attr.aria-labelledby]="label() ? labelId() : null"
          [attr.aria-describedby]="describedBy()"
          [attr.aria-invalid]="showInvalid() ? 'true' : null"
          [attr.aria-required]="required() ? 'true' : null"
          [attr.aria-busy]="pending() ? 'true' : null"
          [disabled]="disabled()"
          (click)="toggle()"
          (keydown.space)="onSpacebar($event)"
          (blur)="touched.set(true)"
          class="kt-switch"
        >
          <span class="kt-switch__thumb"></span>
        </button>

        @if (label(); as labelText) {
          <label [id]="labelId()" [attr.for]="baseId()" class="kt-switch-label">
            {{ labelText }}
            @if (required()) {
              <span class="kt-switch-label__required" aria-hidden="true">*</span>
            }
          </label>
        }
      </div>

      @if (hint() && !showInvalid()) {
        <p [id]="hintId()" class="kt-switch-hint">{{ hint() }}</p>
      }
      <div [id]="errorId()" class="kt-switch-error" aria-live="polite">
        @if (showInvalid()) {
          @for (error of displayedErrors(); track $index) {
            <span class="kt-switch-error-message">{{ error.message }}</span>
          }
        }
      </div>
    </div>
  `,
})
export class KtSwitch implements FormValueControl<boolean> {
  private readonly config = inject(KT_FIELD_CONFIG, { optional: true });

  /** État de la bascule (two-way) : `true` = activé, `false` = désactivé. @default false */
  readonly value = model<boolean>(false);

  // --- État poussé par [formField] ---
  /** État « touché » (two-way), généralement piloté par `[formField]`. @default false */
  readonly touched = model<boolean>(false);
  /** Désactive la bascule (non actionnable). @default false */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Marque la bascule comme invalide (combiné à `touched`/`dirty` via l'`errorMatcher`). @default false */
  readonly invalid = input<boolean, unknown>(false, { transform: booleanAttribute });
  /** Affiche l'astérisque requis sur le libellé. @default false */
  readonly required = input(false, { transform: booleanAttribute });
  /** État « modifié » (entre dans la logique d'affichage des erreurs). @default false */
  readonly dirty = input<boolean, unknown>(false, { transform: booleanAttribute });
  /** Validation asynchrone en cours (poussé par `[field]`) : pose `aria-busy` + `data-pending`. @default false */
  readonly pending = input<boolean, unknown>(false, { transform: booleanAttribute });
  /** Erreurs de validation à afficher sous la bascule. @default [] */
  readonly errors = input<readonly WithOptionalFieldTree<ValidationError>[]>([]);
  /** Identifiant logique du contrôle (à titre indicatif). @default '' */
  readonly name = input<string>('');

  // --- Présentation ---
  /** id imposé (sélecteurs de test stables) ; sinon auto-généré, anti-collision. @default undefined */
  readonly id = input<string>();
  /** Texte du libellé associé à la bascule. @default undefined */
  readonly label = input<string>();
  /** Texte d'aide affiché sous la bascule (masqué quand une erreur s'affiche). @default undefined */
  readonly hint = input<string>();
  /** Nom accessible (`aria-label`) quand `label` est absent. @default undefined */
  readonly ariaLabel = input<string>();
  /** Stratégie décidant quand afficher les erreurs (sinon celle du `KT_FIELD_CONFIG`). @default undefined */
  readonly errorMatcher = input<KtFieldErrorMatcher>();
  /** Afficher toutes les erreurs au lieu de la première seule. @default KT_FIELD_CONFIG.showAllErrors ?? false */
  readonly showAllErrors = input<boolean, unknown>(this.config?.showAllErrors ?? false, {
    transform: booleanAttribute,
  });

  private readonly switchBtn = viewChild.required<ElementRef<HTMLButtonElement>>('switchBtn');

  private readonly errorResolver = inject(KtFieldErrorResolver);
  private readonly idGen = inject(KtIdGenerator);
  private readonly uid = this.idGen.generateId('switch');
  protected readonly baseId = computed(() => this.id() ?? `kt-switch-${this.uid}`);
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

  constructor() {
    // Garde-fou a11y (dev, navigateur uniquement) : un switch sans nom accessible est annoncé vide
    // (WCAG 4.1.2). Le nom vient de `label` ou `ariaLabel` (pas de contenu projeté ici).
    afterNextRender(() => {
      if (!isDevMode() || this.label() || this.ariaLabel()) return;
      console.warn(
        '[ktSwitch] sans `label` ni `ariaLabel` : le contrôle est annoncé sans nom accessible (WCAG 4.1.2).',
      );
    });
  }

  /** Focus le bouton bascule natif (utilisé par Signal Forms `focusBoundControl`). */
  focus(options?: FocusOptions): void {
    this.switchBtn().nativeElement.focus(options);
  }

  protected toggle(): void {
    if (this.disabled()) return;
    this.value.update((v) => !v);
    this.touched.set(true);
  }

  protected onSpacebar(event: Event): void {
    event.preventDefault(); // évite le scroll de la page au clavier
    this.toggle();
  }
}
