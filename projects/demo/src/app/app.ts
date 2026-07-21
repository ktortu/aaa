import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

import { KtButton } from '@ktortu/aaa/button';
import { KtIcon } from '@ktortu/aaa/icon';
import { KT_THEMES, KT_THEME_MODES, KtTheme } from './theme/theme';
import { NAV_ITEMS } from './shared/nav';

import {
  KtLayoutComponent,
  KtSidenavComponent,
  KtToolbarComponent,
  KtNavItemComponent,
  KtSidenavToggleDirective,
  KtLayoutService,
} from '@ktortu/aaa/layout';
import { injectThemeDialog } from './theme/theme-dialog/theme-dialog';

/** Shell de l'app : sidebar de navigation (drawer sur mobile) + header (titre + thème) + zone routée. */
@Component({
  selector: 'kt-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    KtButton,
    KtIcon,
    KtLayoutComponent,
    KtSidenavComponent,
    KtToolbarComponent,
    KtNavItemComponent,
    KtSidenavToggleDirective,
  ],
  providers: [KtLayoutService],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly layout = inject(KtLayoutService);
  protected readonly theme = inject(KtTheme);
  protected readonly themes = KT_THEMES;
  protected readonly modes = KT_THEME_MODES;

  private readonly router = inject(Router);

  /** Navigation du shell — source unique partagée avec l'index d'accueil. */
  protected readonly nav = NAV_ITEMS;

  /** Drawer mobile ouvert ? */
  protected readonly drawerOpen = signal(false);

  /** Titre de la page courante (résolu depuis l'URL). */
  protected readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => this.labelForUrl((e as NavigationEnd).urlAfterRedirects)),
    ),
    { initialValue: this.labelForUrl(this.router.url) },
  );

  protected toggleDrawer(): void {
    this.drawerOpen.update((open) => !open);
  }

  private readonly openTheme = injectThemeDialog();

  protected openThemeDialog(): void {
    this.openTheme();
  }

  protected closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  private labelForUrl(url: string): string {
    const path = url.split('?')[0].split('#')[0].replace(/^\//, '');
    for (const item of this.nav) {
      if (item.children) {
        const match = item.children.find((sub) => sub.link === '/' + path);
        if (match) {
          return match.label;
        }
      }
      if (item.path === path) {
        return item.label;
      }
    }
    return 'Documentation';
  }
}
