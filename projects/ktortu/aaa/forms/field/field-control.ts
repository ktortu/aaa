import { Directive, ElementRef, computed, inject } from '@angular/core';
import { KT_FIELD } from './field-config';

/** Marque le contrôle (natif ou custom) d'un champ pour que `Field` y câble l'a11y
    (id, aria-describedby, aria-invalid, aria-required).

    @example
    ```html
    <kt-field label="E-mail" [invalid]="invalid()" [errors]="errors()">
      <input ktFieldControl type="email" [(ngModel)]="email" />
    </kt-field>
    ``` */
@Directive({
  selector: '[ktFieldControl]',
  host: {
    // `[attr.id]` (et non `[id]`) : quand le contrôle est orphelin (pas de parent KtField), `id()`
    // vaut null et l'attribut doit DISPARAÎTRE — un binding de propriété poserait `id="null"`.
    '[attr.id]': 'id()',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-invalid]': 'invalid() ? "true" : null',
    '[attr.aria-required]': 'required() ? "true" : null',
  },
})
export class KtFieldControl {
  private readonly parent = inject(KT_FIELD, { optional: true });

  protected readonly id = computed(() => this.parent?.baseId() ?? null);
  protected readonly describedBy = computed(() => this.parent?.describedBy() ?? null);
  protected readonly invalid = computed(() => this.parent?.invalid() ?? false);
  protected readonly required = computed(() => this.parent?.required() ?? false);

  /** Élément DOM hôte du contrôle (exposé pour le focus / la mesure par le parent). */
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
}
