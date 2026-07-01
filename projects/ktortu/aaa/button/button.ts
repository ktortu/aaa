import {
  DestroyRef,
  Directive,
  ElementRef,
  InjectionToken,
  Provider,
  booleanAttribute,
  computed,
  inject,
  input,
  AfterViewInit,
  PLATFORM_ID,
  effect,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { KT_AUDIT_ENABLED } from '@ktortu/aaa/cdk';

/** Axe "emphase" (apparence). */
export type KtButtonMode = 'filled' | 'tonal' | 'outlined' | 'text';
/** Axe "intention" (couleur sémantique). */
export type KtButtonColor = 'primary' | 'neutral' | 'danger';
/** Taille (la cible md ~44-48px vise le confort tactile / AAA). */
export type KtButtonSize = 'sm' | 'md' | 'lg';

/** Défauts applicables à tous les `[ktButton]` (surchargeables par bouton via les inputs). */
export interface KtButtonConfig {
  /** Garde le bouton focusable même désactivé (via `aria-disabled`). */
  disabledInteractive: boolean;
  /** Emphase visuelle par défaut (apparence). */
  mode: KtButtonMode;
  /** Intention sémantique par défaut (couleur). */
  color: KtButtonColor;
  /** Taille par défaut. */
  size: KtButtonSize;
}

export const KT_BUTTON_CONFIG = new InjectionToken<Partial<KtButtonConfig>>('KT_BUTTON_CONFIG');

/**
 * Fournit des défauts de bouton (mode/couleur/taille…) pour un sous-arbre ou l'application entière.
 *
 * @example
 * ```ts
 * providers: [provideKtButton({ mode: 'tonal', size: 'lg' })]
 * ```
 */
export function provideKtButton(config: Partial<KtButtonConfig>): Provider {
  return { provide: KT_BUTTON_CONFIG, useValue: config };
}

/**
 * Bouton ou lien stylé par la directive `ktButton`. À poser sur un `<button>`
 * (action) ou un `<a>` (navigation) — l'accessibilité s'adapte automatiquement
 * (un `<a>` désactivé bascule sur `aria-disabled` plutôt que `disabled`).
 *
 * @example
 * ```html
 * <button ktButton mode="filled" color="primary">Enregistrer</button>
 * <a ktButton mode="text" href="/aide">Aide</a>
 * <button ktButton iconOnly icon="close" ariaLabel="Fermer"></button>
 * ```
 */
@Directive({
  selector: 'button[ktButton], a[ktButton]',
  host: {
    '[attr.data-mode]': 'mode()',
    '[attr.data-color]': 'color()',
    '[attr.data-size]': 'size()',
    '[attr.data-full-width]': 'fullWidth() ? "" : null',
    '[attr.data-icon-only]': 'iconOnly() ? "" : null',
    '[attr.type]': '!isLink ? type() : null',
    '[attr.aria-label]': 'resolvedAriaLabel()',
    '[class.loading]': 'loading()',
    '[class.disabled]': 'isDisabled()',
    '[attr.data-icon]': 'icon()',
    '[attr.data-icon-position]': 'iconPosition()',
    '[attr.disabled]': 'isDisabled() && !disabledInteractive() && !isLink ? "" : null',
    '[attr.aria-disabled]': 'isDisabled() && (disabledInteractive() || isLink) ? "true" : null',
    '[attr.tabindex]': 'isDisabled() && !disabledInteractive() && isLink ? "-1" : null',
    '[attr.aria-busy]': 'loading() ? "true" : null',
    '(click)': 'haltDisabledEvents($event)',
  },
})
export class KtButton implements AfterViewInit {
  private readonly config = inject(KT_BUTTON_CONFIG, { optional: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly platformId = inject(PLATFORM_ID);
  private isDestroyed = false;
  private readonly viewInitialized = signal(false);
  private readonly auditEnabled = inject(KT_AUDIT_ENABLED);

  // Un <a> reste toujours focusable : on bascule sur aria-disabled au lieu du disabled natif.
  protected readonly isLink = this.host.tagName === 'A';
  // aria-label natif posé par le consommateur, capté à la construction (préservé si l'input n'est pas fourni).
  private readonly nativeAriaLabel = this.host.getAttribute('aria-label');

  /** Emphase visuelle du bouton (apparence, ≠ `type`). @default 'filled' (ou KT_BUTTON_CONFIG.mode) */
  readonly mode = input<KtButtonMode>(this.config?.mode ?? 'filled');

  /** Intention sémantique (couleur). @default 'primary' (ou KT_BUTTON_CONFIG.color) */
  readonly color = input<KtButtonColor>(this.config?.color ?? 'primary');

  /** Taille ; `md` vise une cible tactile ~44-48px. @default 'md' (ou KT_BUTTON_CONFIG.size) */
  readonly size = input<KtButtonSize>(this.config?.size ?? 'md');

  /** Étire le bouton sur toute la largeur disponible. @default false */
  readonly fullWidth = input<boolean, unknown>(false, { transform: booleanAttribute });

  /** Bouton carré sans texte ; impose un nom accessible via `ariaLabel`. @default false */
  readonly iconOnly = input<boolean, unknown>(false, { transform: booleanAttribute });

  /** Nom accessible. **Obligatoire si `iconOnly`** ; à défaut, l'`aria-label` natif est préservé. @default undefined */
  readonly ariaLabel = input<string>();

  /** Attribut HTML natif (comportement formulaire), distinct de `mode`. @default 'button' */
  readonly type = input<'button' | 'submit' | 'reset'>('button');

  /** Affiche l'état de chargement et rend le bouton inerte (`aria-busy`). @default false */
  readonly loading = input<boolean, unknown>(false, { transform: booleanAttribute });

  /** Nom de l'icône (rendu via CSS `data-icon`). @default undefined */
  readonly icon = input<string>();

  /** Position de l'icône relative au texte. @default 'start' */
  readonly iconPosition = input<'start' | 'end'>('start');

  /** Désactive le bouton. @default false */
  readonly disabled = input<boolean, unknown>(false, { transform: booleanAttribute });

  /** Garde le bouton focusable même désactivé (via `aria-disabled`). @default false (ou KT_BUTTON_CONFIG.disabledInteractive) */
  readonly disabledInteractive = input<boolean, unknown>(this.config?.disabledInteractive ?? false, {
    transform: booleanAttribute,
  });

  // loading implique un bouton inerte
  protected readonly isDisabled = computed(() => this.disabled() || this.loading());

  // input prioritaire, sinon aria-label natif préservé (non destructif), sinon rien.
  protected readonly resolvedAriaLabel = computed(() => this.ariaLabel()?.trim() || this.nativeAriaLabel || null);

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.isDestroyed = true;
    });

    effect(() => {
      if (this.isDestroyed) return;
      if (!isPlatformBrowser(this.platformId)) return;
      if (!this.viewInitialized()) return;
      if (!this.auditEnabled || !this.iconOnly()) return;

      if (!this.icon()) {
        console.warn('[ktButton] iconOnly attend une icône via [icon].');
      }
      if (!this.resolvedAriaLabel() && !this.host.hasAttribute('aria-labelledby')) {
        console.warn(
          '[ktButton] iconOnly sans nom accessible : ajoutez [ariaLabel] (WCAG 4.1.2) — ' +
            'le bouton serait annoncé sans libellé.',
        );
      }
    });
  }

  ngAfterViewInit(): void {
    this.viewInitialized.set(true);
  }

  protected haltDisabledEvents(event: Event): void {
    if (!this.isDisabled()) return;

    event.preventDefault();
    event.stopImmediatePropagation();
  }
}
