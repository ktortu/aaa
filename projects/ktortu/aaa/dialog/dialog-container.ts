import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  isDevMode,
  signal,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CdkDialogContainer, DialogRef } from '@angular/cdk/dialog';
import { PortalModule } from '@angular/cdk/portal';

@Component({
  selector: 'kt-dialog-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PortalModule],
  host: {
    class: 'cdk-dialog-container kt-dialog-container',
    tabindex: '-1',
    '[attr.id]': '_config.id || null',
    '[attr.role]': '_config.role',
    '[attr.aria-modal]': '_config.ariaModal',
    '[attr.aria-labelledby]': '_config.ariaLabel ? null : ariaLabelledBy',
    '[attr.aria-label]': '_config.ariaLabel',
    '[attr.aria-describedby]': '_config.ariaDescribedBy || null',
    '[class.kt-dialog-container--sheet]': 'isSheet()',
    '[class.kt-dialog-container--closing]': 'isClosing()',
  },
  template: `
    <!-- Sheet scroll-snap (ADR-0005) : le conteneur est le SCROLLER, le spacer porte le snap
         « fermé » (un écran) et la carte (layout) le snap « ouvert ». -->
    @if (isSheet()) {
      <div class="kt-dialog-container__spacer" aria-hidden="true"></div>
    }
    <div class="kt-dialog-container__layout">
      @if (isSheet() && showSheetHandle()) {
        <!-- Poignée DÉCORATIVE auto-rendue : la sheet s'attrape partout (opt-out :
             panelClass additionnel 'kt-dialog--no-handle' à l'ouverture). -->
        <div class="kt-dialog-container__sheet-handle" aria-hidden="true"></div>
      }
      <ng-template cdkPortalOutlet></ng-template>
    </div>
  `,
})
export class KtDialogContainer extends CdkDialogContainer {
  private readonly dialogRef = inject(DialogRef);
  private readonly elementRef = inject(ElementRef);
  private readonly host = this.elementRef.nativeElement as HTMLElement;
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isClosing = signal(false);

  // --- Sheet scroll-snap (ADR-0005) : détection du snap « fermé » + fermeture différée ---
  /** Armé quand l'ouverture a dépassé 50px : un repos à ~0 est alors forcément le snap « fermé ». */
  private sheetArmed = false;
  /** Fermeture réelle en attente du repos au snap « fermé » (sortie programmatique animée). */
  private pendingSheetClose: (() => void) | null = null;
  private sheetCloseTimer: ReturnType<typeof setTimeout> | undefined;

  /** Premier id de la file `aria-labelledby` exposée par `CdkDialogContainer`. Le membre
      `_ariaLabelledByQueue` est interne au CDK (préfixe `_`) : on l'encapsule ICI, gardé, pour que
      le binding de template ne lise jamais l'interne directement. Si une montée du CDK retire ou
      renomme ce membre, on dégrade proprement vers `null` au lieu de casser le rendu du conteneur. */
  protected get ariaLabelledBy(): string | null {
    const queue = (this as unknown as { _ariaLabelledByQueue?: readonly string[] })._ariaLabelledByQueue;
    return queue?.[0] ?? null;
  }

  constructor() {
    super();
    // CDK Dialog n'expose AUCUN hook « avant fermeture ». Pour jouer l'animation de SORTIE sur
    // TOUTE fermeture, on intercepte la méthode publique `close` de la réf : c'est le point de
    // passage unique. Échap et clic backdrop sont gérés NATIVEMENT par le CDK, qui appelle lui aussi
    // `dialogRef.close()` → ils transitent donc par cette interception (inutile de les réimplémenter).
    const originalClose = this.dialogRef.close.bind(this.dialogRef);
    this.dialogRef.close = (result?: unknown) => {
      this.animateAndClose(result, originalClose);
    };

    // L'ouvreur pré-réserve des ids titre/description ; les directives [ktDialogTitle]/[ktDialogDescription]
    // les adoptent. En leur absence, ces ids pointent dans le vide. Au rendu (navigateur) :
    //  - aria-describedby orphelin → on RETIRE l'attribut (pas de description fournie) ;
    //  - aucun nom accessible (ni titre ni aria-label) → warn dev (WCAG 4.1.2).
    afterNextRender(() => {
      if (this.isSheet()) this.initSheetGesture();

      const doc = this.host.ownerDocument;

      const describedBy = this.host.getAttribute('aria-describedby');
      if (describedBy && !doc.getElementById(describedBy)) {
        this.host.removeAttribute('aria-describedby');
      }

      if (!isDevMode()) return;
      const labelledBy = this.host.getAttribute('aria-labelledby');
      const hasName = !!this.host.getAttribute('aria-label') || (!!labelledBy && !!doc.getElementById(labelledBy));
      if (!hasName) {
        console.warn(
          '[ktDialog] dialog sans nom accessible : ajoutez un [ktDialogTitle] (ou `aria-label` via la config d’ouverture) — WCAG 4.1.2.',
        );
      }
    });
  }

  protected isSheet(): boolean {
    return this._config.panelClass?.includes('kt-dialog--sheet') ?? false;
  }

  /** Poignée décorative auto-rendue en présentation sheet. Opt-out : panelClass `kt-dialog--no-handle`. */
  protected showSheetHandle(): boolean {
    return !this._config.panelClass?.includes('kt-dialog--no-handle');
  }

  /** Sheet scroll-snap : écouteurs (détection du repos + garde molette) et scroll d'ENTRÉE
      programmatique vers le snap « ouvert ». Appelé au premier rendu, en présentation sheet. */
  private initSheetGesture(): void {
    const host = this.host;
    host.addEventListener('scroll', this.onSheetScroll);
    host.addEventListener('wheel', this.onSheetWheel, { passive: false });
    this.destroyRef.onDestroy(() => {
      clearTimeout(this.sheetCloseTimer);
      host.removeEventListener('scroll', this.onSheetScroll);
      host.removeEventListener('wheel', this.onSheetWheel);
    });
    host.scrollTop = 0;
    requestAnimationFrame(() => {
      host.scrollTo?.({
        top: host.scrollHeight - host.clientHeight,
        behavior: this.prefersReducedMotion() ? 'auto' : 'smooth',
      });
    });
  }

  private prefersReducedMotion(): boolean {
    return this.host.ownerDocument.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }

  /** Détection du snap « fermé » par position de scroll (ni scrollsnapchange ni scrollend — cf.
      ADR-0005). Un repos à ~0 finalise la fermeture en attente, ou EST une fermeture par geste. */
  private readonly onSheetScroll = (): void => {
    const top = this.host.scrollTop;
    if (top > 50) this.sheetArmed = true;
    if (!this.sheetArmed || top > 1) return;
    const pending = this.pendingSheetClose;
    if (pending) {
      this.pendingSheetClose = null;
      clearTimeout(this.sheetCloseTimer);
      pending();
      return;
    }
    // Dismissal par geste : transite par le close intercepté (animation déjà « jouée » par le doigt).
    if (!this.isClosing()) this.dialogRef.close();
  };

  /** La molette ne ferme JAMAIS la sheet (pas de geste souris — ADR-0005) : seuls les scrollers
      INTERNES peuvent consommer, dans leurs bornes (générique : un dialog peut imbriquer
      plusieurs zones scrollables). */
  private readonly onSheetWheel = (event: WheelEvent): void => {
    let el = event.target as HTMLElement | null;
    while (el && el !== this.host) {
      if (el.scrollHeight > el.clientHeight + 1) {
        const canScrollDown = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
        const canScrollUp = el.scrollTop > 0;
        if ((event.deltaY > 0 && canScrollDown) || (event.deltaY < 0 && canScrollUp)) return;
      }
      el = el.parentElement;
    }
    event.preventDefault();
  };

  private animateAndClose(result: unknown, originalCloseFn: (r?: unknown) => void): void {
    if (this.isClosing()) return;
    this.isClosing.set(true);

    if (!isPlatformBrowser(this.platformId)) {
      originalCloseFn(result);
      return;
    }

    // Sheet scroll-snap : la sortie est un scroll programmatique vers le snap « fermé » ;
    // onSheetScroll finalise au repos. Déjà en bas (geste abouti, jsdom, reduced-motion) :
    // fermeture immédiate. Fallback : timeout (scroll lisse interrompu).
    if (this.isSheet()) {
      if (this.host.scrollTop <= 1) {
        originalCloseFn(result);
        return;
      }
      this.sheetArmed = true;
      this.pendingSheetClose = () => originalCloseFn(result);
      this.host.scrollTo?.({ top: 0, behavior: this.prefersReducedMotion() ? 'auto' : 'smooth' });
      clearTimeout(this.sheetCloseTimer);
      this.sheetCloseTimer = setTimeout(() => {
        const pending = this.pendingSheetClose;
        this.pendingSheetClose = null;
        pending?.();
      }, 400);
      return;
    }

    // Récupérer la durée de transition configurée en CSS (ex: "150ms" ou "0.2s"). Vue lue via
    // ownerDocument.defaultView (pas le global `window`) : cohérent avec prefersReducedMotion() et
    // sûr indépendamment du garde de plateforme — si la vue manque, durée 0 → fermeture immédiate.
    const durationStr = this.host.ownerDocument.defaultView?.getComputedStyle(this.host).transitionDuration || '0s';
    const durationMs = parseFloat(durationStr) * (durationStr.includes('ms') ? 1 : 1000);

    if (durationMs === 0) {
      originalCloseFn(result);
      return;
    }

    // Écouter la fin de la transition (opacity pour le dialog classique, translate pour la sheet)
    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target === this.host && (event.propertyName === 'translate' || event.propertyName === 'opacity')) {
        this.host.removeEventListener('transitionend', onTransitionEnd);
        originalCloseFn(result);
      }
    };
    this.host.addEventListener('transitionend', onTransitionEnd);

    // Sécurité (au cas où la transition n'aboutirait pas)
    setTimeout(() => {
      this.host.removeEventListener('transitionend', onTransitionEnd);
      originalCloseFn(result);
    }, durationMs + 50);
  }
}
