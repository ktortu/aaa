import { Injectable, inject } from '@angular/core';
import { KT_FIELD_CONFIG, type KtFieldErrorMessages, type KtResolvableError } from './field-config';
import type { KtFieldError } from './field';

/**
 * Lit un param typé d'une `ValidationError` (ex. `min`, `minLength`, `maxLength`, `minDate`…).
 * Les sous-types d'erreur de Signal Forms exposent ces params, mais le type de base `ValidationError`
 * ne les déclare pas : ce helper centralise l'accès pour les fabriques de message, sans `any`.
 *
 * @example
 * ```ts
 * minLength: (e) => `Au moins ${ktErrorParam<number>(e, 'minLength')} caractères.`
 * ```
 */
export function ktErrorParam<T>(error: KtResolvableError, key: string): T {
  return (error as unknown as Record<string, T>)[key];
}

/**
 * Messages d'erreur **anglais** par défaut de la lib, indexés par `kind`. Couvrent tous les
 * validateurs natifs de Signal Forms (`required`, `email`, `min`, `max`, `minLength`, `maxLength`,
 * `minDate`, `maxDate`, `pattern`). Surchargeables famille par famille via `KT_FIELD_CONFIG.errorMessages`
 * (ou globalement par langue, cf. `provideKtDefaultFR`). Le `numberParseError` reste géré à la source
 * par `kt-number-field` (kind `parse`).
 */
export const KT_DEFAULT_FIELD_ERROR_MESSAGES: KtFieldErrorMessages = {
  required: 'This field is required.',
  email: 'Enter a valid email address.',
  min: (e) => `Enter a value greater than or equal to ${ktErrorParam<number>(e, 'min')}.`,
  max: (e) => `Enter a value less than or equal to ${ktErrorParam<number>(e, 'max')}.`,
  minLength: (e) => `Enter at least ${ktErrorParam<number>(e, 'minLength')} characters.`,
  maxLength: (e) => `Enter at most ${ktErrorParam<number>(e, 'maxLength')} characters.`,
  minDate: (e) => `Choose a date on or after ${ktErrorParam<Date>(e, 'minDate').toLocaleDateString()}.`,
  maxDate: (e) => `Choose a date on or before ${ktErrorParam<Date>(e, 'maxDate').toLocaleDateString()}.`,
  pattern: 'The value is not in the expected format.',
};

/**
 * Résout le **message par défaut** d'une erreur de validation à partir de son `kind` (et de ses
 * params typés), en fusionnant les défauts anglais embarqués avec les surcharges du `KT_FIELD_CONFIG`.
 *
 * Utilisé par chaque contrôle `kt-*` au moment du rendu, là où la `ValidationError` complète (params)
 * est encore disponible — `kt-field` reste agnostique de Signal Forms. Précédence du texte affiché :
 * `message` du validateur > `KT_FIELD_CONFIG.errorMessages[kind]` > défaut anglais > rien.
 *
 * Injectable racine : un seul résolveur partagé par tous les champs.
 */
// Stryker disable next-line all: `providedIn` doit rester statiquement analysable par l'AOT Angular
// (NG1010) ; aucune logique à muter dans le décorateur.
@Injectable({ providedIn: 'root' })
export class KtFieldErrorResolver {
  private readonly config = inject(KT_FIELD_CONFIG, { optional: true });

  /** Map effective : défauts anglais + surcharges du `KT_FIELD_CONFIG`, par `kind`. */
  private readonly messages: Partial<KtFieldErrorMessages> = {
    ...KT_DEFAULT_FIELD_ERROR_MESSAGES,
    ...this.config?.errorMessages,
  };

  /**
   * Message par défaut d'une erreur (selon son `kind` + params), ou `undefined` si aucun défaut
   * n'est connu pour ce `kind` (l'UI n'affiche alors rien).
   */
  resolve(error: KtResolvableError): string | undefined {
    const entry = this.messages[error.kind];
    if (entry === undefined) return undefined;
    return typeof entry === 'function' ? entry(error) : entry;
  }

  /**
   * Prépare une liste d'erreurs pour l'affichage : applique la précédence (message du validateur
   * sinon défaut résolu) et **écarte les erreurs au message vide** — suppression explicite via
   * `{ message: '' }`. Le champ reste invalide (rouge / `aria-invalid`), simplement sans texte.
   */
  resolveAll(errors: readonly KtResolvableError[]): KtFieldError[] {
    const resolved: KtFieldError[] = [];
    for (const error of errors) {
      const message = error.message ?? this.resolve(error);
      if (message === undefined || message.trim() === '') continue;
      resolved.push({ kind: error.kind, message });
    }
    return resolved;
  }
}
