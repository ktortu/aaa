import { Injectable, computed, inject, InjectionToken, signal } from '@angular/core';
import { KtViewport } from '@ktortu/aaa/cdk';

/** Mode d'état de la navigation latérale. */
export type KtSidenavState = 'expanded' | 'rail' | 'hidden';

export const KT_LAYOUT_DEFAULT_STATE = new InjectionToken<KtSidenavState>('KT_LAYOUT_DEFAULT_STATE', {
  providedIn: 'root',
  factory: () => 'expanded',
});

/**
 * Service global de gestion de la mise en page (Layout).
 * Gère l'état d'ouverture/fermeture de la barre latérale sur mobile et bureau,
 * ainsi que le comportement spécifique de "rail" sur bureau.
 *
 * NOTE: Ce service n'est pas "providedIn: 'root'". Le développeur doit le fournir
 * (via le tableau providers d'un composant parent ou de l'application) pour
 * maîtriser le scope (ex: avoir plusieurs layouts indépendants).
 */
@Injectable()
export class KtLayoutService {
  private readonly viewport = inject(KtViewport);
  private readonly defaultState = inject(KT_LAYOUT_DEFAULT_STATE);

  /**
   * Comportement actif lors de la fermeture sur ordinateur (écran non mobile).
   * Renseigné généralement par le composant racine `KtLayoutComponent`.
   */
  readonly desktopCloseBehavior = signal<'hidden' | 'rail'>('hidden');

  private readonly _isDesktopOpen = signal<boolean>(this.defaultState !== 'rail' && this.defaultState !== 'hidden');
  private readonly _isMobileOpen = signal<boolean>(false);

  readonly isMobile = this.viewport.isMobile;
  readonly isRail = computed(
    () => !this.isMobile() && !this._isDesktopOpen() && this.desktopCloseBehavior() === 'rail',
  );
  readonly isExpanded = computed(() => !this.isMobile() && this._isDesktopOpen());
  readonly isHidden = computed(
    () =>
      (this.isMobile() && !this._isMobileOpen()) ||
      (!this.isMobile() && !this._isDesktopOpen() && this.desktopCloseBehavior() === 'hidden'),
  );
  readonly isMobileOpen = computed(() => this.isMobile() && this._isMobileOpen());

  toggle() {
    if (this.isMobile()) {
      this._isMobileOpen.update((v) => !v);
    } else {
      this._isDesktopOpen.update((v) => !v);
    }
  }

  open() {
    if (this.isMobile()) {
      this._isMobileOpen.set(true);
    } else {
      this._isDesktopOpen.set(true);
    }
  }

  close() {
    if (this.isMobile()) {
      this._isMobileOpen.set(false);
    } else {
      this._isDesktopOpen.set(false);
    }
  }
}
