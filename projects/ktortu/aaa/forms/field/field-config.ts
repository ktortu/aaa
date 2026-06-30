import { InjectionToken, Provider, Signal } from '@angular/core';
import type { ValidationError } from '@angular/forms/signals';

/** État d'un champ pertinent pour décider de l'affichage des erreurs. */
export interface KtFieldErrorState {
  /** Le champ est-il en erreur de validation. */
  invalid: boolean;
  /** Le champ a-t-il été visité (blur). */
  touched: boolean;
  /** Le champ a-t-il été modifié depuis sa valeur initiale. */
  dirty: boolean;
}

/** Décide QUAND afficher les erreurs d'un champ (équivalent signal de l'ErrorStateMatcher Material). */
export type KtFieldErrorMatcher = (state: KtFieldErrorState) => boolean;

/** Erreur à résoudre en message : la `ValidationError` de Signal Forms. Selon le `kind`, ses
    sous-types portent des params typés (`min`, `max`, `minLength`, `maxLength`, `minDate`,
    `maxDate`, `pattern`…) lisibles via {@link ktErrorParam}. */
export type KtResolvableError = ValidationError;

/** Fabrique de message par défaut pour un `kind` : reçoit l'erreur complète (params accessibles). */
export type KtErrorMessageFactory = (error: KtResolvableError) => string;

/** Messages d'erreur par défaut indexés par `kind`. Valeur statique (kinds sans param : `required`,
    `email`) ou fabrique (kinds paramétrés : `min`, `minLength`…). Une chaîne vide (`''`) supprime
    l'affichage du message — le champ reste invalide, mais sans texte (cf. récap d'erreurs externe). */
export type KtFieldErrorMessages = Record<string, string | KtErrorMessageFactory>;

/** Apparence du chrome de champ. `fill` = label au-dessus (défaut historique) ; `outline` = bordure
    + label flottant qui se loge dans la bordure (transition douce depuis Angular Material « outline »). */
export type KtFieldAppearance = 'fill' | 'outline';

/** Politique du label flottant (apparence `outline` uniquement). `auto` = flotte au focus / quand le
    champ est rempli ; `always` = toujours flotté, même vide (le placeholder s'affiche alors). Équivaut
    au `floatLabel` d'Angular Material. */
export type KtFloatLabel = 'auto' | 'always';

/** Défaut : afficher l'erreur une fois le champ quitté (blur). */
export const defaultKtFieldErrorMatcher: KtFieldErrorMatcher = (state) => state.invalid && state.touched;

/** Défauts applicables à tous les champs (surchargeables par champ via les inputs).
    Lib neutre i18n : les textes sont fournis par le consommateur, ici en une fois.
    Fourni en `Partial` : un consommateur n'override que ce qu'il veut. */
export interface KtFieldConfig {
  /** Libellé accessible du bouton d'effacement. */
  clearLabel: string;
  /** Libellé accessible du bouton d'aide (i18n). */
  helpLabel: string;
  /** Quand afficher les erreurs. Défaut : `invalid && touched`. */
  errorMatcher: KtFieldErrorMatcher;
  /** Masquer le hint quand l'erreur s'affiche (façon Material). Défaut : `false`. */
  hideHintWhenInvalid: boolean;
  /** Afficher toutes les erreurs au lieu de la première seule. Défaut : `false`. */
  showAllErrors: boolean;
  /** Message d'erreur d'un `kt-number-field` quand la saisie n'est pas un nombre valide.
      Défaut (anglais neutre) : `'Please enter a valid number.'`. */
  numberParseError: string;
  /** Messages d'erreur par défaut indexés par `kind` (`required`, `email`, `min`, `minLength`…),
      fusionnés par-dessus les défauts anglais embarqués (cf. `KT_DEFAULT_FIELD_ERROR_MESSAGES`).
      Un message explicite passé au validateur Signal Forms (`{ message }`) reste prioritaire ; une
      valeur `''` supprime le texte d'un `kind`. Défaut : `{}` (on garde les défauts anglais). */
  errorMessages: Partial<KtFieldErrorMessages>;
  /** Apparence par défaut de tous les champs (`fill` | `outline`). Défaut : `'fill'`. */
  appearance: KtFieldAppearance;
  /** Politique du label flottant en `outline` (`auto` | `always`). Défaut : `'auto'`. */
  floatLabel: KtFloatLabel;
}

export const KT_FIELD_CONFIG = new InjectionToken<Partial<KtFieldConfig>>('KT_FIELD_CONFIG');

/**
 * Fournit des défauts de champ (apparence, libellés, matcher d'erreurs, messages d'erreur par
 * défaut…) pour un sous-arbre ou l'application entière. Idéal pour une transition globale — ex. tout
 * passer en `outline` façon Material en un seul provider.
 *
 * @example
 * ```ts
 * // app.config.ts — apparence globale
 * providers: [provideKtField({ appearance: 'outline' })]
 * ```
 *
 * @example
 * ```ts
 * // Surcharger des messages d'erreur par défaut (fusionnés par-dessus les défauts anglais).
 * // Une fabrique reçoit l'erreur complète : ses params typés sont lisibles via `ktErrorParam`.
 * providers: [
 *   provideKtField({
 *     errorMessages: {
 *       required: 'Champ obligatoire.',
 *       minLength: (e) => `Au moins ${ktErrorParam<number>(e, 'minLength')} caractères.`,
 *       pattern: '', // '' supprime le texte de ce kind : champ rouge, sans message
 *     },
 *   }),
 * ]
 * ```
 *
 * @remarks Pour passer toute la lib en français d'un coup (libellés + messages d'erreur), préférez
 * `provideKtDefaultFR()` (paquet `@ktortu/aaa/i18n`), qui fournit déjà un dictionnaire complet.
 */
export function provideKtField(config: Partial<KtFieldConfig>): Provider {
  return { provide: KT_FIELD_CONFIG, useValue: config };
}

/** Parent field interface representing shared states for its controls. */
export interface KtFieldParent {
  /** id de base du champ, posé sur le contrôle (`[id]`). */
  readonly baseId: Signal<string>;
  /** Valeur de `aria-describedby` à câbler sur le contrôle (ou `null`). */
  readonly describedBy: Signal<string | null>;
  /** Le champ est-il en erreur (pose `aria-invalid`). */
  readonly invalid: Signal<boolean>;
  /** Le champ est-il requis (pose `aria-required`). */
  readonly required: Signal<boolean>;
}

export const KT_FIELD = new InjectionToken<KtFieldParent>('KT_FIELD');
