import { Component, inject } from '@angular/core';
import { KtTheme, KT_THEMES, KT_THEME_MODES, KtThemeId, KtThemeMode } from '../theme';
import { defineKtDialog, KtDialogImports } from '@ktortu/aaa/dialog';
import { KtSelect } from '@ktortu/aaa/forms';
import { KtButton } from '@ktortu/aaa/button';

@Component({
  selector: 'kt-theme-dialog',
  imports: [KtDialogImports, KtSelect, KtButton],
  templateUrl: './theme-dialog.html',
  styleUrl: './theme-dialog.css',
})
export class ThemeDialog {
  protected readonly theme = inject(KtTheme);
  protected readonly themes = KT_THEMES;
  protected readonly modes = KT_THEME_MODES;

  protected onThemeChange(newTheme: KtThemeId | null): void {
    if (!newTheme) return;
    this.theme.current.set(newTheme);
  }

  protected onModeChange(newMode: KtThemeMode | null): void {
    if (!newMode) return;
    this.theme.mode.set(newMode);
  }

  protected onSeedColorChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input) {
      this.theme.seedColor.set(input.value);
    }
  }
}

const themeDialog = defineKtDialog<void, void>();

export const injectThemeDialog = () => themeDialog.injectOpener(ThemeDialog, { presentation: 'centered-sheet' });
