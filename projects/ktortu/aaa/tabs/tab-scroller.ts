import {
  Directive,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  computed,
  inject,
  signal,
} from '@angular/core';
import { TabList } from '@angular/aria/tabs';

/** Cible de défilement calculée en phase de lecture, appliquée en phase d'écriture. */
interface ScrollTarget {
  axis: 'left' | 'top';
  value: number;
}

/** Métriques de débordement de la liste d'onglets, mesurées de façon impérative. */
interface ScrollMetrics {
  /** Reste-t-il du contenu hors-champ côté début (gauche en LTR / droite en RTL ; haut si vertical) ? */
  canStart: boolean;
  /** Reste-t-il du contenu hors-champ côté fin ? */
  canEnd: boolean;
  /** La liste déborde-t-elle (taille de défilement > taille visible) ? */
  overflowing: boolean;
  /** Axe courant. */
  vertical: boolean;
}

const EMPTY_METRICS: ScrollMetrics = { canStart: false, canEnd: false, overflowing: false, vertical: false };

/** Tolérance d'1px : arrondis sub-pixel, zoom navigateur. */
const EPS = 1;

/** Fraction de la zone visible parcourue par un « page » de pagination (chevauchement d'un onglet). */
const PAGE_RATIO = 0.8;

/**
 * Pilote le **débordement** d'une liste d'onglets `@angular/aria/tabs` (cf. tabs.css). Deux rôles :
 *
 * 1. **Scroll-into-view** : amène l'onglet sélectionné dans la vue au montage et lors d'un changement
 *    de sélection programmatique (ce que le CSS seul ne fait pas), en respectant `prefers-reduced-motion`.
 * 2. **Pagination** : expose un état réactif (`canScrollStart()`, `canScrollEnd()`, `overflowing()`,
 *    `orientation()`) et une méthode `scrollByPage()`, pour brancher des boutons chevrons (cf. le
 *    composant clé-en-main `KtTabScrollerPager`, ou des boutons custom via `exportAs: 'ktTabScroller'`).
 *
 * Opt-in, à poser sur `[ngTabList]` :
 *
 * @example
 * ```html
 * <ul ngTabList ktTabScroller #s="ktTabScroller" [(selectedTab)]="tab"> … </ul>
 * <button (click)="s.scrollByPage('start')" [disabled]="!s.canScrollStart()">‹</button>
 * ```
 */
@Directive({
  selector: '[ngTabList][ktTabScroller]',
  exportAs: 'ktTabScroller',
  host: {
    // Marqueur CSS : pagination réactive active → la scrollbar native est masquée (cf. tabs.css).
    '[attr.data-kt-tab-scroller]': '""',
  },
})
export class KtTabScroller {
  private readonly list = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly tabList = inject(TabList);
  private readonly doc = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  /** Préférence « réduire les animations », lue à chaud (absente possible en SSR/jsdom). */
  private readonly reducedMotion = this.doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)');

  /**
   * Métriques de débordement. Mises à jour UNIQUEMENT depuis des callbacks navigateur
   * (`afterNextRender`, `scroll`, `ResizeObserver`, `MutationObserver`) — jamais depuis le corps
   * d'un effet réactif, pour rester conforme (pas d'écriture de signal dans un effet).
   */
  private readonly metrics = signal<ScrollMetrics>(EMPTY_METRICS);

  /** Reste-t-il du contenu hors-champ côté début (à brancher sur le bouton « précédent ») ? */
  readonly canScrollStart = computed(() => this.metrics().canStart);
  /** Reste-t-il du contenu hors-champ côté fin (à brancher sur le bouton « suivant ») ? */
  readonly canScrollEnd = computed(() => this.metrics().canEnd);
  /** La liste déborde-t-elle ? (utile pour masquer toute la barre de pagination). */
  readonly overflowing = computed(() => this.metrics().overflowing);
  /** Axe courant, dérivé de l'orientation `@angular/aria`. */
  readonly orientation = computed<'horizontal' | 'vertical'>(() =>
    this.metrics().vertical ? 'vertical' : 'horizontal',
  );

  constructor() {
    // 1. Scroll-into-view (phasé : mesure en `earlyRead`, scroll en `write`, pas de reflow forcé).
    //    Le `scrollTo` émet un événement `scroll` → remeasure via le listener (aucun `set` ici).
    afterRenderEffect({
      earlyRead: () => this.computeScrollTarget(),
      write: (target) => {
        const t = target();
        if (!t) return;
        this.list.scrollTo({ [t.axis]: t.value, behavior: this.scrollBehavior() });
      },
    });

    // 2. Mesure initiale + observateurs (browser-only ; `afterNextRender` ne tourne pas en SSR).
    afterNextRender(() => {
      const view = this.doc.defaultView;
      if (!view) return;
      this.remeasure();

      const onScroll = () => this.remeasure();
      this.list.addEventListener('scroll', onScroll, { passive: true });

      // ResizeObserver : viewport ET contenu (les onglets qui changent de largeur). Référencé en
      // global (jamais instancié en SSR puisque dans `afterNextRender`).
      const ro = new ResizeObserver(() => this.remeasure());
      const observeAll = () => {
        ro.disconnect();
        ro.observe(this.list);
        for (const child of Array.from(this.list.children)) ro.observe(child);
      };
      observeAll();

      // MutationObserver : onglets ajoutés/retirés (@for) → re-observer + remeasure.
      const mo = new MutationObserver(() => {
        observeAll();
        this.remeasure();
      });
      mo.observe(this.list, { childList: true });

      this.destroyRef.onDestroy(() => {
        this.list.removeEventListener('scroll', onScroll);
        ro.disconnect();
        mo.disconnect();
      });
    });
  }

  /**
   * Fait défiler d'environ une « page » (≈ {@link PAGE_RATIO} de la zone visible) vers le début ou la
   * fin. `behavior` respecte `prefers-reduced-motion`. Le navigateur sature au min/max ; les boutons
   * câblés sont `disabled` aux extrémités, donc l'appel n'a pas lieu à vide.
   */
  scrollByPage(dir: 'start' | 'end'): void {
    const el = this.list;
    const sign = dir === 'end' ? 1 : -1;
    if (this.metrics().vertical) {
      el.scrollBy({ top: sign * el.clientHeight * PAGE_RATIO, behavior: this.scrollBehavior() });
      return;
    }
    // RTL : le sens d'écriture inverse le signe de `scrollLeft`.
    const rtlSign = this.isRtl() ? -1 : 1;
    el.scrollBy({ left: sign * rtlSign * el.clientWidth * PAGE_RATIO, behavior: this.scrollBehavior() });
  }

  /** Met à jour le signal de métriques. Appelé depuis des callbacks navigateur (jamais un effet). */
  private remeasure(): void {
    this.metrics.set(this.measure());
  }

  /** Mesure le débordement (lecture pure de géométrie, n'écrit rien). */
  private measure(): ScrollMetrics {
    const el = this.list;
    const vertical = this.isVertical();

    if (vertical) {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const max = scrollHeight - clientHeight;
      return { vertical: true, overflowing: max > EPS, canStart: scrollTop > EPS, canEnd: scrollTop < max - EPS };
    }

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const max = scrollWidth - clientWidth;
    const rtl = this.isRtl();
    // Distances logiques indépendantes du signe de `scrollLeft` (négatif en RTL sur les navigateurs récents).
    const fromStart = rtl ? -scrollLeft : scrollLeft;
    const fromEnd = max - Math.abs(scrollLeft);
    return { vertical: false, overflowing: max > EPS, canStart: fromStart > EPS, canEnd: fromEnd > EPS };
  }

  private isVertical(): boolean {
    return (
      this.list.getAttribute('aria-orientation') === 'vertical' || this.list.getAttribute('orientation') === 'vertical'
    );
  }

  private isRtl(): boolean {
    return this.doc.defaultView?.getComputedStyle(this.list).direction === 'rtl';
  }

  /**
   * `auto` si l'utilisateur a demandé à réduire les animations (WCAG 2.3.3 AAA), `smooth` sinon.
   * Passer un `behavior` explicite à `scrollTo`/`scrollBy` écrase la propriété CSS `scroll-behavior`,
   * d'où la nécessité de répliquer ici la décision que le CSS prend via `prefers-reduced-motion`.
   */
  private scrollBehavior(): ScrollBehavior {
    return this.reducedMotion?.matches ? 'auto' : 'smooth';
  }

  /**
   * Calcule l'offset à atteindre pour amener l'onglet actif dans la vue, ou `null` s'il est déjà
   * visible (ou s'il n'y a aucun onglet sélectionné). Lit `selectedTab()` → dépendance réactive.
   */
  private computeScrollTarget(): ScrollTarget | null {
    const selected = this.tabList.findTab(this.tabList.selectedTab())?.element;
    if (!selected) return null;

    const container = this.list;
    const selectedRect = selected.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // En environnement réel de rendu (navigateur), getBoundingClientRect est géométriquement
    // universel (indépendant du signe de scrollLeft, de RTL/LTR et des arrondis subpixel).
    // En jsdom (tests unitaires sans layout), les rectangles sont à 0 -> repli sur offsetLeft/Top.
    const hasLayout =
      selectedRect.width > 0 || selectedRect.height > 0 || selectedRect.left !== 0 || selectedRect.top !== 0;

    if (hasLayout) {
      if (this.isVertical()) {
        if (selectedRect.top < containerRect.top) {
          return { axis: 'top', value: container.scrollTop + (selectedRect.top - containerRect.top) };
        }
        if (selectedRect.bottom > containerRect.bottom) {
          return { axis: 'top', value: container.scrollTop + (selectedRect.bottom - containerRect.bottom) };
        }
        return null;
      }

      if (selectedRect.left < containerRect.left) {
        return { axis: 'left', value: container.scrollLeft + (selectedRect.left - containerRect.left) };
      }
      if (selectedRect.right > containerRect.right) {
        return { axis: 'left', value: container.scrollLeft + (selectedRect.right - containerRect.right) };
      }
      return null;
    }

    if (this.isVertical()) {
      const selectedTop = selected.offsetTop;
      const selectedBottom = selectedTop + selected.offsetHeight;
      const containerTop = container.scrollTop;
      const containerBottom = containerTop + container.clientHeight;

      if (selectedTop < containerTop) return { axis: 'top', value: selectedTop };
      if (selectedBottom > containerBottom) return { axis: 'top', value: selectedBottom - container.clientHeight };
      return null;
    }

    if (this.isRtl()) {
      const selectedStart = container.scrollWidth - (selected.offsetLeft + selected.offsetWidth);
      const selectedEnd = container.scrollWidth - selected.offsetLeft;
      const containerStart = -container.scrollLeft;
      const containerEnd = containerStart + container.clientWidth;

      if (selectedStart < containerStart) return { axis: 'left', value: -selectedStart };
      if (selectedEnd > containerEnd) return { axis: 'left', value: -(selectedEnd - container.clientWidth) };
      return null;
    }

    const selectedLeft = selected.offsetLeft;
    const selectedRight = selectedLeft + selected.offsetWidth;
    const containerLeft = container.scrollLeft;
    const containerRight = containerLeft + container.clientWidth;

    if (selectedLeft < containerLeft) return { axis: 'left', value: selectedLeft };
    if (selectedRight > containerRight) return { axis: 'left', value: selectedRight - container.clientWidth };
    return null;
  }
}
