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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CdkDialogContainer, DialogRef } from '@angular/cdk/dialog';
import { PortalModule } from '@angular/cdk/portal';
import { KtBodyScrollLock } from '@ktortu/aaa/cdk';

import { DEFAULT_KT_DIALOG_CONFIG, KT_DIALOG_CONFIG, KtDialogConfig } from './dialog-config';

/** panelClass d'opt-out historique de la poignée, conservé comme repli DÉPRÉCIÉ (cf. `sheetHandle`). */
const LEGACY_NO_HANDLE_CLASS = 'kt-dialog--no-handle';

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
      <!-- Spacer = zone de tap-extérieur (ferme, comme un backdrop) ET surface de drag (scroll natif).
           Le conteneur capte le tactile (pointer-events auto) : le clic ne traverse plus vers le
           backdrop CDK, la fermeture au tap est donc portée ici (disableClose respecté). -->
      <div class="kt-dialog-container__spacer" aria-hidden="true" (click)="onScrimClick()"></div>
    }
    <div class="kt-dialog-container__layout" [class.kt-dialog-container__layout--closable]="showSheetClose()">
      @if (showSheetClose()) {
        <!-- Bouton de fermeture AUTO-RENDU (opt-in 'sheetCloseButton'). Placé en TÊTE du document
             pour ouvrir l'ordre de tabulation, mais ancré en absolu sur la carte (cf. dialog.css) :
             il ne consomme pas de place dans la colonne. Aucun touch-action ici — le geste de
             glissement doit rester saisissable au travers du bouton (ADR-0005). -->
        <button
          type="button"
          class="kt-dialog-container__sheet-close"
          [attr.aria-label]="ktConfig.sheetCloseLabel"
          (click)="onSheetCloseClick()"
        >
          <span class="kt-dialog-container__sheet-close-icon" aria-hidden="true"></span>
        </button>
      }
      @if (isSheet() && showSheetHandle()) {
        <!-- Poignée DÉCORATIVE auto-rendue : la sheet s'attrape partout (opt-out : 'sheetHandle'). -->
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
  private readonly bodyScrollLock = inject(KtBodyScrollLock);

  /** Options maison RÉSOLUES. `injectKtDialogOpener` refournit `KT_DIALOG_CONFIG` déjà résolu dans
      l'injecteur du conteneur : la fusion ci-dessous est alors un no-op. Elle reste indispensable
      quand le conteneur est monté sans l'ouvreur (`dialog.open` brut), où le token remonte à
      l'application et n'est que partiel. Un seul chemin de code, idempotent. */
  protected readonly ktConfig: Required<KtDialogConfig> = {
    ...DEFAULT_KT_DIALOG_CONFIG,
    ...(inject(KT_DIALOG_CONFIG, { optional: true }) ?? {}),
  };

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
      this.warnOnConfigMisuse();
    });

    // Repli de FOCUS INITIAL. La config par défaut de la lib vise un SÉLECTEUR
    // (`autoFocus: '[ktDialogFocusInitial]'`) ; quand aucun élément ne le porte, le CDK ne focalise
    // RIEN (son repli sur le conteneur n'existe que pour les modes `first-tabbable`/`dialog`/false).
    // Le focus reste alors sur le déclencheur, HORS du dialog, et Tab promène l'utilisateur dans la
    // page derrière. On rattrape ici sur le conteneur (tabindex -1) — jamais sur un bouton :
    // atterrir d'emblée sur « Fermer » est un anti-pattern lecteur d'écran (WCAG 2.4.3).
    // `preventScroll` : en présentation sheet le conteneur EST le scroller à snap, focaliser ne doit
    // pas perturber le scroll d'entrée en cours.
    this._focusTrapped.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.host.contains(this.host.ownerDocument.activeElement)) return;
      this.host.focus({ preventScroll: true });
    });
  }

  /** Garde-fous dev sur la config maison : usage hors sheet, double bouton de fermeture, opt-out
      déprécié de la poignée. On AVERTIT sans jamais corriger en silence — un masquage automatique
      dépendrait de l'ordre de rendu du portail et serait indébogable. */
  private warnOnConfigMisuse(): void {
    if (this.hasLegacyNoHandleClass()) {
      console.warn(
        `[ktDialog] panelClass '${LEGACY_NO_HANDLE_CLASS}' déprécié : utilisez l’option typée ` +
          '`sheetHandle: false` (à l’ouverture ou via provideKtDialog).',
      );
    }

    if (this.ktConfig.sheetCloseButton && !this.isSheet()) {
      console.warn(
        '[ktDialog] `sheetCloseButton` ne s’applique qu’à la présentation `sheet` et reste sans effet ' +
          'ici : en centré / plein écran, posez le bouton dans un [ktDialogHeader].',
      );
    }

    // Collision visuelle recherchée : une croix posée en TÊTE (typiquement dans un [ktDialogHeader]),
    // qui doublerait celle du conteneur. Un [ktDialogClose] dans la barre d'ACTIONS est légitime
    // (« Annuler », ou une action qui ferme au passage) et ne collisionne pas : on l'exclut.
    // Heuristique volontairement partielle par ailleurs : elle voit la forme ATTRIBUT `ktDialogClose`,
    // pas la forme liée `[ktDialogClose]="x"` (un binding de propriété ne reflète aucun attribut).
    const strayClose =
      this.showSheetClose() &&
      [...this.host.querySelectorAll('[ktDialogClose]')].some((el) => !el.closest('[ktDialogActions]'));
    if (strayClose) {
      console.warn(
        '[ktDialog] double bouton de fermeture : `sheetCloseButton` est actif alors que le contenu ' +
          'porte déjà un [ktDialogClose] hors barre d’actions (en-tête ?). Gardez l’un OU l’autre.',
      );
    }
  }

  protected isSheet(): boolean {
    return this._config.panelClass?.includes('kt-dialog--sheet') ?? false;
  }

  /** panelClass d'opt-out historique de la poignée — repli DÉPRÉCIÉ, remplacé par `sheetHandle`. */
  private hasLegacyNoHandleClass(): boolean {
    return this._config.panelClass?.includes(LEGACY_NO_HANDLE_CLASS) ?? false;
  }

  /** Poignée décorative auto-rendue en présentation sheet (ADR-0005). Opt-out : option `sheetHandle`
      (le panelClass historique reste honoré, en déprécié). */
  protected showSheetHandle(): boolean {
    if (this.hasLegacyNoHandleClass()) return false;
    return this.ktConfig.sheetHandle;
  }

  /** Bouton de fermeture auto-rendu : opt-in `sheetCloseButton`, et UNIQUEMENT en présentation sheet
      (ailleurs, la croix se pose à la main dans un `[ktDialogHeader]` — cf. `KtDialogConfig`). */
  protected showSheetClose(): boolean {
    return this.isSheet() && this.ktConfig.sheetCloseButton;
  }

  /** Clic sur le bouton de fermeture auto-rendu. Ne consulte VOLONTAIREMENT pas `disableClose` :
      contrairement au tap-extérieur et à Échap (fermetures « par inadvertance » que `disableClose`
      protège), ce bouton est une sortie EXPLICITEMENT demandée par le dev via `sheetCloseButton` —
      le combiner à `disableClose` est le patron « une seule sortie contrôlée ». Le drapeau
      `isClosing` garde l'idempotence face à un geste de glissement simultané. */
  protected onSheetCloseClick(): void {
    if (this.isClosing()) return;
    this.dialogRef.close();
  }

  /** Tap sur le spacer (zone extérieure à la carte) = fermeture, façon backdrop. Le conteneur
      captant désormais le tactile (pointer-events auto, requis pour le drag iOS), le clic ne
      traverse plus vers le backdrop CDK : on porte donc ICI la fermeture au tap-extérieur, en
      respectant `disableClose` (comme le faisait le backdropClick natif). Un drag n'émet pas de
      `click` (le navigateur le supprime après un scroll) : seul un vrai tap ferme. */
  protected onScrimClick(): void {
    if (this._config.disableClose || this.isClosing()) return;
    this.dialogRef.close();
  }

  /** Sheet scroll-snap : écouteurs (détection du repos + garde molette) et scroll d'ENTRÉE
      programmatique vers le snap « ouvert ». Appelé au premier rendu, en présentation sheet. */
  private initSheetGesture(): void {
    const host = this.host;
    host.addEventListener('scroll', this.onSheetScroll);
    host.addEventListener('wheel', this.onSheetWheel, { passive: false });
    // Verrou de scroll du fond (compteur partagé) : sans lui, le fond défile SOUS la sheet et,
    // sur iOS, le geste de dismiss déclenche le pull-to-refresh de la page. La stratégie `block`
    // du CDK ne suffit pas ici (non appliquée / non fiable sur iOS) — même approche que le Select.
    this.bodyScrollLock.lock();
    this.destroyRef.onDestroy(() => {
      clearTimeout(this.sheetCloseTimer);
      host.removeEventListener('scroll', this.onSheetScroll);
      host.removeEventListener('wheel', this.onSheetWheel);
      this.bodyScrollLock.unlock();
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
