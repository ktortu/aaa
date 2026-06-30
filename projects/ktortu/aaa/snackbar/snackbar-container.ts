import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  InjectionToken,
  PLATFORM_ID,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';

import { KtSnackbarTiming, KtSnackbarVariant } from './snackbar-config';
import { KtSnackbarRef } from './snackbar-ref';

/**
 * Données résolues passées au conteneur visuel à l'ouverture (injectées via {@link KT_SNACKBAR_CONTEXT}).
 * Produites par `KtSnackbar` après résolution `option ?? config ?? défaut`.
 */
export interface KtSnackbarContext {
  /** Message affiché et annoncé. */
  readonly message: string;
  /** Variante sémantique (apparence : accent + icône). */
  readonly variant: KtSnackbarVariant;
  /** Affiche le bouton de fermeture. */
  readonly closable: boolean;
  /** Nom accessible du bouton de fermeture. */
  readonly closeLabel: string;
  /** Régime temporel (la minuterie n'existe qu'en `'auto'`). */
  readonly timing: KtSnackbarTiming;
  /** Durée (ms) avant disparition automatique en régime `'auto'`. */
  readonly duration: number;
}

// Stryker disable next-line StringLiteral: libellé de debug du token d'injection (sans effet runtime)
export const KT_SNACKBAR_CONTEXT = new InjectionToken<KtSnackbarContext>('KT_SNACKBAR_CONTEXT');

/**
 * Conteneur visuel d'une snackbar. **Volontairement pas une live region** (aucun `role`/`aria-live`
 * sur l'hôte) : l'annonce passe par un canal UNIQUE, le `LiveAnnouncer` du service. On évite ainsi
 * la double-annonce et l'écrasement de politesse observés sur d'autres libs.
 *
 * En régime `'auto'`, la minuterie de disparition se met **en pause au survol et au focus** clavier
 * (WCAG 1.4.13 / 2.2.1) et reprend quand ni le pointeur ni le focus ne sont sur la snackbar.
 * L'icône de variante est **décorative** (`aria-hidden`) : la forme distincte sert d'indice non
 * coloré (WCAG 1.4.1), le sens reste porté par le texte.
 *
 * @internal Monté par `KtSnackbar` via un `ComponentPortal`.
 */
@Component({
  selector: 'kt-snackbar-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'kt-snackbar',
    '[attr.data-variant]': 'context.variant',
    '[class.kt-snackbar--leaving]': 'leaving()',
    '(mouseenter)': 'onPointerEnter()',
    '(mouseleave)': 'onPointerLeave()',
    '(focusin)': 'onFocusEnter()',
    '(focusout)': 'onFocusLeave()',
  },
  template: `
    @if (context.variant !== 'neutral') {
      <span class="kt-snackbar__icon" aria-hidden="true"></span>
    }
    <span class="kt-snackbar__message">{{ context.message }}</span>
    @if (context.closable) {
      <button
        type="button"
        class="kt-snackbar__close"
        [attr.aria-label]="context.closeLabel"
        (click)="close()"
      ></button>
    }
  `,
})
export class KtSnackbarContainer {
  protected readonly context = inject(KT_SNACKBAR_CONTEXT);
  private readonly ref = inject(KtSnackbarRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Vrai pendant l'animation de sortie (déclenche la classe `kt-snackbar--leaving`). */
  protected readonly leaving = signal(false);

  private timer: ReturnType<typeof setTimeout> | undefined;
  private remaining = this.context.duration;
  private deadline = 0;
  private hovered = false;
  private focused = false;

  constructor() {
    if (this.context.timing === 'auto' && isPlatformBrowser(this.platformId)) {
      afterNextRender(() => this.startTimer(this.context.duration));
    }
    inject(DestroyRef).onDestroy(() => this.clearTimer());
  }

  protected close(): void {
    this.ref.dismiss('dismiss');
  }

  /**
   * Joue l'animation de sortie puis invoque `done` (démontage de l'overlay côté service). Appelé par
   * le service à la fermeture. Sans animation (durée nulle, `prefers-reduced-motion`, ou SSR), `done`
   * est invoqué immédiatement. Filet de sécurité par `setTimeout` si `transitionend` ne se déclenche pas.
   */
  playExit(done: () => void): void {
    this.clearTimer();
    if (!isPlatformBrowser(this.platformId)) {
      done();
      return;
    }
    const durationMs = this.exitDurationMs();
    // Stryker disable all: animation de sortie pilotée par une transition CSS réelle. En jsdom
    // `transitionDuration` est vide → `exitDurationMs()` vaut 0 → ce code n'est jamais atteint.
    // Comportement (jeu de l'animation puis démontage) vérifié en e2e (sortie + reduced-motion).
    if (durationMs <= 0) {
      done();
      return;
    }

    this.leaving.set(true);
    let finished = false;
    const finish = (): void => {
      if (finished) return;
      finished = true;
      this.host.removeEventListener('transitionend', onTransitionEnd);
      done();
    };
    const onTransitionEnd = (event: TransitionEvent): void => {
      if (event.target === this.host) finish();
    };
    this.host.addEventListener('transitionend', onTransitionEnd);
    setTimeout(finish, durationMs + 50);
    // Stryker restore all
  }

  protected onPointerEnter(): void {
    this.hovered = true;
    this.pauseTimer();
  }

  protected onPointerLeave(): void {
    this.hovered = false;
    this.maybeResume();
  }

  protected onFocusEnter(): void {
    this.focused = true;
    this.pauseTimer();
  }

  protected onFocusLeave(): void {
    this.focused = false;
    this.maybeResume();
  }

  private maybeResume(): void {
    if (this.hovered || this.focused) return;
    if (this.context.timing !== 'auto' || this.timer !== undefined || this.leaving()) return;
    if (this.remaining <= 0) {
      this.ref.dismiss('timeout');
      return;
    }
    this.startTimer(this.remaining);
  }

  private startTimer(ms: number): void {
    this.deadline = Date.now() + ms;
    this.timer = setTimeout(() => this.ref.dismiss('timeout'), ms);
  }

  private pauseTimer(): void {
    if (this.timer === undefined) return;
    this.remaining = Math.max(0, this.deadline - Date.now());
    this.clearTimer();
  }

  private clearTimer(): void {
    if (this.timer === undefined) return;
    clearTimeout(this.timer);
    this.timer = undefined;
  }

  /** Durée (ms) de la transition de sortie, lue sur l'hôte (0 si aucune — ex. reduced-motion). */
  private exitDurationMs(): number {
    // Stryker disable all: lecture/parsing de `transition-duration` CSS — en jsdom
    // `getComputedStyle().transitionDuration` est toujours vide (renvoie 0). Le parsing réel
    // (ms vs s, valeurs multiples, NaN) est exercé en e2e ; intestable en environnement jsdom.
    const raw = getComputedStyle(this.host).transitionDuration || '';
    const first = raw.split(',')[0].trim();
    if (!first) return 0;
    const value = parseFloat(first);
    if (Number.isNaN(value)) return 0;
    return first.endsWith('ms') ? value : value * 1000;
    // Stryker restore all
  }
}
