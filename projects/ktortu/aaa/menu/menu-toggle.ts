import {
  Directive,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  InjectionToken,
  isDevMode,
  model,
} from '@angular/core';
import { MenuItem as AriaMenuItem } from '@angular/aria/menu';

/**
 * Items de menu À ÉTAT (checkbox / radio).
 *
 * Pourquoi ces directives existent : `@angular/aria` accepte bien `role="menuitemcheckbox"` /
 * `"menuitemradio"` sur `[ngMenuItem]`, MAIS NE POSE JAMAIS `aria-checked` — son pattern se
 * contente d'émettre `itemSelected(value)`. Sans `aria-checked`, l'item coché est MUET pour les
 * lecteurs d'écran (échec WCAG 4.1.2). Ces directives comblent ce trou : elles possèdent l'état
 * coché, le bindent en `aria-checked`, et le basculent à l'activation (clic / Entrée / Espace).
 *
 * Elles ne touchent pas au `role` (laissé à l'input `role` d'aria, posé par le consommateur) pour
 * éviter tout conflit de binding sur `[attr.role]` ; la démo montre l'usage `role="menuitemradio"`.
 */

/**
 * Activation commune : clic ET clavier (Entrée / Espace). Les deux liaisons coexistent VOLONTAIREMENT
 * pour supporter un hôte non-`<button>` (ex. `<div ngMenuItem>`), où le clavier n'émet pas de `click`
 * natif. Sur un `<button>`, `activate()` appelle `event.preventDefault()` sur le `keydown`, ce qui
 * neutralise le `click` synthétique → une seule bascule (pas de double-toggle). Couvert en E2E.
 */
const ACTIVATION_HOST = {
  '(click)': 'activate($event)',
  '(keydown.enter)': 'activate($event)',
  '(keydown.space)': 'activate($event)',
} as const;

/**
 * `[ktMenuItemCheckbox]` — case à cocher de menu (bascule indépendante). À poser sur un
 * `[ngMenuItem] role="menuitemcheckbox"`. Bind `aria-checked` et bascule `checked` à l'activation.
 *
 * @example
 * ```html
 * <button ngMenuItem ktMenuItem ktMenuItemCheckbox role="menuitemcheckbox" [(checked)]="wrap">
 *   Retour à la ligne
 * </button>
 * ```
 */
@Directive({
  selector: '[ktMenuItemCheckbox]',
  host: {
    ...ACTIVATION_HOST,
    '[attr.aria-checked]': 'checked()',
  },
})
export class KtMenuItemCheckbox {
  private readonly ariaItem = inject(AriaMenuItem, { self: true, optional: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /**
   * État coché, bidirectionnel : `[(checked)]`.
   * @default false
   */
  readonly checked = model<boolean>(false);

  constructor() {
    // Garde-fou dev : sans `role="menuitemcheckbox"`, `aria-checked` est ignoré → item muet pour les SR.
    afterNextRender(() => {
      if (!isDevMode() || this.host.getAttribute('role') === 'menuitemcheckbox') return;
      console.warn(
        '[ktMenuItemCheckbox] attend `role="menuitemcheckbox"` sur l’hôte, sinon `aria-checked` est inopérant.',
      );
    });
  }

  protected activate(event: Event): void {
    if (this.ariaItem?.disabled()) return;
    if (event.type === 'keydown') {
      event.preventDefault();
    }
    this.checked.update((v) => !v);
  }
}

/** Source de la valeur sélectionnée d'un groupe radio, exposée aux `[ktMenuItemRadio]` enfants. */
export const KT_MENU_RADIO_GROUP = new InjectionToken<KtMenuRadioGroup<unknown>>('KT_MENU_RADIO_GROUP');

/**
 * `[ktMenuRadioGroup]` — coordinateur d'un groupe d'items radio mutuellement exclusifs. À poser sur
 * un conteneur englobant les `[ktMenuItemRadio]` (typiquement un `role="group"`). Détient la valeur
 * sélectionnée ; chaque radio s'y compare pour son `aria-checked` et la met à jour à l'activation.
 *
 * @example
 * ```html
 * <div role="group" ktMenuRadioGroup [(value)]="sortBy" aria-label="Trier par">
 *   <button ngMenuItem ktMenuItem ktMenuItemRadio role="menuitemradio" [value]="'name'">Nom</button>
 *   <button ngMenuItem ktMenuItem ktMenuItemRadio role="menuitemradio" [value]="'date'">Date</button>
 * </div>
 * ```
 */
@Directive({
  selector: '[ktMenuRadioGroup]',
  exportAs: 'ktMenuRadioGroup',
  providers: [{ provide: KT_MENU_RADIO_GROUP, useExisting: KtMenuRadioGroup }],
})
export class KtMenuRadioGroup<V> {
  /**
   * Valeur sélectionnée du groupe, bidirectionnelle : `[(value)]`.
   * @default null
   */
  readonly value = model<V | null>(null);
}

/**
 * `[ktMenuItemRadio]` — bouton radio de menu. À poser sur un `[ngMenuItem] role="menuitemradio"`
 * dans un `[ktMenuRadioGroup]`. `aria-checked` reflète l'égalité avec la valeur du groupe ;
 * l'activation sélectionne cette valeur.
 *
 * @example
 * ```html
 * <button ngMenuItem ktMenuItem ktMenuItemRadio role="menuitemradio" [value]="'name'">Trier par nom</button>
 * ```
 */
@Directive({
  selector: '[ktMenuItemRadio]',
  host: {
    ...ACTIVATION_HOST,
    '[attr.aria-checked]': 'checked()',
  },
})
export class KtMenuItemRadio<V> {
  private readonly ariaItem = inject(AriaMenuItem, { self: true, optional: true });
  private readonly group = inject<KtMenuRadioGroup<V>>(KT_MENU_RADIO_GROUP, { optional: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Valeur portée par ce radio (comparée à celle du groupe). @default (requis) */
  readonly value = input.required<V>();

  protected readonly checked = computed(() => this.group?.value() === this.value());

  constructor() {
    // Garde-fou dev : sans [ktMenuRadioGroup] parent, aria-checked reste figé (item muet pour les SR).
    if (isDevMode() && !this.group) {
      console.warn(
        '[ktMenuItemRadio] doit être placé dans un [ktMenuRadioGroup] : ' +
          'sans groupe, la sélection et `aria-checked` restent inopérants.',
      );
    }
    // Garde-fou dev : sans `role="menuitemradio"`, `aria-checked` est ignoré → item muet pour les SR.
    afterNextRender(() => {
      if (!isDevMode() || this.host.getAttribute('role') === 'menuitemradio') return;
      console.warn('[ktMenuItemRadio] attend `role="menuitemradio"` sur l’hôte, sinon `aria-checked` est inopérant.');
    });
  }

  protected activate(event: Event): void {
    if (this.ariaItem?.disabled()) return;
    if (event.type === 'keydown') {
      event.preventDefault();
    }
    this.group?.value.set(this.value());
  }
}
