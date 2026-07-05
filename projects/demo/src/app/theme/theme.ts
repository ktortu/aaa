import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

/** Thèmes proposés par la démo. `default` = aucun attribut data-theme (CSS de base).
    Les feuilles correspondantes sont importées dans `src/styles.css`
    (`@ktortu/aaa/themes/theme-<id>.css`). */
export const KT_THEMES = [
  { id: 'default', label: 'Défaut' },
  // Répliques de design systems (valeur directe pour le dev consommateur)
  { id: 'material', label: 'Material 3' },
  { id: 'material-you', label: 'Material You (seed)' },
  { id: 'primer', label: 'GitHub Primer' },
  { id: 'carbon', label: 'IBM Carbon' },
  { id: 'fluent', label: 'Fluent 2' },
  { id: 'ant', label: 'Ant Design' },
  { id: 'bootstrap', label: 'Bootstrap 5' },
  // Dark prêts à l'emploi
  { id: 'catppuccin', label: 'Catppuccin (dark)' },
  { id: 'architecte', label: 'Architecte (dark)' },
  // Identité produit
  { id: 'vegetal', label: 'Végétal' },
  // Vitrines d'expressivité des tokens
  { id: 'cyberpunk', label: 'Cyberpunk (animé)' },
  { id: 'aurora', label: 'Aurora (ombres)' },
] as const;

export type KtThemeId = (typeof KT_THEMES)[number]['id'];

function isThemeId(value: string | null): value is KtThemeId {
  return value !== null && KT_THEMES.some((t) => t.id === value);
}

export const KT_THEME_MODES = [
  { id: 'system', label: 'Système' },
  { id: 'light', label: 'Clair' },
  { id: 'dark', label: 'Sombre' },
] as const;

export type KtThemeMode = (typeof KT_THEME_MODES)[number]['id'];

function isThemeMode(value: string | null): value is KtThemeMode {
  return value !== null && KT_THEME_MODES.some((m) => m.id === value);
}

/** Thème courant de la démo, persisté en localStorage. Garde au boot : un id persisté qui
    n'existe plus (thème supprimé) retombe sur `default`.
    Reflète le signal sur l'attribut `data-theme` de <html> : les feuilles importées dans
    src/styles.css redéclarent les tokens sous :root[data-theme='x']. */
@Injectable({ providedIn: 'root' })
export class KtTheme {
  private readonly doc = inject(DOCUMENT);

  readonly current = signal<KtThemeId>(
    (() => {
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('kt-theme') : null;
      return isThemeId(stored) ? stored : 'default';
    })(),
  );

  readonly mode = signal<KtThemeMode>(
    (() => {
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('kt-theme-mode') : null;
      return isThemeMode(stored) ? stored : 'system';
    })(),
  );

  readonly seedColor = signal<string>(
    (() => {
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('kt-theme-seed') : null;
      return stored ?? '#0b6e63';
    })(),
  );

  constructor() {
    effect(() => {
      const theme = this.current();
      const mode = this.mode();
      const root = this.doc.documentElement;

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('kt-theme', theme);
        localStorage.setItem('kt-theme-mode', mode);
      }

      if (theme === 'default') {
        root.removeAttribute('data-theme');
      } else {
        root.setAttribute('data-theme', theme);
      }

      if (mode === 'dark' || mode === 'light') {
        root.style.colorScheme = mode;
      } else {
        root.style.colorScheme = 'light dark';
      }

      if (theme === 'material-you') {
        const seed = this.seedColor();
        root.style.setProperty('--myou-seed', seed);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('kt-theme-seed', seed);
        }
      } else {
        root.style.removeProperty('--myou-seed');
      }
    });
  }
}
