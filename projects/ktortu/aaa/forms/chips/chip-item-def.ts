import { Directive, TemplateRef, inject, input } from '@angular/core';

/** Contexte typé reçu par le template d'un chip custom (`ktChipItem`). */
export interface KtChipItemContext<T> {
  /** L'item en cours de rendu → `let-item`. */
  $implicit: T;
  /** Fonction pour retirer cet item de la liste → `let-remove="remove"`. */
  remove: () => void;
}

/** Template de rendu custom d'un chip dans `kt-chip-list`.
    Structurellement compatible avec `MultiSelectChipContext` (forwardable).
    Contexte : `let-item` = l'item rendu (`T`), `let-remove` = fonction qui le retire.

    ```html
    <kt-chip-list [items]="tags">
      <ng-template [ktChipItem]="tags" let-tag let-remove="remove">
        <kt-chip [removable]="true" (remove)="remove()">{{ tag.name }}</kt-chip>
      </ng-template>
    </kt-chip-list>
    ``` */
@Directive({ selector: 'ng-template[ktChipItem]' })
export class KtChipItemDef<T> {
  /** Liste des items rendus par ce template (sert aussi à inférer le type `T` du contexte). */
  readonly ktChipItem = input.required<readonly T[]>();
  readonly template = inject<TemplateRef<KtChipItemContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(_dir: KtChipItemDef<T>, ctx: unknown): ctx is KtChipItemContext<T> {
    return typeof ctx === 'object';
  }
}
