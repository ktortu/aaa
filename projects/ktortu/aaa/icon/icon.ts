import {
  Directive,
  ElementRef,
  InjectionToken,
  PLATFORM_ID,
  Provider,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { KT_AUDIT_ENABLED } from '@ktortu/aaa/cdk';

/**
 * Définition d'une police d'icônes **à ligatures** enregistrée dans le registre (cf.
 * {@link KtIconConfig}). Le registre ne charge AUCUNE police : il se contente d'associer un alias
 * court à la famille CSS réelle (à vous de charger le fichier de police, façon « apportez la vôtre »).
 */
export interface KtIconFont {
  /** Famille de police CSS réelle (ex. `'Material Symbols Rounded'`). Valeur `font-family` brute :
      si elle commence par un chiffre ou contient des caractères spéciaux, la citer vous-même. */
  family: string;
  /** Graisse par défaut de cette police (ex. `300` ou `'normal'`). @default hérité de `--kt-icon-font-weight` */
  weight?: string | number;
  /** `font-variation-settings` par défaut (polices variables, ex. `"'FILL' 0, 'wght' 300"`). @default `normal` */
  variationSettings?: string;
}

/**
 * Défauts applicables à toutes les icônes `[ktIcon]` (registre de polices + police par défaut),
 * fournis via {@link provideKtIcon}. Fourni en `Partial` : on ne déclare que ce qu'on veut.
 */
export interface KtIconConfig {
  /** Registre `alias → police`. L'alias est ensuite choisi sur la primitive via `[font]`. */
  fonts: Record<string, KtIconFont>;
  /** Alias utilisé quand aucune police n'est précisée sur la primitive (`[font]` absent). */
  defaultFont: string;
}

/**
 * Interface d'**enregistrement des alias de POLICE** à augmenter côté application pour typer l'input
 * `[font]` et obtenir son **autocomplétion** dans les templates. Vide par défaut : sans augmentation,
 * `[font]` accepte n'importe quelle chaîne (dégradation gracieuse, zéro config).
 *
 * Nommée `KtIconFontRegistry` (et non `KtIconRegistry`) à dessein : le nom générique reste réservé à
 * un futur registre de **noms d'icônes** (SVG), qui bénéficiera du même mécanisme.
 *
 * @example Recette à source unique (le même objet type ET fournit le registre) :
 * ```ts
 * // app-icons.ts
 * export const APP_ICON_FONTS = {
 *   material: { family: 'Material Symbols Outlined' },
 *   rounded: { family: 'Material Symbols Rounded', variationSettings: "'FILL' 0, 'wght' 300" },
 * } as const;
 *
 * declare module '@ktortu/aaa/icon' {
 *   // Injecte les clés de APP_ICON_FONTS comme alias connus → autocomplétion de [font].
 *   // eslint-disable-next-line @typescript-eslint/no-empty-object-type
 *   interface KtIconFontRegistry extends Record<keyof typeof APP_ICON_FONTS, unknown> {}
 * }
 *
 * // app.config.ts
 * providers: [provideKtIcon({ fonts: APP_ICON_FONTS, defaultFont: 'material' })];
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- point d'extension à augmenter côté app.
export interface KtIconFontRegistry {}

/**
 * Alias de police connus : l'union des clés de {@link KtIconFontRegistry} une fois augmentée, sinon
 * `string` (registre vide → chaîne libre). Le tuple `[…] extends […]` évite la distribution du
 * conditionnel sur l'union.
 */
export type KtIconFontAlias = [keyof KtIconFontRegistry] extends [never] ? string : keyof KtIconFontRegistry;

export const KT_ICON_CONFIG = new InjectionToken<Partial<KtIconConfig>>('KT_ICON_CONFIG');

/**
 * Fournit un registre de polices d'icônes (alias → famille) et l'alias par défaut, pour un
 * sous-arbre ou l'application entière. Combiné à l'augmentation de {@link KtIconFontRegistry}, il
 * offre l'autocomplétion typée de l'input `[font]`.
 *
 * `defaultFont` est **contraint aux clés de `fonts`** passées dans le même appel : un typo devient
 * une erreur de compilation (pas de repli silencieux de toutes les icônes sur la police globale).
 *
 * @example
 * ```ts
 * providers: [
 *   provideKtIcon({
 *     fonts: {
 *       material: { family: 'Material Symbols Outlined' },
 *       rounded: { family: 'Material Symbols Rounded' },
 *     },
 *     defaultFont: 'material', // 'rouded' → erreur TS
 *   }),
 * ];
 * ```
 */
export function provideKtIcon<F extends Record<string, KtIconFont>>(config: {
  fonts?: F;
  defaultFont?: keyof F & string;
}): Provider {
  return { provide: KT_ICON_CONFIG, useValue: config };
}

/**
 * Primitive d'icône **autonome** : pose une icône seule (en-tête, item de liste, badge d'état…),
 * là où le bouton et les champs ne suffisent pas. Directive présentationnelle — **jamais focusable
 * ni cliquable** (pour une icône cliquable, utilisez `ktButton iconOnly`).
 *
 * Sélecteur d'attribut `[ktIcon]` (camelCase) ; l'hôte reçoit la classe stable `.kt-icon` (cible du
 * style et du harness). Ne pas confondre avec le slot de projection `[kt-icon]` (kebab) de
 * `kt-nav-item`, qui est un autre mécanisme.
 *
 * Deux régimes, comme dans le reste de la lib :
 * - **Ligature** (`[ktIcon]="nom"`) : le nom devient un glyphe via une police d'icônes à ligatures
 *   (défaut `--kt-icon-font` → Material Symbols Outlined). Choisissez une autre police enregistrée
 *   via `[font]`.
 * - **Projection** (set à classes, ex. Font Awesome, ou SVG en ligne) : laissez `ktIcon` vide et
 *   projetez votre markup dans l'élément ; la primitive ne fait que l'habiller (taille, couleur
 *   héritée, alignement). Le contenu projeté **ne doit jamais être focusable** (l'hôte décoratif
 *   porte `aria-hidden` : un descendant focusable violerait WCAG 4.1.2).
 *
 * Accessibilité : **décorative par défaut** (`aria-hidden`). Fournissez `[ariaLabel]` (ou un
 * `aria-label` natif) pour une icône **porteuse de sens** (bascule en `role="img"`).
 *
 * @example
 * ```html
 * <!-- Ligature autonome, taille et couleur héritées du contexte ; `fill` = version remplie -->
 * <span ktIcon="home"></span>
 * <span ktIcon="favorite" fill size="2rem" style="color: var(--kt-primary)"></span>
 *
 * <!-- Set à classes (Font Awesome) : projection, ktIcon reste vide -->
 * <span ktIcon><i class="fa-solid fa-user"></i></span>
 *
 * <!-- Icône porteuse de sens (nommée pour les lecteurs d'écran) -->
 * <span ktIcon="error" ariaLabel="Erreur" style="color: var(--kt-danger)"></span>
 * ```
 */
@Directive({
  selector: '[ktIcon]',
  host: {
    // Marqueur stable posé quel que soit le mode d'usage (`ktIcon="x"` OU `[ktIcon]="x"`) : un binding
    // de propriété ne reflète AUCUN attribut dans le DOM, donc le CSS/harness ne peuvent pas cibler
    // `[ktIcon]`. La classe, elle, est toujours présente → cible du style et du harness.
    class: 'kt-icon',
    '[attr.data-icon]': 'renderedName()',
    '[style.--kt-icon-font]': 'resolvedFamily()',
    '[style.--kt-icon-font-weight]': 'resolvedWeight()',
    '[style.--kt-icon-font-variation]': 'resolvedVariation()',
    '[style.--kt-icon-size]': 'size() || null',
    '[attr.role]': 'accessibleLabel() ? "img" : null',
    '[attr.aria-label]': 'accessibleLabel()',
    '[attr.aria-hidden]': 'accessibleLabel() ? null : "true"',
  },
})
export class KtIcon {
  private readonly config = inject(KT_ICON_CONFIG, { optional: true });
  private readonly auditEnabled = inject(KT_AUDIT_ENABLED);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  // aria-label natif posé par le consommateur, capté à la construction (préservé si l'input est absent).
  private readonly nativeAriaLabel = this.host.getAttribute('aria-label');

  /** Nom de l'icône (ligature). Laisser vide pour projeter un set à classes / un SVG. @default '' */
  readonly ktIcon = input<string>('');

  /** Alias de police d'icônes du registre (cf. {@link provideKtIcon}). @default `KtIconConfig.defaultFont` */
  readonly font = input<KtIconFontAlias>();

  /** Nom accessible : le fournir rend l'icône **porteuse de sens** (`role="img"`). Aligné sur `ktButton`.
      @default undefined (icône décorative ; un `aria-label` natif reste toutefois préservé) */
  readonly ariaLabel = input<string>();

  /** Taille de l'icône (longueur CSS, ex. `'24px'`, `'2rem'`, `'1.5em'`). @default `1.25em` (héritée du contexte) */
  readonly size = input<string>();

  /** Version **remplie** plutôt que contour, pour les polices variables à axe `FILL` (Material Symbols).
      Force `FILL` à 1 en préservant les autres axes (graisse…) ; sans effet sur une police sans cet axe.
      Nécessite une police chargée **avec l'axe FILL ajustable** (ex. Google Fonts :
      `…Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200`).
      @default false (contour) */
  readonly fill = input<boolean, unknown>(false, { transform: booleanAttribute });

  /** Nom rendu en ligature : coupé, `null` si vide (aucun `::before`, laisse place à la projection). */
  protected readonly renderedName = computed(() => this.ktIcon()?.trim() || null);

  /** Libellé accessible résolu : input prioritaire, sinon `aria-label` natif préservé, sinon `null` (décorative). */
  protected readonly accessibleLabel = computed(() => this.ariaLabel()?.trim() || this.nativeAriaLabel || null);

  /** Police résolue depuis le registre : alias explicite, sinon police par défaut du provider. */
  private readonly resolvedFont = computed<KtIconFont | undefined>(() => {
    const alias = this.font() ?? this.config?.defaultFont;
    if (!alias) return undefined;
    return this.config?.fonts?.[alias as string];
  });

  protected readonly resolvedFamily = computed(() => this.resolvedFont()?.family ?? null);
  protected readonly resolvedWeight = computed(() => {
    const weight = this.resolvedFont()?.weight;
    return weight == null ? null : String(weight);
  });
  protected readonly resolvedVariation = computed(() => {
    const base = this.resolvedFont()?.variationSettings ?? null;
    if (!this.fill()) return base;
    // Rempli : on force l'axe FILL à 1. En cas d'axe dupliqué, la DERNIÈRE valeur prime (spec CSS
    // Fonts) → on préserve les autres axes de la police du registre (graisse, GRAD, opsz…).
    return base ? `${base}, 'FILL' 1` : `'FILL' 1`;
  });

  constructor() {
    // Garde-fou dev : un alias absent du registre (input [font] OU defaultFont) retombe silencieusement
    // sur --kt-icon-font. On résout l'alias effectif pour aussi couvrir un defaultFont mal orthographié.
    effect(() => {
      if (!this.auditEnabled || !isPlatformBrowser(this.platformId)) return;
      const alias = this.font() ?? this.config?.defaultFont;
      if (alias && !this.config?.fonts?.[alias as string]) {
        console.warn(
          `[ktIcon] police "${String(alias)}" absente du registre : ` +
            'enregistrez-la via provideKtIcon({ fonts }) — repli sur --kt-icon-font.',
        );
      }
    });
  }
}
