import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ComponentRef, Injectable, Injector, OnDestroy, PLATFORM_ID, inject } from '@angular/core';

import {
  KT_SNACKBAR_CONFIG,
  KT_SNACKBAR_DEFAULTS,
  KtSnackbarConfig,
  KtSnackbarOptions,
  KtSnackbarPoliteness,
  KtSnackbarPosition,
} from './snackbar-config';
import { KT_SNACKBAR_CONTEXT, KtSnackbarContainer, KtSnackbarContext } from './snackbar-container';
import { KtSnackbarRef } from './snackbar-ref';

/** Élément de la file FIFO interne (une seule snackbar visible à la fois). */
interface KtSnackbarQueueItem {
  ref: KtSnackbarRef;
  readonly context: KtSnackbarContext;
  readonly position: KtSnackbarPosition;
  readonly politeness: KtSnackbarPoliteness;
}

/**
 * Service d'ouverture des snackbars `@ktortu/aaa` — feedback **non bloquant** qui confirme une
 * action ou signale un événement transitoire sans interrompre la tâche (n'utilisez PAS de snackbar
 * pour une information critique à acquitter : préférez le dialog).
 *
 * Architecture a11y :
 * - **CDK Overlay** pour le panneau visuel, **CDK LiveAnnouncer** pour l'annonce — **un seul canal**
 *   d'annonce (le panneau n'est pas une live region) ;
 * - **le focus n'est jamais déplacé** vers la snackbar (RGAA « message de statut » / WCAG 4.1.3) ;
 * - disparition automatique **en pause au survol et au focus** (régime `'auto'`, défaut AA), ou
 *   persistante (`timing: 'manual'`, AAA) ;
 * - **file FIFO** : une seule snackbar visible, les suivantes patientent (live region non saturée).
 *   La file est bornée par `max` (défaut 3) ; les messages **identiques** sont fusionnés (coalescing) ;
 * - **Échap** ferme la snackbar affichée (la plus récente).
 *
 * Requiert côté hôte les styles `@angular/cdk/overlay-prebuilt.css` **et**
 * `@angular/cdk/a11y-prebuilt.css` (ce dernier masque l'élément du LiveAnnouncer), en plus de
 * `@ktortu/aaa/snackbar.css`.
 *
 * > [!IMPORTANT]
 * > **Prérequis d'intégration obligatoire :**
 * > Ce service ne fonctionnera pas correctement sans l'importation de ces deux fichiers CSS de l'overlay CDK et d'accessibilité dans votre feuille de styles globale ou votre build.
 *
 * @example
 * ```ts
 * private readonly snackbar = inject(KtSnackbar);
 * this.snackbar.open('Brouillon enregistré');                       // disparaît, annonce polie
 * this.snackbar.open('Fichier supprimé', { variant: 'success' });   // variante (couleur + icône)
 * this.snackbar.open('Hors ligne', { timing: 'manual' });           // reste jusqu'à fermeture (AAA)
 * ```
 */
@Injectable({ providedIn: 'root' })
export class KtSnackbar implements OnDestroy {
  private readonly overlay = inject(Overlay);
  private readonly injector = inject(Injector);
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly config = inject(KT_SNACKBAR_CONFIG, { optional: true });
  private readonly platformId = inject(PLATFORM_ID);
  private readonly doc = inject(DOCUMENT);

  /** File FIFO : `queue[0]` est la snackbar affichée dès qu'elle est attachée. */
  private readonly queue: KtSnackbarQueueItem[] = [];
  private active: { item: KtSnackbarQueueItem; overlayRef: OverlayRef; cmp: ComponentRef<KtSnackbarContainer> } | null =
    null;
  private isExiting = false;
  private escapeRegistered = false;

  /**
   * Ouvre une snackbar affichant `message`. Les `options` priment sur `KT_SNACKBAR_CONFIG`, qui
   * prime sur les défauts. Renvoie une {@link KtSnackbarRef} (ignorable dans le cas simple).
   *
   * Une seule snackbar est visible : si une autre est affichée, celle-ci patiente en file (FIFO).
   * Un `message` identique à une snackbar déjà affichée ou en attente est **fusionné** : on renvoie
   * alors la référence existante sans rien ré-empiler.
   *
   * > [!IMPORTANT]
   * > Assurez-vous d'avoir importé `@angular/cdk/overlay-prebuilt.css` et `@angular/cdk/a11y-prebuilt.css` dans votre application hôte.
   *
   * @param message Texte affiché et annoncé au lecteur d'écran.
   * @param options Surcharges ponctuelles (durée, régime, position, politesse, variante, fermeture).
   * @returns La référence de la snackbar (existante en cas de fusion).
   */
  open(message: string, options?: KtSnackbarOptions): KtSnackbarRef {
    const resolved = this.resolve(options);

    // SSR : aucun overlay côté serveur — on renvoie une référence inerte déjà fermée.
    if (!isPlatformBrowser(this.platformId)) {
      const inert = new KtSnackbarRef(() => {
        /* SSR : aucun overlay à fermer. */
      });
      inert.dismiss('dismiss');
      return inert;
    }

    // Coalescing : message identique déjà affiché ou en file → on réutilise la référence existante.
    const existing = this.queue.find((entry) => entry.context.message === message);
    if (existing) return existing.ref;

    const context: KtSnackbarContext = {
      message,
      variant: resolved.variant,
      closable: resolved.closable,
      closeLabel: resolved.closeLabel,
      timing: resolved.timing,
      duration: this.computeDuration(message, resolved),
    };
    const item = { context, position: resolved.position, politeness: resolved.politeness } as KtSnackbarQueueItem;
    item.ref = new KtSnackbarRef(() => this.handleDismiss(item));

    this.queue.push(item);
    this.enforceMax(resolved.max);
    this.showHead();
    return item.ref;
  }

  ngOnDestroy(): void {
    this.unregisterEscape();
    this.active?.overlayRef.dispose();
    this.active = null;
    this.isExiting = false;
    this.queue.length = 0;
  }

  /** Borne la file (affichée + en attente) : retire les plus ANCIENNES en attente au-delà de `max`. */
  private enforceMax(max: number): void {
    const limit = Math.max(1, max);
    while (this.queue.length > limit) {
      const oldestWaiting = this.queue.find((entry) => entry !== this.active?.item);
      if (!oldestWaiting) break;
      // Jamais affichée : la fermeture est routée via handleDismiss (qui la retire de la file).
      oldestWaiting.ref.dismiss('replaced');
    }
  }

  /** Affiche la tête de file si rien n'est actuellement visible. */
  private showHead(): void {
    if (this.active || this.isExiting || this.queue.length === 0) return;
    const item = this.queue[0];

    const positionStrategy = this.overlay.position().global().centerHorizontally();
    if (item.position === 'top') positionStrategy.top('0');
    else positionStrategy.bottom('0');

    const overlayRef = this.overlay.create({
      positionStrategy,
      panelClass: ['kt-snackbar-pane', `kt-snackbar-pane--${item.position}`],
    });

    const injector = Injector.create({
      parent: this.injector,
      providers: [
        { provide: KtSnackbarRef, useValue: item.ref },
        { provide: KT_SNACKBAR_CONTEXT, useValue: item.context },
      ],
    });

    const cmp = overlayRef.attach(new ComponentPortal(KtSnackbarContainer, null, injector));

    // Canal d'annonce UNIQUE : le panneau visuel n'est pas une live region.
    void this.liveAnnouncer.announce(item.context.message, item.politeness);

    this.active = { item, overlayRef, cmp };
    this.registerEscape();
  }

  /** Retire l'élément de la file ; s'il est affiché, joue la sortie puis démonte et avance la file. */
  private handleDismiss(item: KtSnackbarQueueItem): void {
    const index = this.queue.indexOf(item);
    if (index === -1) return;

    if (this.active && this.active.item === item) {
      const { overlayRef, cmp } = this.active;
      this.active = null;
      this.isExiting = true;
      this.queue.splice(index, 1);
      cmp.instance.playExit(() => {
        overlayRef.dispose();
        this.isExiting = false;
        this.showHead();
        if (this.queue.length === 0 && !this.active) this.unregisterEscape();
      });
      return;
    }

    // En attente : aucun visuel à démonter.
    this.queue.splice(index, 1);
  }

  private readonly onDocumentKeydown = (event: KeyboardEvent): void => {
    // Échap ferme la plus récente (= la snackbar affichée).
    if (event.key === 'Escape') this.active?.item.ref.dismiss('dismiss');
  };

  private registerEscape(): void {
    if (this.escapeRegistered) return;
    this.doc.addEventListener('keydown', this.onDocumentKeydown);
    this.escapeRegistered = true;
  }

  private unregisterEscape(): void {
    if (!this.escapeRegistered) return;
    this.doc.removeEventListener('keydown', this.onDocumentKeydown);
    this.escapeRegistered = false;
  }

  /**
   * Durée effective (ms) en régime `'auto'`. Un nombre est pris tel quel (durée fixe) ; le sentinel
   * `'reading-time'` calcule `clamp(longueur × perChar, min, max)`.
   */
  private computeDuration(message: string, resolved: KtSnackbarConfig): number {
    const setting = resolved.duration;
    if (typeof setting === 'number') return setting;
    const computed = message.length * resolved.readingTimePerChar;
    return Math.min(resolved.readingTimeMax, Math.max(resolved.readingTimeMin, computed));
  }

  /** Résolution en cascade `option ?? KT_SNACKBAR_CONFIG ?? défaut`, champ par champ. */
  private resolve(options?: KtSnackbarOptions): KtSnackbarConfig {
    const config = this.config;
    return {
      duration: options?.duration ?? config?.duration ?? KT_SNACKBAR_DEFAULTS.duration,
      readingTimeMin: options?.readingTimeMin ?? config?.readingTimeMin ?? KT_SNACKBAR_DEFAULTS.readingTimeMin,
      readingTimeMax: options?.readingTimeMax ?? config?.readingTimeMax ?? KT_SNACKBAR_DEFAULTS.readingTimeMax,
      readingTimePerChar:
        options?.readingTimePerChar ?? config?.readingTimePerChar ?? KT_SNACKBAR_DEFAULTS.readingTimePerChar,
      timing: options?.timing ?? config?.timing ?? KT_SNACKBAR_DEFAULTS.timing,
      position: options?.position ?? config?.position ?? KT_SNACKBAR_DEFAULTS.position,
      politeness: options?.politeness ?? config?.politeness ?? KT_SNACKBAR_DEFAULTS.politeness,
      variant: options?.variant ?? config?.variant ?? KT_SNACKBAR_DEFAULTS.variant,
      closable: options?.closable ?? config?.closable ?? KT_SNACKBAR_DEFAULTS.closable,
      // `|| ...` (et non seulement `??`) : un closeLabel vide/blanc produirait un bouton de fermeture
      // SANS nom accessible (WCAG 4.1.2) ; on cascade vers le niveau suivant, défaut neutre en dernier.
      closeLabel: options?.closeLabel?.trim() || config?.closeLabel?.trim() || KT_SNACKBAR_DEFAULTS.closeLabel,
      max: options?.max ?? config?.max ?? KT_SNACKBAR_DEFAULTS.max,
    };
  }
}
