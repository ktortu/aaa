import { Injectable, Signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs';
import { KT_BREAKPOINTS, resolveKtBreakpointMedia } from './breakpoints';

/**
 * Expose l'état responsive courant en SIGNALS, dérivé des seuils configurés par l'appli
 * (`KT_BREAKPOINTS` / `provideKtBreakpoints`). Fondé sur `BreakpointObserver` (`@angular/cdk/layout`,
 * déjà dépendance) : SSR-safe (`matches: false` côté serveur → desktop par défaut) et nettoyage des
 * listeners géré par le CDK.
 *
 * À injecter aussi bien dans les composants de la lib (bascule bottom-sheet) que dans le code des
 * applis consommatrices pour leur propre layout responsive.
 */
@Injectable({ providedIn: 'root' })
export class KtViewport {
  private readonly observer = inject(BreakpointObserver);

  /** Media queries résolues (largeur dérivée ou verbatim selon le token) — utile pour miroir CSS. */
  readonly media = resolveKtBreakpointMedia(inject(KT_BREAKPOINTS));

  /** Le viewport est dans la bande mobile. */
  readonly isMobile = this.matches(this.media.mobile);
  /** Le viewport est dans la bande tablette. */
  readonly isTablet = this.matches(this.media.tablet);
  /** Le viewport est dans la bande desktop. */
  readonly isDesktop = this.matches(this.media.desktop);
  /** Alias de `isMobile` : palier où les composants de la lib basculent en bottom-sheet. */
  readonly isCompact = this.isMobile;

  private matches(query: string): Signal<boolean> {
    return toSignal(this.observer.observe(query).pipe(map((state) => state.matches)), {
      initialValue: false,
    });
  }
}
