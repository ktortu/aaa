import { Directive, TemplateRef, inject, input } from '@angular/core';

/** Contexte typé reçu par le template d'une option (`ktMultiSelectOption`). */
export interface KtMultiSelectOptionContext<T> {
  /** L'option en cours de rendu → `let-option`. */
  $implicit: T;
  /** L'option est-elle sélectionnée ? → `let-selected="selected"`. */
  selected: boolean;
  /** L'option est-elle active (survol/clavier) ? → `let-active="active"`. */
  active: boolean;
}

/** Contexte typé reçu par le template du trigger (`ktMultiSelectTrigger`). */
export interface KtMultiSelectTriggerContext<T> {
  /** Les options sélectionnées (tableau d'objets) → `let-options`. */
  $implicit: readonly T[];
}

/** Contexte typé reçu par le template de chip (`ktMultiSelectChip`). */
export interface KtMultiSelectChipContext<T> {
  /** L'option sélectionnée correspondante → `let-option`. */
  $implicit: T;
  /** Fonction pour retirer cet élément de la sélection → `let-remove="remove"`. */
  remove: () => void;
}

/** Template de rendu d'une option dans la liste du multi-select. L'input sert à inférer `T` ;
    `ngTemplateContextGuard` type les variables `let-`.
    Contexte : `let-option` = l'option (`T`), `let-selected` / `let-active` = booléens.

    ```html
    <kt-multi-select [options]="tags">
      <ng-template [ktMultiSelectOption]="tags" let-tag let-selected="selected">
        <tag-badge [tag]="tag" /> @if (selected) { ✓ }
      </ng-template>
    </kt-multi-select>
    ``` */
@Directive({ selector: 'ng-template[ktMultiSelectOption]' })
export class KtMultiSelectOptionDef<T> {
  readonly ktMultiSelectOption = input.required<readonly T[]>();
  readonly template = inject<TemplateRef<KtMultiSelectOptionContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _dir: KtMultiSelectOptionDef<T>,
    ctx: unknown,
  ): ctx is KtMultiSelectOptionContext<T> {
    return typeof ctx === 'object';
  }
}

/** Template de rendu du trigger (contenu du bouton déclencheur) pour le multi-select.
    Contexte : `let-options` = le tableau des options sélectionnées (`readonly T[]`).

    ```html
    <kt-multi-select [options]="tags">
      <ng-template [ktMultiSelectTrigger]="tags" let-options>
        @if (options.length) { {{ options.length }} sélectionné(s) } @else { Choisir… }
      </ng-template>
    </kt-multi-select>
    ``` */
@Directive({ selector: 'ng-template[ktMultiSelectTrigger]' })
export class KtMultiSelectTriggerDef<T> {
  readonly ktMultiSelectTrigger = input.required<readonly T[]>();
  readonly template = inject<TemplateRef<KtMultiSelectTriggerContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _dir: KtMultiSelectTriggerDef<T>,
    ctx: unknown,
  ): ctx is KtMultiSelectTriggerContext<T> {
    return typeof ctx === 'object';
  }
}

/** Template de rendu d'un jeton (chip) affiché sous le multi-select.
    Contexte : `let-option` = l'option sélectionnée (`T`), `let-remove` = fonction qui la retire.

    ```html
    <kt-multi-select [options]="tags">
      <ng-template [ktMultiSelectChip]="tags" let-tag let-remove="remove">
        <kt-chip [removable]="true" (remove)="remove()">{{ tag.name }}</kt-chip>
      </ng-template>
    </kt-multi-select>
    ``` */
@Directive({ selector: 'ng-template[ktMultiSelectChip]' })
export class KtMultiSelectChipDef<T> {
  readonly ktMultiSelectChip = input.required<readonly T[]>();
  readonly template = inject<TemplateRef<KtMultiSelectChipContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(_dir: KtMultiSelectChipDef<T>, ctx: unknown): ctx is KtMultiSelectChipContext<T> {
    return typeof ctx === 'object';
  }
}
