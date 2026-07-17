import { NgTemplateOutlet, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  TemplateRef,
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  output,
  signal,
  viewChildren,
  untracked,
  ChangeDetectorRef,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { type KtKeyish, accessor, defaultIdentity, defaultLabel } from '../keyish';
import { KtChip } from './chip';
import { KtChipItemDef, type KtChipItemContext } from './chip-item-def';
import { ChipTransitionScope } from './chip-transition-scope';
import { KT_CHIPS_CONFIG } from './chips-config';
import { KtIdGenerator } from '@ktortu/aaa/cdk';

/** Délai avant effacement de l'annonce de retrait (live region). */
const STATUS_CLEAR_MS = 2000;

/**
 * Liste de chips révocables (`role="list"`) : repli au-delà de `maxVisible` (« +N more »),
 * annonces lecteur d'écran (live region TOUJOURS rendue, y compris liste vide) et gestion
 * du focus au retrait (chip suivant, sinon `emptyFocusTarget`).
 * La liste ne possède PAS la donnée : le retrait émet `removed` et le parent met à jour
 * `items` (pattern contrôlé). Rendu custom par chip via `ng-template[ktChipItem]` (projeté)
 * ou `[chipTemplate]` (TemplateRef forwardé, ex. depuis MultiSelect) — le focus management
 * ne voit pas les boutons des templates custom (view queries non traversantes) : le repli
 * `emptyFocusTarget` couvre ce cas.
 *
 * @example
 * ```html
 * <kt-chip-list [items]="tags()" [maxVisible]="3" (removed)="onRemoved($event)" />
 * ```
 */
@Component({
  selector: 'kt-chip-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chip-list.html',
  styleUrl: './chip-list.css',
  imports: [KtChip, NgTemplateOutlet],
  providers: [{ provide: ChipTransitionScope, useExisting: KtChipList }],
  host: {
    '[attr.data-empty]': "items().length === 0 ? '' : null",
    // Marqueur de portée pendant la View Transition : les règles globales (tokens.css) ne
    // nomment les chips à template custom QUE sous ce marqueur (cf. ChipTransitionScope).
    '[attr.data-vt-active]': "transitioning() ? '' : null",
    '(keydown)': 'onKeydown($event)',
    '(focusin)': 'onFocusin($event)',
  },
})
export class KtChipList<T> implements ChipTransitionScope {
  private readonly config = inject(KT_CHIPS_CONFIG, { optional: true });
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly doc = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly cdr = inject(ChangeDetectorRef);

  /** Vrai pendant la View Transition de CETTE liste : les chips (standards via Chip,
      custom via tokens.css) ne portent leur `view-transition-name` que dans cette fenêtre. */
  readonly transitioning = signal(false);

  /** Items affichés sous forme de chips (la liste ne possède pas la donnée : pattern contrôlé). */
  readonly items = input.required<readonly T[]>();
  /** Libellé d'un item : clé OU fonction. @default `label`/`name`, sinon `String(item)` */
  readonly itemLabel = input<KtKeyish<T, string>>();
  /** Identité d'un item (track du @for) : clé OU fonction. @default `id`/`value`, sinon l'item */
  readonly itemKey = input<KtKeyish<T, unknown>>();
  /** Chips révocables (bouton « retirer » par chip). @default true */
  readonly removable = input(true, { transform: booleanAttribute });
  /** Liste désactivée (boutons « retirer » présents mais inactifs). @default false */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Lecture seule : les boutons « retirer » sont absents (≠ disabled : présents mais inactifs). @default false */
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Nombre maximal de chips affichés avant repli derrière « +N more ». @default undefined (illimité) */
  readonly maxVisible = input<number>();
  /** Libellé accessible de la liste (`aria-label`). Défaut : `KT_CHIPS_CONFIG.listLabel` ou « Selected items ». */
  readonly listLabel = input<string>();
  /** Construit le libellé du bouton « retirer » à partir du libellé de l'item. @default `« Remove {label} »` */
  readonly removeItemLabel = input<(itemLabel: string) => string>();
  /** Construit le message d'annonce après retrait (live region). @default `« {label} removed »` */
  readonly itemRemovedText = input<(itemLabel: string) => string>();
  /** Construit le libellé du bouton de repli à partir du nombre masqué. @default `« +{n} more »` */
  readonly moreLabel = input<(hiddenCount: number) => string>();
  /** Libellé du bouton qui replie la liste dépliée. Défaut : `KT_CHIPS_CONFIG.lessLabel` ou « Show less ». */
  readonly lessLabel = input<string>();
  /** Template custom forwardé (alternative au `ng-template[ktChipItem]` projeté). @default null */
  readonly chipTemplate = input<TemplateRef<KtChipItemContext<T>> | null>(null);
  /** Élément à focuser quand le dernier chip est retiré (ex. le trigger du champ parent). @default undefined */
  readonly emptyFocusTarget = input<HTMLElement>();

  /** Émis quand un chip est retiré (le parent doit retirer l'item de `items`).
      Payload : `{ item, index }` — l'item retiré et son index dans `items` au moment du retrait. */
  readonly removed = output<{ item: T; index: number }>();

  protected readonly itemDef = contentChild(KtChipItemDef);
  private readonly chips = viewChildren(KtChip);

  // Sélecteurs des focusables (source unique, dédupliquée) : boutons « retirer » + focusables de
  // templates custom, avec (séquence clavier complète / roving) ou sans (cible de focus au retrait)
  // le bouton de repli « +N more ».
  private static readonly CHIP_FOCUSABLES =
    '.kt-chip__remove, .kt-chip-list__item button, .kt-chip-list__item [tabindex]';
  private static readonly ROVING_FOCUSABLES = `${KtChipList.CHIP_FOCUSABLES}, .kt-chip-list__more`;

  private query(selector: string): HTMLElement[] {
    return Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>(selector));
  }

  /** Index de l'unique focusable portant `tabindex="0"` : point d'entrée clavier UNIQUE dans la
      liste (pattern composite WAI-ARIA). Les flèches/Home/End le déplacent ; un focus direct
      (souris) le resynchronise via `onFocusin`. */
  protected readonly activeIndex = signal(0);

  // --- Textes résolus (input > KT_CHIPS_CONFIG > défaut lib neutre EN) ---
  protected readonly resolvedListLabel = computed(() => this.listLabel() ?? this.config?.listLabel ?? 'Selected items');
  private readonly resolvedRemoveItemLabel = computed(
    () => this.removeItemLabel() ?? this.config?.removeItemLabel ?? ((l: string) => `Remove ${l}`),
  );
  private readonly resolvedItemRemovedText = computed(
    () => this.itemRemovedText() ?? this.config?.itemRemovedText ?? ((l: string) => `${l} removed`),
  );
  protected readonly resolvedMoreLabel = computed(
    () => this.moreLabel() ?? this.config?.moreLabel ?? ((n: number) => `+${n} more`),
  );
  protected readonly resolvedLessLabel = computed(() => this.lessLabel() ?? this.config?.lessLabel ?? 'Show less');

  // --- Accès aux items ---
  private readonly labelAccessor = computed(() => accessor<T, string>(this.itemLabel(), defaultLabel));
  private readonly keyAccessor = computed(() => accessor<T, unknown>(this.itemKey(), defaultIdentity));

  protected labelOf(item: T): string {
    return this.labelAccessor()(item);
  }
  protected keyOf(item: T): unknown {
    return this.keyAccessor()(item);
  }
  protected removeLabelFor(item: T): string {
    return this.resolvedRemoveItemLabel()(this.labelOf(item));
  }

  /** Template effectif : contenu projeté (ktChipItem) prioritaire sur l'input forwardé. */
  protected readonly effectiveTemplate = computed(() => this.itemDef()?.template ?? this.chipTemplate());

  protected readonly showRemove = computed(() => this.removable() && !this.readonly());

  // --- Repli au-delà de maxVisible ---
  protected readonly expanded = signal(false);
  protected readonly overflow = computed(() => {
    const max = this.maxVisible();
    return max !== undefined && this.items().length > max;
  });
  protected readonly hiddenCount = computed(() => {
    const max = this.maxVisible();
    if (max === undefined || this.expanded()) return 0;
    return Math.max(0, this.items().length - max);
  });
  protected readonly visibleItems = computed<readonly T[]>(() => {
    const all = this.items();
    const max = this.maxVisible();
    if (max === undefined || this.expanded() || all.length <= max) return all;
    return all.slice(0, max);
  });

  // --- Live region (toujours rendue, y compris liste vide) ---
  protected readonly status = signal('');
  private statusTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    // Repli automatique quand la liste repasse sous le seuil.
    effect(() => {
      if (this.overflow()) return;
      untracked(() => {
        this.expanded.set(false);
      });
    });

    // Roving tabindex : un seul focusable porte tabindex=0 (les autres -1), recalculé après chaque
    // rendu (items/repli/index actif). Garantit un point d'entrée clavier UNIQUE (Tab) ; la
    // navigation interne reste aux flèches/Home/End.
    afterRenderEffect(() => {
      this.visibleItems();
      this.expanded();
      const active = this.activeIndex();
      const focusables = this.query(KtChipList.ROVING_FOCUSABLES);
      if (focusables.length === 0) return;
      const clamped = Math.min(Math.max(active, 0), focusables.length - 1);
      for (let i = 0; i < focusables.length; i++) {
        focusables[i].tabIndex = i === clamped ? 0 : -1;
      }
    });

    inject(DestroyRef).onDestroy(() => clearTimeout(this.statusTimer));
  }

  private readonly idGen = inject(KtIdGenerator);
  protected readonly moreBtnTransitionName = `chip-list-more-${this.idGen.generateId('chip-list')}`;

  /** Annonce un message dans la live region de la liste (effacé après ~2 s).
      Public : permet au parent d'annoncer des actions liées (ex. « tout effacer »). */
  announce(text: string): void {
    clearTimeout(this.statusTimer);
    this.status.set(text);
    this.statusTimer = setTimeout(() => this.status.set(''), STATUS_CLEAR_MS);
  }

  private activeTransition: ViewTransition | null = null;

  /**
   * Vrai sur le moteur WebKit (Safari desktop + TOUS les navigateurs iOS, qui embarquent WebKit).
   *
   * Contournement DOCUMENTÉ et RÉVERSIBLE d'un bug de compositing des View Transitions au niveau
   * document sur WebKit : après la transition, les chips (hôtes d'éléments custom dont le
   * `view-transition-name` est posé puis retiré dynamiquement) ne se repeignent pas — seules les
   * croix « retirer » (boutons natifs, compositées sur une couche distincte) subsistent à l'écran.
   * Touche aussi bien le retrait que le déplier/replier : les deux passent par ce wrapper.
   *
   * Le défaut n'est PAS feature-detectable : `startViewTransition` répond présente puis rate le
   * rendu final, d'où la détection de MOTEUR. `navigator.vendor` est gelé pour compat — vaut
   * « Apple Computer, Inc. » sur WebKit UNIQUEMENT (Blink = « Google Inc. », Gecko = « »). On NE
   * gate PAS sur l'absence de la variante scopée `element.startViewTransition` : cela exclurait
   * Firefox à tort (transition document parfaitement rendue chez lui). À RETIRER quand Safari
   * corrigera le compositing.
   */
  private isWebKitEngine(): boolean {
    return this.doc.defaultView?.navigator.vendor === 'Apple Computer, Inc.';
  }

  /** Exécute `action` dans une View Transition (morph des chips qui se déplacent, entrée/sortie
      stylées via `::view-transition-*(.chip-transition)` — cf. tokens.css). Transition SCOPÉE à
      l'élément quand le navigateur le permet (`element.startViewTransition`, Chrome 147+) ; sinon
      transition document — dans les deux cas, seuls les chips de CETTE liste sont nommés (cf.
      `transitioning`). Fallback : action directe (retrait/dépli instantané, état final garanti
      correct) si l'API est absente, si l'utilisateur préfère moins de mouvement, ou sur WebKit
      (bug de compositing, cf. `isWebKitEngine`). */
  private withViewTransition(action: () => void): void {
    if (!isPlatformBrowser(this.platformId)) {
      action();
      return;
    }
    // Garde matchMedia : absent en SSR/jsdom (même convention que le gating mobile du select).
    const prefersReducedMotion =
      typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Enhancement progressif : transition scopée au sous-arbre de la liste si disponible
    // (capture moins chère, le reste de la page n'est pas concerné), sinon document entier.
    const hostEl = this.host.nativeElement as HTMLElement & {
      startViewTransition?: (update: () => void) => ViewTransition;
    };
    const startViewTransition =
      hostEl.startViewTransition?.bind(hostEl) ??
      (this.doc.startViewTransition?.bind(this.doc) as typeof hostEl.startViewTransition);
    // WebKit : court-circuit AVANT tout nommage — sinon les chips restent fantômes (bug iOS).
    if (!startViewTransition || prefersReducedMotion || this.isWebKitEngine()) {
      action();
      return;
    }

    // Interactions rapprochées : Chrome DIFFÈRE le callback d'une transition démarrée pendant
    // qu'une autre est active (UI périmée pour le clic suivant, update parfois perdue — vérifié).
    // On n'empile donc jamais : la transition en vol est sautée (son callback en attente est
    // flushé par skipTransition) et l'action s'applique directement, sans animation.
    if (this.activeTransition) {
      this.activeTransition.skipTransition();
      this.activeTransition = null;
      action();
      return;
    }

    // Nommer les chips de CETTE liste AVANT la capture de l'état « avant » (rendu synchrone
    // obligatoire : un nom absent du snapshot « avant » ferait passer chaque chip pour un
    // entrant). Les chips des autres listes restent anonymes => ils suivent le fondu racine.
    this.transitioning.set(true);
    this.cdr.detectChanges();

    const vt = startViewTransition(() => {
      // `items` est un input POSSÉDÉ par le parent (`[items]="selectedOptions()"` côté MultiSelect) :
      // le retrait émet `removed`, le parent met à jour son signal, et seule une CD du PARENT re-pousse
      // le nouvel `items` dans cette liste. Une CD locale (`cdr.detectChanges()`) ne verrait que l'ancien
      // input → snapshot « après » identique au « avant » → aucune animation. Une CD globale forcée
      // (`appRef.tick()`) corrigerait le rendu mais ajouterait une passe synchrone sur toute l'appli à
      // chaque retrait. On préfère DIFFÉRER la capture de l'état « après » : le callback d'une View
      // Transition peut renvoyer une Promise, le navigateur attend sa résolution avant le snapshot.
      // La mutation passe par un signal (le parent met à jour `items`) : en zoneless, c'est ce signal
      // qui planifie la CD (OnPush, seules les vues « dirty » sont vérifiées) ; on résout au prochain rendu.
      action();
      return new Promise<void>((resolve) => {
        let settled = false;
        const done = () => {
          if (settled) return;
          settled = true;
          resolve();
        };
        afterNextRender({ read: done }, { injector: this.injector });
        // Garde-fou : si aucun rendu n'est planifié (retrait ignoré par le parent), ne pas figer la page.
        setTimeout(done, 100);
      });
    });
    this.activeTransition = vt;
    // `ready` rejette (AbortError) si la transition est sautée : attendu, ne pas laisser
    // remonter en unhandled rejection.
    vt.ready.catch(() => undefined);
    vt.finished.finally(() => {
      if (this.activeTransition === vt) this.activeTransition = null;
      this.transitioning.set(false);
    });
  }

  /** Retrait demandé : annonce, émet vers le parent (qui met à jour `items`), puis focus
      le chip suivant — sinon `emptyFocusTarget` (le bouton focusé disparaît du DOM). */
  protected removeAt(item: T, index: number): void {
    if (this.disabled() || this.readonly()) return;
    this.announce(this.resolvedItemRemovedText()(this.labelOf(item)));

    this.withViewTransition(() => {
      this.removed.emit({ item, index });
      afterNextRender(
        {
          read: () => {
            const focusables = this.query(KtChipList.CHIP_FOCUSABLES);
            const targetIndex = Math.min(index, focusables.length - 1);
            const target = focusables[targetIndex];
            if (target) {
              this.activeIndex.set(targetIndex);
              target.focus();
              return;
            }
            this.emptyFocusTarget()?.focus();
          },
        },
        { injector: this.injector },
      );
    });
  }

  protected removeCallback(item: T, index: number): () => void {
    return () => this.removeAt(item, index);
  }

  /** Déplie/replie ; au dépliage, focus sur le premier chip nouvellement révélé. */
  protected toggleExpanded(): void {
    this.withViewTransition(() => {
      const expand = !this.expanded();
      this.expanded.set(expand);
      if (!expand) return;
      const firstRevealed = this.maxVisible() ?? 0;
      afterNextRender(
        {
          read: () => {
            const focusables = this.query(KtChipList.CHIP_FOCUSABLES);
            const target = focusables[firstRevealed];
            if (target) {
              this.activeIndex.set(firstRevealed);
              target.focus();
            }
          },
        },
        { injector: this.injector },
      );
    });
  }

  protected onKeydown(event: KeyboardEvent): void {
    const key = event.key;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key)) {
      return;
    }

    const focusables = this.query(KtChipList.ROVING_FOCUSABLES);
    if (focusables.length === 0) return;

    const currentIndex = focusables.indexOf(this.doc.activeElement as HTMLElement);

    let nextIndex = -1;
    if (key === 'ArrowRight' || key === 'ArrowDown') {
      nextIndex = currentIndex + 1;
    } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
      nextIndex = currentIndex - 1;
    } else if (key === 'Home') {
      nextIndex = 0;
    } else if (key === 'End') {
      nextIndex = focusables.length - 1;
    }

    if (nextIndex >= 0 && nextIndex < focusables.length) {
      event.preventDefault();
      this.activeIndex.set(nextIndex);
      focusables[nextIndex].focus();
    }
  }

  /** Resynchronise le point de tabulation unique sur l'élément réellement focusé (souris/voix). */
  protected onFocusin(event: FocusEvent): void {
    const index = this.query(KtChipList.ROVING_FOCUSABLES).indexOf(event.target as HTMLElement);
    if (index >= 0) this.activeIndex.set(index);
  }
}
