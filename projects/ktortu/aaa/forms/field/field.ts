import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  booleanAttribute,
  computed,
  contentChild,
  forwardRef,
  inject,
  input,
  output,
} from '@angular/core';
import { KtFieldControl } from './field-control';
import {
  KT_FIELD_CONFIG,
  KT_FIELD,
  type KtFieldParent,
  type KtFieldAppearance,
  type KtFloatLabel,
} from './field-config';
import { KtTooltip } from '@ktortu/aaa/tooltip';
import { KtIdGenerator } from '@ktortu/aaa/cdk';

/** Forme minimale d'une erreur affichable — découple `Field` de Signal Forms. */
export interface KtFieldError {
  /** Identifiant du type d'erreur (ex. `'required'`, `'email'`). */
  kind: string;
  /** Message lisible affiché à l'utilisateur (optionnel). */
  message?: string;
}

/** Chrome de champ agnostique du système de forms : label + contrôle projeté + hint + erreur,
    et centralisation du câblage a11y. Nourri par des inputs simples.

    @example
    ```html
    <kt-field label="E-mail" hint="Nous ne partagerons jamais votre adresse." [invalid]="emailInvalid()" [errors]="emailErrors()" required>
      <input ktFieldControl type="email" [(ngModel)]="email" />
    </kt-field>
    ``` */
@Component({
  selector: 'kt-field',
  imports: [KtTooltip, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './field.css',
  templateUrl: './field.html',
  host: {
    '[attr.data-appearance]': 'resolvedAppearance()',
    '[attr.data-float-label]': 'resolvedFloatLabel()',
  },
  providers: [{ provide: KT_FIELD, useExisting: forwardRef(() => KtField) }],
})
export class KtField implements KtFieldParent {
  private readonly config = inject(KT_FIELD_CONFIG, { optional: true });

  /** Libellé du champ. @default undefined */
  readonly label = input<string>();
  /** Texte d'aide affiché sous le contrôle. @default undefined */
  readonly hint = input<string>();
  /** Contenu de l'aide contextuelle (texte ou `TemplateRef`) rendu dans le tooltip d'aide. @default undefined */
  readonly helpText = input<string | TemplateRef<unknown>>();
  /** Libellé accessible du déclencheur d'aide. @default KT_FIELD_CONFIG.helpLabel ?? 'Help' */
  readonly helpLabel = input<string>(this.config?.helpLabel ?? 'Help');
  /** id(s) externe(s) à ajouter à l'`aria-describedby` du contrôle (découplage). @default undefined */
  readonly customDescribedBy = input<string>();
  /** Émis au clic sur le déclencheur d'aide (le `preventDefault`/`stopPropagation` est déjà appliqué). */
  readonly helpClick = output<MouseEvent>();
  /** Erreurs de validation à afficher sous le contrôle. @default [] */
  readonly errors = input<readonly KtFieldError[]>([]);
  /** Marque le champ comme invalide (pose `aria-invalid` et conditionne l'affichage des erreurs). @default false */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Affiche l'astérisque requis et pose `aria-required` sur le contrôle. @default false */
  readonly required = input(false, { transform: booleanAttribute });
  /** id imposé (sélecteurs de test stables) ; sinon auto-généré, anti-collision. @default undefined */
  readonly fieldId = input<string>();
  /** Masquer le hint quand l'erreur s'affiche (façon Material). @default KT_FIELD_CONFIG.hideHintWhenInvalid ?? false */
  readonly hideHintWhenInvalid = input<boolean, unknown>(this.config?.hideHintWhenInvalid ?? false, {
    transform: booleanAttribute,
  });
  /** Afficher toutes les erreurs au lieu de la première seule. @default KT_FIELD_CONFIG.showAllErrors ?? false */
  readonly showAllErrors = input<boolean, unknown>(this.config?.showAllErrors ?? false, {
    transform: booleanAttribute,
  });
  /** Apparence du chrome : `fill` (label au-dessus) ou `outline` (bordure + label flottant, façon
      Material). Non fournie ⇒ valeur du `KT_FIELD_CONFIG`, sinon `'fill'`. @default undefined */
  readonly appearance = input<KtFieldAppearance>();

  /** Apparence effective : input ?? KT_FIELD_CONFIG.appearance ?? 'fill'. */
  protected readonly resolvedAppearance = computed<KtFieldAppearance>(
    () => this.appearance() ?? this.config?.appearance ?? 'fill',
  );

  /** Politique du label flottant (outline) : `auto` (flotte au focus/rempli) ou `always` (toujours
      flotté, même vide). Non fournie ⇒ valeur du `KT_FIELD_CONFIG`, sinon `'auto'`. @default undefined */
  readonly floatLabel = input<KtFloatLabel>();

  /** Politique effective : input ?? KT_FIELD_CONFIG.floatLabel ?? 'auto'. */
  protected readonly resolvedFloatLabel = computed<KtFloatLabel>(
    () => this.floatLabel() ?? this.config?.floatLabel ?? 'auto',
  );

  // Le contrôle est projeté : l'injection DI ne le traverse pas, on le cible via contentChild.
  private readonly control = contentChild(KtFieldControl);

  private readonly idGen = inject(KtIdGenerator);
  private readonly uid = this.idGen.generateId('field');
  readonly baseId = computed(() => this.fieldId() ?? `kt-field-${this.uid}`);
  protected readonly labelId = computed(() => `${this.baseId()}-label`);
  protected readonly hintId = computed(() => `${this.baseId()}-hint`);
  protected readonly errorId = computed(() => `${this.baseId()}-error`);
  protected readonly helpId = computed(() => `${this.baseId()}-help`);

  // `helpText` accepte texte simple OU TemplateRef : on sépare les deux pour la copie cachée (a11y).
  protected readonly helpTemplate = computed(() => {
    const help = this.helpText();
    return help instanceof TemplateRef ? help : null;
  });
  protected readonly helpString = computed(() => {
    const help = this.helpText();
    return typeof help === 'string' ? help : null;
  });
  // Aide réellement signifiante : texte non blanc, ou TemplateRef. Un texte vide/blanc rend le
  // bouton d'aide (DX) mais ne doit PAS être référencé par aria-describedby (rien à annoncer).
  protected readonly hasHelp = computed(() => {
    const help = this.helpText();
    if (help == null) return false;
    return typeof help === 'string' ? help.trim().length > 0 : true;
  });

  protected readonly hasError = computed(() => this.invalid() && this.errors().length > 0);

  // Hint visible sauf s'il est masqué en erreur (option façon Material).
  protected readonly showHint = computed(() => !!this.hint() && !(this.hideHintWhenInvalid() && this.invalid()));

  // Première erreur seule par défaut ; toutes si showAllErrors.
  protected readonly displayedErrors = computed(() =>
    this.showAllErrors() ? this.errors() : this.errors().slice(0, 1),
  );

  readonly describedBy = computed(() => {
    const ids: string[] = [];
    if (this.showHint()) ids.push(this.hintId());
    if (this.hasError()) ids.push(this.errorId());

    // Aide contextuelle : référence une copie TOUJOURS présente (visually-hidden) du texte d'aide.
    // Le tooltip visuel n'est créé dans le DOM qu'à l'affichage ; cette copie garantit que les
    // technologies d'assistance trouvent toujours la description, sans référence pendante.
    if (this.hasHelp()) ids.push(this.helpId());

    // Ajout de l'ID personnalisé externe (decouplage complet)
    const custom = this.customDescribedBy();
    if (custom) ids.push(custom);

    return ids.length ? ids.join(' ') : null;
  });

  protected onHelpClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.helpClick.emit(event);
  }
}
