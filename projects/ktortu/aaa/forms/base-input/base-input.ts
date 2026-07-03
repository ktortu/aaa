import {
  Directive,
  ElementRef,
  ModelSignal,
  TemplateRef,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { ValidationError, WithOptionalFieldTree } from '@angular/forms/signals';
import {
  KT_FIELD_CONFIG,
  KtFieldErrorMatcher,
  defaultKtFieldErrorMatcher,
  type KtFieldAppearance,
  type KtFloatLabel,
} from '../field/field-config';
import { KtFieldErrorResolver } from '../field/error-messages';

/** Base partagée des champs simples (TextField, NumberField) : état FormValueControl,
    présentation (label/hint/prefix/suffix/clear) et politique d'affichage des erreurs.
    La valeur, son parsing et la notion de « vide » sont fournis par la sous-classe.

    @example
    ```ts
    // Sous-classement : on fournit value (model concret) + parse/emptyValue/isEmpty.
    @Component({ selector: 'kt-text-field', templateUrl: './text-field.html' })
    export class KtTextField extends KtBaseInputField<string> implements FormValueControl<string> {
      readonly value = model<string>('');
      protected parse(raw: string): string { return raw; }
      protected emptyValue(): string { return ''; }
      protected isEmpty(value: string): boolean { return value.length === 0; }
    }
    ``` */
@Directive()
export abstract class KtBaseInputField<T> {
  protected readonly config = inject(KT_FIELD_CONFIG, { optional: true });
  private readonly errorResolver = inject(KtFieldErrorResolver);

  /** Valeur du contrôle — déclarée concrètement par la sous-classe. */
  abstract value: ModelSignal<T>;

  // --- État poussé par [formField] ---
  // Ces entrées sont généralement câblées par l'intégration Signal Forms (`[formField]`) ;
  // tu peux aussi les piloter à la main en usage contrôlé.
  /** Marque le champ comme « visité » (déclenche l'affichage des erreurs). Deux-way. @default false */
  readonly touched = model<boolean>(false);
  /** Désactive la saisie et le focus. @default false */
  readonly disabled = input<boolean, unknown>(false, { transform: booleanAttribute });
  /** Rend le champ en lecture seule (valeur visible, non modifiable). @default false */
  readonly readonly = input<boolean, unknown>(false, { transform: booleanAttribute });
  /** Le champ est-il en erreur (état fourni par la validation). @default false */
  readonly invalid = input<boolean, unknown>(false, { transform: booleanAttribute });
  /** Marque le champ comme requis (ajoute `aria-required`). @default false */
  readonly required = input<boolean, unknown>(false, { transform: booleanAttribute });
  /** Le champ a-t-il été modifié depuis sa valeur initiale. @default false */
  readonly dirty = input<boolean, unknown>(false, { transform: booleanAttribute });
  /** Validation asynchrone en cours (poussé par `[field]`) : pose `aria-busy` + `data-pending`. @default false */
  readonly pending = input<boolean, unknown>(false, { transform: booleanAttribute });
  /** Liste des erreurs de validation à afficher. @default [] */
  readonly errors = input<readonly WithOptionalFieldTree<ValidationError>[]>([]);
  /** Attribut `name` natif du contrôle. @default '' */
  readonly name = input<string>('');

  // --- Présentation ---
  /** id imposé pour des sélecteurs de test stables ; sinon auto-généré par Field. @default undefined */
  readonly id = input<string>();
  /** Libellé du champ (associé via `<label for>`). @default undefined */
  readonly label = input<string>();
  /** Texte d'aide affiché sous le champ quand il est valide. @default undefined */
  readonly hint = input<string>();
  /** Aide contextuelle riche : texte ou `TemplateRef` projeté dans une infobulle d'aide. @default undefined */
  readonly helpText = input<string | TemplateRef<unknown>>();
  /** Libellé accessible du bouton d'aide. @default 'Help' (ou KT_FIELD_CONFIG.helpLabel) */
  readonly helpLabel = input<string>(this.config?.helpLabel ?? 'Help');
  /** Force la valeur de `aria-describedby` (sinon dérivée de hint/erreur). @default undefined */
  readonly customDescribedBy = input<string>();
  /** Émis au clic sur le bouton d'aide contextuelle. */
  readonly helpClick = output<MouseEvent>();
  /** Texte indicatif affiché dans le champ vide. @default undefined */
  readonly placeholder = input<string>();
  /** Indice d'autoremplissage du navigateur (attribut `autocomplete` natif) ; ex. `'current-password'`,
      `'new-password'`, `'email'`, `'username'`, `'off'`.
      @default undefined */
  readonly autocomplete = input<AutoFill>();
  /** Nom d'icône Material Symbols affichée en tête de champ. @default undefined */
  readonly icon = input<string>();
  /** Affiche un bouton « effacer » quand le champ contient une valeur. @default false */
  readonly clearable = input(false, { transform: booleanAttribute });
  /** Contenu décoratif en tête de champ : texte ou `TemplateRef`. @default undefined */
  readonly prefix = input<string | TemplateRef<unknown>>();
  /** Contenu décoratif en fin de champ : texte ou `TemplateRef`. @default undefined */
  readonly suffix = input<string | TemplateRef<unknown>>();
  /** Libellé i18n du bouton « effacer ». @default 'Clear' (ou KT_FIELD_CONFIG.clearLabel) */
  readonly clearLabel = input<string>(this.config?.clearLabel ?? 'Clear');
  /** Quand afficher l'erreur ; surcharge KT_FIELD_CONFIG et le défaut (`invalid && touched`). @default undefined */
  readonly errorMatcher = input<KtFieldErrorMatcher>();
  /** Apparence du chrome (`fill` | `outline`) ; non fournie ⇒ `KT_FIELD_CONFIG.appearance` ?? `'fill'`.
      @default undefined */
  readonly appearance = input<KtFieldAppearance>();
  /** Politique du label flottant en outline (`auto` | `always`) ; non fournie ⇒ `KT_FIELD_CONFIG.floatLabel`
      ?? `'auto'`. En `always`, le label reste en haut même vide et le placeholder s'affiche. @default undefined */
  readonly floatLabel = input<KtFloatLabel>();
  /** Masquer visuellement le label. @default KT_FIELD_CONFIG.hideLabel ?? false */
  readonly hideLabel = input<boolean, unknown>(this.config?.hideLabel ?? false, {
    transform: booleanAttribute,
  });
  /** Masquer visuellement le bloc d'erreur. @default KT_FIELD_CONFIG.hideErrors ?? false */
  readonly hideErrors = input<boolean, unknown>(this.config?.hideErrors ?? false, {
    transform: booleanAttribute,
  });

  protected readonly inputRef = viewChild<ElementRef<HTMLInputElement | HTMLTextAreaElement>>('input');

  private readonly matcher = computed(
    () => this.errorMatcher() ?? this.config?.errorMatcher ?? defaultKtFieldErrorMatcher,
  );

  // L'erreur ne s'affiche qu'au déclenchement décidé par le matcher (invalid/touched/dirty).
  protected readonly showInvalid = computed(() =>
    this.matcher()({ invalid: this.invalid(), touched: this.touched(), dirty: this.dirty() }),
  );

  /** Erreurs prêtes pour `kt-field` : messages par défaut résolus, suppressions (`message: ''`) écartées. */
  protected readonly displayErrors = computed(() => this.errorResolver.resolveAll(this.errors()));

  protected readonly showClear = computed(
    () => this.clearable() && !this.disabled() && !this.readonly() && !this.isEmpty(this.value()),
  );

  /** Apparence effective (input ?? config ?? 'fill'). Sert aux templates : forward à `kt-field` et,
      en outline, pose une sentinelle de placeholder pour la détection « rempli » du label flottant. */
  protected readonly outline = computed(() => (this.appearance() ?? this.config?.appearance ?? 'fill') === 'outline');

  /** Label toujours flotté en outline (input ?? config ?? 'auto'). */
  protected readonly alwaysFloat = computed(
    () => (this.floatLabel() ?? this.config?.floatLabel ?? 'auto') === 'always',
  );

  /** Valeur de l'attribut `placeholder` natif selon l'apparence :
      - fill : le placeholder tel quel ;
      - outline + always : le vrai placeholder (le label est en haut, pas de chevauchement) ;
      - outline + auto : sentinelle `' '` (le label tient lieu de placeholder ; active `:placeholder-shown`). */
  protected readonly placeholderAttr = computed<string | null>(() => {
    if (!this.outline()) return this.placeholder() ?? null;
    if (this.alwaysFloat()) return this.placeholder() ?? null;
    return this.placeholder() ?? ' ';
  });

  protected asTemplate(value: string | TemplateRef<unknown> | undefined): TemplateRef<unknown> | null {
    return value instanceof TemplateRef ? value : null;
  }

  protected asText(value: string | TemplateRef<unknown> | undefined): string | null {
    return typeof value === 'string' ? value : null;
  }

  protected onInput(event: Event): void {
    this.value.set(this.parse((event.target as HTMLInputElement | HTMLTextAreaElement).value));
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.showClear()) {
      event.preventDefault();
      this.clear();
    }
  }

  /** Focus le contrôle natif (utilisé par Signal Forms `focusBoundControl`). */
  focus(options?: FocusOptions): void {
    this.inputRef()?.nativeElement.focus(options);
  }

  /** Ré-aligne le texte affiché sur la valeur courante (utilisé par Signal Forms `reset`). */
  reset(): void {
    const el = this.inputRef()?.nativeElement;
    if (el) el.value = this.displayValue();
  }

  /** Représentation texte de la valeur pour l'input natif. Surchargeable par sous-classe. */
  protected displayValue(): string {
    const v = this.value();
    return v == null ? '' : String(v);
  }

  protected clear(): void {
    this.value.set(this.emptyValue());
    this.touched.set(true);
    this.focus();
  }

  /** Parse la saisie brute en valeur typée. */
  protected abstract parse(raw: string): T;
  /** Représentation « vide » de la valeur. */
  protected abstract emptyValue(): T;
  /** La valeur est-elle vide (affichage du bouton d'effacement) ? */
  protected abstract isEmpty(value: T): boolean;
}
