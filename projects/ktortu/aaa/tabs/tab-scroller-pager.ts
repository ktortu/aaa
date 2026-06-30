import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  afterNextRender,
  computed,
  contentChild,
  inject,
  input,
  signal,
} from '@angular/core';

import { KtButton } from '@ktortu/aaa/button';
import { KtTabScroller } from './tab-scroller';
import { KT_TABS_CONFIG } from './tabs-config';

/**
 * Composant clé-en-main : enveloppe une liste d'onglets `@angular/aria/tabs` débordante de deux
 * **chevrons de pagination** accessibles (style Material). Il ne contient aucune logique propre :
 * il lit l'état réactif de la directive headless {@link KtTabScroller} (à poser sur le `ngTabList`
 * projeté) et câble deux boutons {@link KtButton}.
 *
 * @example
 * ```html
 * <kt-tab-scroller>
 *   <ul ngTabList ktTabScroller [(selectedTab)]="tab">
 *     @for (t of tabs; track t) { <li ngTab [value]="t">…</li> }
 *   </ul>
 * </kt-tab-scroller>
 * ```
 */
@Component({
  selector: 'kt-tab-scroller',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KtButton],
  host: {
    '[attr.data-orientation]': 'scroller().orientation()',
    '[attr.data-overflowing]': 'scroller().overflowing() ? "" : null',
  },
  template: `
    <button
      ktButton
      type="button"
      mode="text"
      iconOnly
      class="kt-tab-scroller__chevron kt-tab-scroller__chevron--start"
      [icon]="startIcon()"
      [ariaLabel]="previousLabel()"
      [disabled]="!scroller().canScrollStart()"
      (click)="scroller().scrollByPage('start')"
    ></button>

    <div class="kt-tab-scroller__viewport">
      <ng-content select="[ngTabList]" />
    </div>

    <button
      ktButton
      type="button"
      mode="text"
      iconOnly
      class="kt-tab-scroller__chevron kt-tab-scroller__chevron--end"
      [icon]="endIcon()"
      [ariaLabel]="nextLabel()"
      [disabled]="!scroller().canScrollEnd()"
      (click)="scroller().scrollByPage('end')"
    ></button>
  `,
})
export class KtTabScrollerPager {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly doc = inject(DOCUMENT);

  /** Défauts d'app (provider global `KT_TABS_CONFIG`) ; les inputs ci-dessous priment dessus. */
  private readonly config = inject(KT_TABS_CONFIG, { optional: true });

  /** La directive headless posée sur le `ngTabList` projeté (`descendants` car dans le viewport). */
  protected readonly scroller = contentChild.required(KtTabScroller, { descendants: true });

  /** Sens de lecture (figé au montage : le RTL inverse les chevrons gauche/droite). */
  private readonly dir = signal<'ltr' | 'rtl'>('ltr');

  protected readonly startIcon = computed(() => {
    if (this.scroller().orientation() === 'vertical') return 'expand_less';
    return this.dir() === 'rtl' ? 'chevron_right' : 'chevron_left';
  });
  protected readonly endIcon = computed(() => {
    if (this.scroller().orientation() === 'vertical') return 'expand_more';
    return this.dir() === 'rtl' ? 'chevron_left' : 'chevron_right';
  });

  /**
   * Noms accessibles des chevrons (`aria-label`). Résolution `input ?? KT_TABS_CONFIG ?? défaut`,
   * comme partout dans la lib (cf. `KT_FIELD_CONFIG`/`KT_CHIPS_CONFIG`). Défauts en anglais : lib
   * neutre i18n, les textes sont fournis par le consommateur (provider global ou binding).
   */
  /**
   * `aria-label` du chevron « onglets précédents ».
   * @default config.previousLabel ?? 'Previous tabs'
   */
  readonly previousLabel = input(this.config?.previousLabel ?? 'Previous tabs');
  /**
   * `aria-label` du chevron « onglets suivants ».
   * @default config.nextLabel ?? 'Next tabs'
   */
  readonly nextLabel = input(this.config?.nextLabel ?? 'Next tabs');

  constructor() {
    afterNextRender(() => {
      if (this.doc.defaultView?.getComputedStyle(this.host).direction === 'rtl') this.dir.set('rtl');
    });
  }
}
