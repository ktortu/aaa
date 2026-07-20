import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Directive,
  ElementRef,
  EmbeddedViewRef,
  InjectionToken,
  OnDestroy,
  Provider,
  Renderer2,
  TemplateRef,
  ViewContainerRef,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  isDevMode,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { KtIdGenerator } from '@ktortu/aaa/cdk';

export type KtTooltipPosition = 'top' | 'bottom' | 'left' | 'right';

/** Défauts d'infobulle (délais, position) injectables via `provideKtTooltip` / `KT_TOOLTIP_CONFIG`. */
export interface KtTooltipConfig {
  /** Délai (ms) avant apparition au survol/focus. */
  showDelay: number;
  /** Délai (ms) avant masquage (laisse le temps d'atteindre l'infobulle, WCAG « hoverable »). */
  hideDelay: number;
  /** Position de l'infobulle autour de la cible. */
  position: KtTooltipPosition;
}

export const KT_TOOLTIP_CONFIG = new InjectionToken<Partial<KtTooltipConfig>>('KT_TOOLTIP_CONFIG');

/**
 * Fournit des défauts d'infobulle (délais, position) pour un sous-arbre ou l'application entière.
 *
 * @example
 * ```ts
 * providers: [provideKtTooltip({ showDelay: 300, position: 'bottom' })]
 * ```
 */
export function provideKtTooltip(config: Partial<KtTooltipConfig>): Provider {
  return { provide: KT_TOOLTIP_CONFIG, useValue: config };
}

/**
 * Infobulle accessible posée sur n'importe quel élément focusable/survolable.
 * Apparaît au survol et au focus, reste « hoverable » (WCAG 1.4.13) et se ferme
 * par Échap. Le contenu peut être un texte simple ou un `TemplateRef` **non interactif**
 * (un `role="tooltip"` ne doit pas contenir de lien/bouton/champ).
 *
 * @example
 * ```html
 * <button ktTooltip="Enregistrer le brouillon">Enregistrer</button>
 * <span ktTooltip="Aide" tooltipPosition="right" [showDelay]="300">?</span>
 * ```
 */
@Directive({
  selector: '[ktTooltip]',
  host: {
    '[attr.aria-describedby]': 'describedById()',
    '(mouseenter)': 'show()',
    '(mouseleave)': 'hide()',
    '(focusin)': 'show()',
    '(focusout)': 'hide()',
    '(pointerdown)': 'onActivate()',
    '(keydown.escape)': 'onEscape($event)',
  },
})
export class KtTooltip implements OnDestroy {
  private readonly config = inject(KT_TOOLTIP_CONFIG, { optional: true });
  private readonly doc = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly vcr = inject(ViewContainerRef);
  private readonly platformId = inject(PLATFORM_ID);

  /** Contenu de l'infobulle : texte simple (injecté en `textContent`) ou `TemplateRef` non interactif. */
  readonly ktTooltip = input.required<string | TemplateRef<unknown>>();
  /** Position de l'infobulle autour de la cible. @default 'top' (ou KT_TOOLTIP_CONFIG.position) */
  readonly tooltipPosition = input<KtTooltipPosition>(this.config?.position ?? 'top');
  /** Désactive l'affichage de l'infobulle. @default false */
  readonly tooltipDisabled = input<boolean, unknown>(false, { transform: booleanAttribute });
  /** Délai (ms) avant apparition au survol/focus. @default 150 (ou KT_TOOLTIP_CONFIG.showDelay) */
  readonly showDelay = input<number>(this.config?.showDelay ?? 150);
  /** Délai (ms) avant masquage ; laisse le temps d'amener le pointeur sur l'infobulle (WCAG « hoverable »). @default 100 (ou KT_TOOLTIP_CONFIG.hideDelay) */
  readonly hideDelay = input<number>(this.config?.hideDelay ?? 100);

  private readonly idGen = inject(KtIdGenerator);
  private readonly uid = this.idGen.generateId('tooltip');
  private readonly tooltipId = `kt-tooltip-${this.uid}`;
  /** Id du noeud `role="tooltip"`. Public : sert aux liaisons d'accessibilité (`aria-describedby`) du déclencheur. */
  readonly idForA11y = this.tooltipId;
  private readonly anchorName = `--kt-tooltip-anchor-${this.uid}`;

  /** Vrai quand l'infobulle est susceptible de s'afficher (contenu non vide et non désactivée).
      Public : lu par `KtField` pour câbler `aria-describedby` du contrôle sur l'infobulle d'aide. */
  readonly isActive = computed(() => {
    if (this.tooltipDisabled()) return false;

    const content = this.ktTooltip();
    if (typeof content === 'string') return content.trim().length > 0;
    return true;
  });

  // Retourner null retire l'attribut (même astuce que aria-disabled dans button).
  // aria-describedby n'est posé sur le déclencheur que lorsque le tooltip est affiché : sinon il
  // référencerait un nœud absent du DOM (création lazy), donnant une référence pendante aux AT.
  protected describedById = computed(() => (this.isActive() && this.isShown() ? this.tooltipId : null));

  private tip: HTMLElement | null = null;
  private view: EmbeddedViewRef<unknown> | null = null;
  private listeners: (() => void)[] = [];
  private showTimer: ReturnType<typeof setTimeout> | undefined;
  private hideTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly isShown = signal(false);
  private _supportsAnchor: boolean | null = null;
  private get supportsAnchor(): boolean {
    if (this._supportsAnchor === null) {
      this._supportsAnchor =
        isPlatformBrowser(this.platformId) &&
        typeof CSS !== 'undefined' &&
        typeof CSS.supports === 'function' &&
        CSS.supports('anchor-name: --x');
    }
    return this._supportsAnchor;
  }
  private fallbackListeners: (() => void)[] = [];
  private activeTemplate: TemplateRef<unknown> | null = null;
  private escListener: (() => void) | null = null;

  constructor() {
    // Ancre le déclencheur. setProperty (et non Renderer2.setStyle) car les propriétés
    // CSS à tiret ne sont appliquées qu'ainsi de façon fiable.
    if (isPlatformBrowser(this.platformId)) {
      this.host.nativeElement.style.setProperty('anchor-name', this.anchorName);
    }

    // Gestion réactive du cycle de vie du DOM du Tooltip
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;

      // Création lazy : uniquement si actif ET affiché
      if (!this.isActive() || !this.isShown()) {
        this.destroyTip();
        return;
      }

      const tip = this.ensureTip();
      this.registerEscapeListener();
      this.syncContent();

      try {
        tip.showPopover?.();
      } catch {
        // Ignorer si déjà ouvert ou non supporté
      }

      if (!this.supportsAnchor) {
        this.positionFallback();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyTip();
  }

  protected show(): void {
    if (!this.isActive()) return;

    clearTimeout(this.hideTimer);
    this.showTimer = setTimeout(() => {
      if (this.isShown()) return;

      this.isShown.set(true);

      if (!this.supportsAnchor) {
        this.registerFallbackListeners();
      }
    }, this.showDelay());
  }

  protected hide(): void {
    clearTimeout(this.showTimer);
    this.hideTimer = setTimeout(() => this.dismiss(), this.hideDelay());
  }

  /**
   * Fermeture immédiate à l'activation de la cible (clic souris, tap tactile, stylet).
   * Dès que l'utilisateur AGIT sur l'élément (typiquement un bouton qui ouvre une bottom sheet ou un
   * dialog), l'infobulle a fini son rôle : on la ferme sans attendre le hideDelay, et on purge un
   * affichage en attente pour qu'il ne surgisse pas après coup.
   *
   * Sans ce déclencheur, une infobulle affichée au survol SURVIVAIT à l'ouverture d'un overlay : le
   * pointeur reste sur la cible (aucun `mouseleave`) et un clic ne défocalise pas toujours (aucun
   * `focusout` fiable, ex. Safari/Firefox macOS). Comme l'infobulle est un popover en top layer, elle
   * flottait alors AU-DESSUS de l'overlay (lui empilé au z-index) — impossible à masquer autrement.
   *
   * `pointerdown` (et non `click`) car il précède l'ouverture de l'overlay et le déplacement de focus
   * → zéro flash. On ne fait ni preventDefault ni stopPropagation : l'action native (clic) doit suivre
   * son cours. Le cas clavier (Entrée/Espace) reste couvert par `focusout` quand l'overlay prend le focus.
   */
  protected onActivate(): void {
    clearTimeout(this.showTimer);
    this.dismiss();
  }

  protected onEscape(event: Event): void {
    if (!this.isShown()) return;

    // Dismiss sans déplacer le pointeur (WCAG 1.4.13) ; on n'annule pas l'action native.
    this.dismiss();
    event.stopPropagation();
  }

  private dismiss(): void {
    if (!this.isShown()) return;

    this.isShown.set(false);
  }

  private ensureTip(): HTMLElement {
    if (this.tip) return this.tip;

    const tip = this.renderer.createElement('div') as HTMLElement;
    this.renderer.setAttribute(tip, 'role', 'tooltip');
    this.renderer.setAttribute(tip, 'id', this.tooltipId);
    // manual : on gère nous-mêmes Échap et la fermeture au survol/blur.
    this.renderer.setAttribute(tip, 'popover', 'manual');
    this.renderer.addClass(tip, 'kt-tooltip');
    // setProperty natif : indispensable pour une propriété CSS à tiret.
    tip.style.setProperty('position-anchor', this.anchorName);
    // Top-layer : ajouté au body, immunisé contre overflow/z-index.
    this.renderer.appendChild(this.doc.body, tip);

    // Hoverable : passer le pointeur du trigger au tooltip ne le ferme pas.
    this.listeners.push(
      this.renderer.listen(tip, 'mouseenter', () => clearTimeout(this.hideTimer)),
      this.renderer.listen(tip, 'mouseleave', () => this.hide()),
    );

    this.tip = tip;
    return tip;
  }

  private registerEscapeListener(): void {
    if (this.escListener) return;
    this.escListener = this.renderer.listen('document', 'keydown.escape', (event: KeyboardEvent) => {
      if (this.isShown()) {
        this.dismiss();
        event.stopPropagation();
      }
    });
  }

  private syncContent(): void {
    if (!this.tip) return;

    this.renderer.setAttribute(this.tip, 'data-position', this.tooltipPosition());

    const content = this.ktTooltip();

    if (content instanceof TemplateRef) {
      if (this.activeTemplate === content) return;
      this.clearContent();
      this.activeTemplate = content;

      this.view = this.vcr.createEmbeddedView(content);
      this.view.detectChanges();
      for (const node of this.view.rootNodes) {
        this.renderer.appendChild(this.tip, node);
      }
      if (isDevMode()) {
        this.warnIfInteractive();
      }
      return;
    }

    this.clearContent();
    this.renderer.setProperty(this.tip, 'textContent', content);
  }

  private clearContent(): void {
    if (this.view) {
      this.view.destroy();
      this.view = null;
    }
    this.activeTemplate = null;
    if (this.tip) {
      this.renderer.setProperty(this.tip, 'textContent', '');
    }
  }

  // Garde-fou a11y : un role="tooltip" ne doit pas contenir d'éléments focusables.
  private warnIfInteractive(): void {
    if (!this.tip) return;

    const interactive = this.tip.querySelector('a[href], button, input, select, textarea, [tabindex]');
    if (!interactive) return;

    console.warn(
      `[ktTooltip] Un role="tooltip" ne doit pas contenir d'éléments interactifs ` +
        `(<${interactive.nodeName.toLowerCase()}>). Utilisez plutôt un toggletip ou un <dialog>.`,
    );
  }

  private destroyTip(): void {
    clearTimeout(this.showTimer);
    clearTimeout(this.hideTimer);

    for (const unlisten of this.listeners) unlisten();
    this.listeners = [];
    this.clearFallbackListeners();

    if (this.escListener) {
      this.escListener();
      this.escListener = null;
    }

    this.view?.destroy();
    this.view = null;
    this.activeTemplate = null;

    if (this.tip) {
      try {
        this.tip.hidePopover?.();
      } catch {
        // Ignorer si déjà fermé ou non supporté
      }
      this.tip.remove();
      this.tip = null;
    }

    if (this.isShown()) {
      this.isShown.set(false);
    }
  }

  private positionFallback(): void {
    if (!this.tip) return;
    const triggerEl = this.host.nativeElement;
    const triggerRect = triggerEl.getBoundingClientRect();
    const tooltipRect = this.tip.getBoundingClientRect();
    const position = this.tooltipPosition();
    const gap = 8;

    let top = 0;
    let left = 0;

    if (position === 'top') {
      top = triggerRect.top - tooltipRect.height - gap;
      left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
    } else if (position === 'bottom') {
      top = triggerRect.bottom + gap;
      left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
    } else if (position === 'left') {
      top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
      left = triggerRect.left - tooltipRect.width - gap;
    } else if (position === 'right') {
      top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
      left = triggerRect.right + gap;
    }

    const viewWidth = window.innerWidth;
    const viewHeight = window.innerHeight;

    if (left < 4) left = 4;
    if (left + tooltipRect.width > viewWidth - 4) {
      left = viewWidth - tooltipRect.width - 4;
    }
    if (top < 4) {
      if (position === 'top') {
        top = triggerRect.bottom + gap;
      } else {
        top = 4;
      }
    }
    if (top + tooltipRect.height > viewHeight - 4) {
      if (position === 'bottom') {
        top = triggerRect.top - tooltipRect.height - gap;
      } else {
        top = viewHeight - tooltipRect.height - 4;
      }
    }

    this.tip.style.position = 'fixed';
    this.tip.style.top = `${top}px`;
    this.tip.style.left = `${left}px`;
    this.tip.style.margin = '0';
  }

  private registerFallbackListeners(): void {
    this.clearFallbackListeners();
    if (this.supportsAnchor || !isPlatformBrowser(this.platformId)) return;

    const onScrollOrResize = () => {
      this.positionFallback();
    };
    window.addEventListener('scroll', onScrollOrResize, { passive: true, capture: true });
    window.addEventListener('resize', onScrollOrResize);

    this.fallbackListeners.push(
      () => window.removeEventListener('scroll', onScrollOrResize, { capture: true }),
      () => window.removeEventListener('resize', onScrollOrResize),
    );
  }

  private clearFallbackListeners(): void {
    for (const remove of this.fallbackListeners) remove();
    this.fallbackListeners = [];
  }
}
