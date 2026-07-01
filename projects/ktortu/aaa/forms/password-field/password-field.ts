import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, model, signal } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { KtIdGenerator } from '@ktortu/aaa/cdk';
import { KtBaseInputField } from '../base-input/base-input';
import { KtField } from '../field/field';
import { KtFieldControl } from '../field/field-control';

export type KtPasswordAutocomplete = 'current-password' | 'new-password' | 'off';

/**
 * Champ mot de passe (valeur `string`) intégré aux Signal Forms via `FormValueControl`.
 * Inclut un bouton pour masquer/afficher la saisie en clair de manière accessible.
 *
 * @example
 * ```html
 * <kt-password-field label="Mot de passe" [(value)]="password" required />
 * ```
 */
@Component({
  selector: 'kt-password-field',
  imports: [KtField, KtFieldControl, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './password-field.html',
})
export class KtPasswordField extends KtBaseInputField<string> implements FormValueControl<string> {
  /** Valeur saisie (two-way). @default '' */
  readonly value = model<string>('');

  /** Plancher de caractères (attribut `minlength` natif ; poussé par le validateur minLength). @default undefined */
  readonly minLength = input<number>();
  /** Plafond de caractères (attribut `maxlength` natif ; poussé par le validateur maxLength). @default undefined */
  readonly maxLength = input<number>();
  /** Motifs de validation. @default [] */
  readonly pattern = input<readonly RegExp[]>([]);
  /** Source de la première regex pour l'attribut `pattern` natif (`null` si aucune). */
  protected readonly patternAttr = computed(() => this.pattern()[0]?.source ?? null);

  /** Indice d'autoremplissage effectif (par défaut 'current-password'). */
  protected readonly resolvedAutocomplete = computed(() => this.autocomplete() ?? 'current-password');

  /** État de visibilité du mot de passe en clair. @default false */
  protected readonly isPasswordVisible = signal(false);

  /** Type natif de l'input selon l'état de visibilité. */
  protected readonly inputType = computed(() => (this.isPasswordVisible() ? 'text' : 'password'));

  private readonly idGen = inject(KtIdGenerator);
  private readonly uid = this.idGen.generateId('password-field');
  protected readonly inputId = computed(() => this.id() ?? `kt-password-field-${this.uid}`);

  protected parse(raw: string): string {
    return raw;
  }

  protected emptyValue(): string {
    return '';
  }

  protected isEmpty(value: string): boolean {
    return value.length === 0;
  }

  /**
   * Bascule l'état de visibilité du mot de passe.
   * Utilise preventDefault() pour empêcher l'input de perdre le focus.
   */
  protected toggleVisibility(event: MouseEvent): void {
    event.preventDefault();
    if (this.disabled() || this.readonly()) {
      return;
    }
    this.isPasswordVisible.update((visible) => !visible);
  }
}
