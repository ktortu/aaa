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
} from '@angular/core';
import { KtRadioGroup } from './radio-group';
import { KtIdGenerator } from '@ktortu/aaa/cdk';

/**
 * Bouton radio individuel (enfant déclaratif de `kt-radio-group`).
 * `<input type="radio">` NATIF partageant le `name` du groupe : clavier (roving + flèches) gratuit.
 * Le libellé suit la même règle que la checkbox : `label` texte par défaut, contenu projeté en
 * override visuel (carte sélectionnable), `ariaLabel` pour le nom accessible d'une option non-textuelle.
 *
 * @example
 * ```html
 * <kt-radio-group label="Civilité" [(value)]="civility">
 *   <kt-radio [optionValue]="'mme'" label="Madame" />
 *   <kt-radio [optionValue]="'m'" label="Monsieur" />
 * </kt-radio-group>
 * ```
 */
@Component({
  selector: 'kt-radio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './radio.css',
  host: {
    '[attr.id]': 'null',
  },
  template: `
    <label class="kt-radio">
      <input
        type="radio"
        class="kt-radio__input"
        [id]="baseId()"
        [name]="group.groupName()"
        [checked]="checked()"
        [disabled]="isDisabled()"
        [attr.aria-label]="ariaLabel() ?? null"
        [attr.aria-describedby]="hint() ? hintId() : null"
        (change)="onChange()"
        (blur)="group.touched.set(true)"
      />
      <span class="kt-radio__label">
        <ng-content>{{ label() }}</ng-content>
      </span>
    </label>

    @if (hint(); as hintText) {
      <p [id]="hintId()" class="kt-radio__hint">{{ hintText }}</p>
    }
  `,
})
export class KtRadio<V> {
  protected readonly group = inject<KtRadioGroup<V>>(KtRadioGroup);

  /** Valeur d'option représentée par ce radio (sélectionnée ⇒ devient la valeur du groupe). Nommée
      `optionValue` pour s'aligner sur `kt-checkbox` (où `value` = état coché). @default (requis) */
  readonly optionValue = input.required<V>();
  /** Texte du libellé (remplacé visuellement par un contenu projeté). @default undefined */
  readonly label = input<string>();
  /** Texte d'aide affiché sous le radio. @default undefined */
  readonly hint = input<string>();
  /** Nom accessible (`aria-label`) pour une option sans libellé textuel. @default undefined */
  readonly ariaLabel = input<string>();
  /** Désactive ce radio (combiné à l'état désactivé du groupe). @default false */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** id imposé (sélecteurs de test stables) ; sinon auto-généré, anti-collision. @default undefined */
  readonly id = input<string>();

  private readonly idGen = inject(KtIdGenerator);
  private readonly uid = this.idGen.generateId('radio');
  protected readonly baseId = computed(() => this.id() ?? `kt-radio-${this.uid}`);
  protected readonly hintId = computed(() => `${this.baseId()}-hint`);

  protected readonly checked = computed(() => this.group.isSelected(this.optionValue()));
  protected readonly isDisabled = computed(() => this.group.disabled() || this.disabled());

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    // Garde-fou a11y (dev, navigateur uniquement) : nom accessible = `label`, `ariaLabel` OU contenu
    // projeté. Sans aucun des trois, le radio est annoncé vide (WCAG 4.1.2).
    afterNextRender(() => {
      if (!isDevMode() || this.label() || this.ariaLabel()) return;
      const labelText = this.el.nativeElement.querySelector('.kt-radio__label')?.textContent?.trim();
      if (!labelText) {
        console.warn(
          '[ktRadio] sans `label`, `ariaLabel` ni contenu projeté : annoncé sans nom accessible (WCAG 4.1.2).',
        );
      }
    });
  }

  protected onChange(): void {
    // Garde défensive : un input natif `disabled` n'émet pas `change`, mais on protège un appel
    // programmatique éventuel (cohérence avec switch/checkbox qui gardent leur commit).
    if (this.isDisabled()) return;
    this.group.select(this.optionValue());
  }
}
