import { Directive, TemplateRef, inject, input } from '@angular/core';

/** Contexte typé reçu par le template d'une option (`ktSelectOption`). */
export interface KtSelectOptionContext<T> {
  /** L'option en cours de rendu → `let-option`. */
  $implicit: T;
  /** L'option est-elle sélectionnée ? → `let-selected="selected"`. */
  selected: boolean;
  /** L'option est-elle active (survol/clavier) ? → `let-active="active"`. */
  active: boolean;
}

/** Contexte typé reçu par le template du trigger (`ktSelectTrigger`). */
export interface KtSelectTriggerContext<T> {
  /** L'option sélectionnée (ou `null`) → `let-option`. */
  $implicit: T | null;
}

/** Template de rendu d'une option, posé sur un `<ng-template>` projeté dans `kt-select`.
    L'input sert UNIQUEMENT à inférer `T` (re-bind de la liste d'options) ; `ngTemplateContextGuard`
    type alors les variables `let-` (`option: T`, `selected`/`active: boolean`). Requiert `strictTemplates`.

    ```html
    <kt-select [options]="users" optionLabel="name">
      <ng-template [ktSelectOption]="users" let-user let-selected="selected">
        <user-badge [user]="user" /> @if (selected) { ✓ }
      </ng-template>
    </kt-select>
    ``` */
@Directive({ selector: 'ng-template[ktSelectOption]' })
export class KtSelectOptionDef<T> {
  readonly ktSelectOption = input.required<readonly T[]>();
  readonly template = inject<TemplateRef<KtSelectOptionContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(_dir: KtSelectOptionDef<T>, ctx: unknown): ctx is KtSelectOptionContext<T> {
    return typeof ctx === 'object';
  }
}

/** Template de rendu du trigger (libellé de la valeur courante). Même mécanisme typé que `ktSelectOption`.
    Contexte : `let-option` = l'option sélectionnée (`T | null`).

    ```html
    <kt-select [options]="users" [(value)]="selected">
      <ng-template [ktSelectTrigger]="users" let-user>
        @if (user) { <user-badge [user]="user" /> } @else { Choisir… }
      </ng-template>
    </kt-select>
    ``` */
@Directive({ selector: 'ng-template[ktSelectTrigger]' })
export class KtSelectTriggerDef<T> {
  readonly ktSelectTrigger = input.required<readonly T[]>();
  readonly template = inject<TemplateRef<KtSelectTriggerContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(_dir: KtSelectTriggerDef<T>, ctx: unknown): ctx is KtSelectTriggerContext<T> {
    return typeof ctx === 'object';
  }
}
