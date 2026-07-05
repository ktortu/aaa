import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

import { KtButton } from '@ktortu/aaa/button';
import { KtSelect } from '@ktortu/aaa/forms';
import { KT_THEMES, KT_THEME_MODES, KtTheme, KtThemeId, KtThemeMode } from './theme/theme';
import { NAV_ITEMS } from './shared/nav';

/** Shell de l'app : sidebar de navigation (drawer sur mobile) + header (titre + thème) + zone routée. */
@Component({
  selector: 'kt-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, KtSelect, KtButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
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

  protected closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  protected onThemeChange(id: KtThemeId | null): void {
    if (!id) return;
    this.theme.current.set(id);
  }

  protected onModeChange(mode: KtThemeMode | null): void {
    if (!mode) return;
    this.theme.mode.set(mode);
  }

  protected onSeedColorChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input) {
      this.theme.seedColor.set(input.value);
    }
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
