import {
  DestroyRef,
  Directive,
  ElementRef,
  Signal,
  TemplateRef,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  isDevMode,
  model,
  output,
  signal,
  viewChild,
  untracked,
  PLATFORM_ID,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Listbox } from '@angular/aria/listbox';
import { Combobox } from '@angular/aria/combobox';
import type { ValidationError, WithOptionalFieldTree } from '@angular/forms/signals';
import {
  KT_FIELD_CONFIG,
  type KtFieldErrorMatcher,
  defaultKtFieldErrorMatcher,
  type KtFieldAppearance,
  type KtFloatLabel,
} from '../field/field-config';
import { KtFieldErrorResolver } from '../field/error-messages';
import { KT_SELECT_CONFIG, DEFAULT_KT_SELECT_CONFIG } from '../select/select-config';
import { type KtKeyish, accessor, defaultIdentity, defaultLabel } from '../keyish';
import { KtViewport, KtIdGenerator, KtBodyScrollLock } from '@ktortu/aaa/cdk';

export type { KtKeyish } from '../keyish';

/** Annonce différée du nombre de résultats : ~500 ms après la dernière frappe (anti-spam SR). */
const ANNOUNCE_DELAY_MS = 500;

/** Normalisation du filtre par défaut : insensible à la casse ET aux accents
    (décomposition NFD puis suppression des diacritiques combinants). */
function normalizeForFilter(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** Base partagée des sélecteurs à liste fermée (Select single et MultiSelect), bâtis sur
    `@angular/aria` (Combobox + Listbox) : options et dérivation (clé/fonction), état poussé
    par `[formField]`, popup Popover responsive (dropdown ancré desktop ↔ bottom-sheet
    téléphone, drag-to-dismiss), filtrage opt-in avec live region, clavier commun (Échap
    global, Tab APG depuis le filtre). La VALEUR (`V | null` vs `V[]`) et `selectionChange`
    restent dans les sous-classes : leurs types divergent, chacune implémente seule
    `FormValueControl<…>`. Même pattern d'héritage que `BaseInputField`.

    @template T Type d'une option (élément du tableau `options`).
    @template V Type de la valeur émise par le contrôle (défaut `T` : l'objet entier ;
      ou la clé extraite quand `optionValue` est fourni). */
@Directive({
  host: {
    '(keydown)': 'onHostKeydown($event)',
  },
})
export abstract class KtBaseSelect<T, V = T> {
  protected readonly fieldConfig = inject(KT_FIELD_CONFIG, { optional: true });
  private readonly errorResolver = inject(KtFieldErrorResolver);
  protected readonly config = inject(KT_SELECT_CONFIG, { optional: true });
  protected readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly doc = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly bodyScrollLock = inject(KtBodyScrollLock);
  private wasExpanded = false;
  private scrollLocked = false;

  /** Pose/relâche le verrou de scroll du fond de façon idempotente (n'agit qu'à la transition),
      via le compteur partagé `KtBodyScrollLock` — deux sheets ouvertes ne se désynchronisent pas. */
  private setBodyScrollLock(lock: boolean): void {
    if (lock === this.scrollLocked) return;
    this.scrollLocked = lock;
    if (lock) this.bodyScrollLock.lock();
    else this.bodyScrollLock.unlock();
  }

  // --- Données / dérivation (clé OU fonction, défauts intelligents) ---
  /** Liste des options affichées (source de vérité du contrôle). */
  readonly options = input.required<readonly T[]>();
  /** Libellé affiché d'une option : clé OU fonction. Défaut : `label`/`name`, sinon `String(option)`. */
  readonly optionLabel = input<KtKeyish<T, string>>();
  /** Dérive la valeur de sortie ET l'identité d'une option.
      - Fourni (clé/fonction) ⇒ `value` = la/les clé(s) extraite(s).
      - Omis ⇒ `value` = l'objet entier ; l'identité interne dérive de `id`/`value`. */
  readonly optionValue = input<KtKeyish<T, V>>();
  /** Désactivation d'une option : clé OU fonction renvoyant un booléen. Défaut : aucune option désactivée. */
  readonly optionDisabled = input<KtKeyish<T, boolean>>();
  /** Égalité des options en mode objet (présélection). Défaut : comparaison par identité (`id`/`value`). */
  readonly compareWith = input<(a: T, b: T) => boolean>();

  /** Émis au clic sur le bouton d'aide contextuelle. */
  readonly helpClick = output<MouseEvent>();

  // --- État poussé par [formField] (même contrat que BaseInputField) ---
  /** Le champ a-t-il été visité ? Poussé par `[formField]` ; passe à `true` à la première sélection. @default false */
  readonly touched = model<boolean>(false);
  /** Champ désactivé (trigger inerte). Poussé par `[formField]`. @default false */
  readonly disabled = input<boolean, unknown>(false, { transform: booleanAttribute });
  /** Champ en lecture seule (sélection figée, valeur affichée). Poussé par `[formField]`. @default false */
  readonly readonly = input<boolean, unknown>(false, { transform: booleanAttribute });
  /** Le champ est-il invalide ? Pilote l'affichage des erreurs. Poussé par `[formField]`. @default false */
  readonly invalid = input<boolean, unknown>(false, { transform: booleanAttribute });
  /** Champ obligatoire (marqueur visuel/ARIA). Poussé par `[formField]`. @default false */
  readonly required = input<boolean, unknown>(false, { transform: booleanAttribute });
  /** Le champ a-t-il été modifié depuis sa valeur initiale ? Poussé par `[formField]`. @default false */
  readonly dirty = input<boolean, unknown>(false, { transform: booleanAttribute });
  /** Validation asynchrone en cours (poussé par `[field]`) : pose `aria-busy` + `data-pending`. @default false */
  readonly pending = input<boolean, unknown>(false, { transform: booleanAttribute });
  /** Erreurs de validation à afficher. Poussé par `[formField]`. @default [] */
  readonly errors = input<readonly WithOptionalFieldTree<ValidationError>[]>([]);
  /** Attribut `name` logique du contrôle (à titre indicatif). @default '' */
  readonly name = input<string>('');

  // --- Présentation ---
  /** id imposé (sélecteurs de test stables) ; sinon auto-généré par Field. @default undefined */
  readonly id = input<string>();
  /** Libellé du champ (rendu par Field). @default undefined */
  readonly label = input<string>();
  /** Texte d'aide affiché sous le champ quand il est valide. @default undefined */
  readonly hint = input<string>();
  /** Aide contextuelle riche : texte ou `TemplateRef` rendu dans une infobulle d'aide. @default undefined */
  readonly helpText = input<string | TemplateRef<unknown>>();
  /** Libellé accessible du bouton d'aide. @default 'Help' (ou KT_FIELD_CONFIG.helpLabel) */
  readonly helpLabel = input<string>(this.fieldConfig?.helpLabel ?? 'Help');
  /** Force la valeur de `aria-describedby` (sinon dérivée de hint/erreur). @default undefined */
  readonly customDescribedBy = input<string>();
  /** Texte indicatif affiché quand aucune option n'est sélectionnée. @default undefined */
  readonly placeholder = input<string>();
  /** Quand afficher l'erreur ; surcharge KT_FIELD_CONFIG et le défaut (`invalid && touched`). @default undefined */
  readonly errorMatcher = input<KtFieldErrorMatcher>();
  /** Apparence du chrome (`fill` | `outline`) ; non fournie ⇒ `KT_FIELD_CONFIG.appearance` ?? `'fill'`.
      @default undefined */
  readonly appearance = input<KtFieldAppearance>();
  /** Politique du label flottant en outline (`auto` | `always`) ; non fournie ⇒ `KT_FIELD_CONFIG.floatLabel`
      ?? `'auto'`. @default undefined */
  readonly floatLabel = input<KtFloatLabel>();
  /** Masquer visuellement le label. @default KT_FIELD_CONFIG.hideLabel ?? false */
  readonly hideLabel = input<boolean, unknown>(this.fieldConfig?.hideLabel ?? false, {
    transform: booleanAttribute,
  });
  /** Masquer visuellement le bloc d'erreur. @default KT_FIELD_CONFIG.hideErrors ?? false */
  readonly hideErrors = input<boolean, unknown>(this.fieldConfig?.hideErrors ?? false, {
    transform: booleanAttribute,
  });

  // --- Filtrage (champ de recherche dans le popup, opt-in) ---
  /** Affiche un champ de recherche en tête du popup (desktop) / de la sheet (téléphone).
      Pour les listes longues ; le texte tapé ne sert qu'à filtrer (réinitialisé à la fermeture). @default false */
  readonly filterable = input<boolean, unknown>(false, { transform: booleanAttribute });
  /** Placeholder du champ de recherche du popup. Défaut : `KT_SELECT_CONFIG.filterPlaceholder` ou vide. */
  readonly filterPlaceholder = input<string>();
  /** Libellé accessible du champ de recherche. Défaut : `KT_SELECT_CONFIG.filterLabel` ou « Filter options ». */
  readonly filterLabel = input<string>();
  /** Prédicat de filtre custom `(option, texte tapé brut)`.
      Défaut : libellé de l'option, insensible à la casse et aux accents. */
  readonly filterFn = input<(option: T, query: string) => boolean>();
  /** Nombre maximal d'options affichées dans le DOM en mode filtrable pour optimiser les performances. @default 100 */
  readonly maxVisibleOptions = input<number>(100);
  /** Texte informatif de troncature des résultats (visuel). */
  readonly truncatedResultsText = input<(max: number, total: number) => string>();
  /** Annonce de la troncature des résultats (live region). */
  readonly truncatedResultsAnnouncement = input<(max: number, total: number) => string>();

  // --- État interne du popup ---
  protected readonly expanded = signal(false);
  protected readonly viewport = inject(KtViewport);
  /** Écran compact (téléphone / fenêtre étroite) : bascule le popup en bottom-sheet modale.
      Source unique configurable par appli (`KtViewport` / `provideKtBreakpoints`) ; pilote aussi
      la classe CSS `kt-select__popup--sheet` du template. */
  protected readonly compact = this.viewport.isCompact;
  protected readonly triggerEl = viewChild<ElementRef<HTMLElement>>('trigger');
  protected readonly popupEl = viewChild<ElementRef<HTMLElement>>('popup');
  private readonly idGen = inject(KtIdGenerator);
  private readonly uid = this.idGen.generateId('select');
  private readonly anchorName = `--kt-select-anchor-${this.uid}`;
  /** id du panneau (élément widget) en mode filtrable — cible de l'aria-controls du trigger. */
  protected readonly panelId = `kt-select-panel-${this.uid}`;
  protected readonly filterInputEl = viewChild<ElementRef<HTMLInputElement>>('filterInput');
  protected readonly listboxEl = viewChild<ElementRef<HTMLElement>>('listboxEl');
  protected readonly listboxDir = viewChild(Listbox);
  protected readonly comboboxDir = viewChild(Combobox);
  /** Suit l'état réel du Popover : la fermeture peut être synchrone (Tab) ET pilotée par
      l'effect — sans ce flag, le second `hidePopover()` jetterait une InvalidStateError. */
  private popoverShown = false;

  // --- Politique d'affichage des erreurs (cohérente avec les champs) ---
  private readonly matcher = computed(
    () => this.errorMatcher() ?? this.fieldConfig?.errorMatcher ?? defaultKtFieldErrorMatcher,
  );
  protected readonly showInvalid = computed(() =>
    this.matcher()({ invalid: this.invalid(), touched: this.touched(), dirty: this.dirty() }),
  );

  // --- Textes résolus (input > KT_SELECT_CONFIG > DEFAULT_KT_SELECT_CONFIG, défauts EN centralisés) ---
  protected readonly resolvedPlaceholder = computed(
    () => this.placeholder() ?? this.config?.placeholder ?? DEFAULT_KT_SELECT_CONFIG.placeholder,
  );
  protected readonly resolvedEmptyText = computed(() => this.config?.emptyText ?? DEFAULT_KT_SELECT_CONFIG.emptyText);
  protected readonly resolvedCloseLabel = computed(
    () => this.config?.closeLabel ?? DEFAULT_KT_SELECT_CONFIG.closeLabel,
  );
  protected readonly resolvedFilterPlaceholder = computed(
    () => this.filterPlaceholder() ?? this.config?.filterPlaceholder ?? DEFAULT_KT_SELECT_CONFIG.filterPlaceholder,
  );
  protected readonly resolvedFilterLabel = computed(
    () => this.filterLabel() ?? this.config?.filterLabel ?? DEFAULT_KT_SELECT_CONFIG.filterLabel,
  );
  protected readonly resolvedFilterResultsText = computed(
    () => this.config?.filterResultsText ?? DEFAULT_KT_SELECT_CONFIG.filterResultsText,
  );
  protected readonly resolvedTruncatedResultsText = computed(
    () =>
      this.truncatedResultsText() ?? this.config?.truncatedResultsText ?? DEFAULT_KT_SELECT_CONFIG.truncatedResultsText,
  );
  protected readonly resolvedTruncatedResultsAnnouncement = computed(
    () =>
      this.truncatedResultsAnnouncement() ??
      this.config?.truncatedResultsAnnouncement ??
      DEFAULT_KT_SELECT_CONFIG.truncatedResultsAnnouncement,
  );

  // Field attend des { kind, message } ; on résout les messages par défaut et on écarte les
  // suppressions explicites (`message: ''`).
  protected readonly fieldErrors = computed(() => this.errorResolver.resolveAll(this.errors()));

  // --- Accès aux options ---
  private readonly labelAccessor = computed(() => accessor<T, string>(this.optionLabel(), defaultLabel));
  private readonly valueAccessor = computed(() => accessor<T, unknown>(this.optionValue(), defaultIdentity));
  private readonly disabledAccessor = computed(() => accessor<T, boolean>(this.optionDisabled(), () => false));
  /** Comparateur effectif en mode objet : `compareWith`, sinon égalité par identité. */
  protected readonly comparator = computed(
    () => this.compareWith() ?? ((a: T, b: T) => this.keyOf(a) === this.keyOf(b)),
  );

  protected labelOf(item: T): string {
    return this.labelAccessor()(item);
  }
  protected keyOf(item: T): unknown {
    return this.valueAccessor()(item);
  }
  protected disabledOf(item: T): boolean {
    return this.disabledAccessor()(item);
  }

  // --- Filtrage : état éphémère (réinitialisé à la fermeture du popup) ---
  protected readonly filterText = signal('');
  /** Annonce différée du nombre de résultats (live region `role="status"`). */
  protected readonly announcedCount = signal('');
  private announceTimer: ReturnType<typeof setTimeout> | undefined;

  /** Options visibles : les options, restreintes par le filtre quand il est actif. */
  protected readonly filteredOptions = computed<readonly T[]>(() => {
    const query = this.filterText().trim();
    if (!this.filterable() || query === '') return this.options();
    const fn =
      this.filterFn() ??
      ((option: T, q: string) => normalizeForFilter(this.labelOf(option)).includes(normalizeForFilter(q)));
    return this.options().filter((option) => fn(option, query));
  });

  /** Les options affichées dans le DOM. La limitation (maxVisibleOptions) n'est appliquée qu'en mode filtrable. */
  protected readonly displayedOptions = computed<readonly T[]>(() => {
    const opts = this.filteredOptions();
    if (!this.filterable()) return opts;
    const limit = this.maxVisibleOptions();
    return opts.length <= limit ? opts : opts.slice(0, limit);
  });

  // --- Hooks fournis par les sous-classes ---
  /** Valeur poussée au ngListbox sous-jacent : tableau de clés (0/1 en single, N en multi). */
  protected abstract readonly listboxValue: Signal<unknown[]>;
  /** Réception des (dé)sélections du listbox — la sémantique de commit diverge (single/multi). */
  protected abstract onListboxValueChange(keys: readonly unknown[]): void;

  /** Texte de la live region du filtre. Virtuel : le multi y ajoute « , M selected ». */
  protected composeFilterAnnouncement(): string {
    const query = this.filterText().trim();
    if (query === '') return '';
    const total = this.filteredOptions().length;
    const limit = this.maxVisibleOptions();
    if (this.filterable() && total > limit) {
      return this.resolvedTruncatedResultsAnnouncement()(limit, total);
    }
    return this.resolvedFilterResultsText()(total);
  }

  constructor() {
    // Ancre le trigger : `setProperty` natif (les propriétés CSS à tiret comme `anchor-name`
    // ne sont pas appliquées de façon fiable par le binding `[style.…]`/Renderer2 — cf. Tooltip).
    effect(() => {
      this.triggerEl()?.nativeElement.style.setProperty('anchor-name', this.anchorName);
    });

    // Affichage du popup via Popover natif (top-layer). On NE peut PAS utiliser <dialog>.showModal()
    // (vraie modale) : ce combobox @angular/aria se ferme au blur (closePopupOnBlur) et showModal
    // déplace le focus hors du combobox → fermeture immédiate. On reste donc en Popover (le focus
    // reste sur le combobox) ; sur mobile le focusMode 'roving' rend les options réellement focusables.
    effect(() => {
      const el = this.popupEl()?.nativeElement as
        | (HTMLElement & { showPopover?(): void; hidePopover?(): void })
        | undefined;
      if (!el) return;
      if (this.expanded()) {
        el.classList.remove('kt-select__popup--closing');
        el.style.setProperty('position-anchor', this.anchorName);
        el.showPopover?.();
        this.popoverShown = true;
        // Sheet (ADR-0005) : l'animation d'entrée est le scroll programmatique vers le snap ouvert.
        if (this.compact() && this.sheetState === 'idle') this.openSheetByScroll(el);
        // Desktop filtrable : le champ de recherche prend le focus à l'ouverture (pattern
        // SelectPanel). Pas sur téléphone : le clavier virtuel recouvrirait la bottom-sheet.
        if (this.filterable() && !this.compact()) this.filterInputEl()?.nativeElement.focus();
      } else if (this.popoverShown) {
        this.animateAndCloseSelect(el);
      }
    });

    // Sheet (ADR-0005) : détection du snap « fermé » (scroll) + garde molette (wheel non-passif).
    // Attachés une fois par élément popup ; inertes hors mode compact (le scroll ne bulle pas,
    // la garde s'auto-neutralise). preserveContent garde l'élément vivant sur mobile.
    effect(() => {
      const el = this.popupEl()?.nativeElement;
      if (!el || el === this.sheetEl) return;
      this.sheetEl?.removeEventListener('scroll', this.onSheetScroll);
      this.sheetEl?.removeEventListener('wheel', this.onSheetWheel);
      this.sheetEl = el;
      el.addEventListener('scroll', this.onSheetScroll);
      el.addEventListener('wheel', this.onSheetWheel, { passive: false });
    });

    // Filtre éphémère : réinitialisé à la fermeture (liste complète à la réouverture).
    effect(() => {
      if (this.expanded()) return;
      untracked(() => {
        this.filterText.set('');
        this.announcedCount.set('');
        clearTimeout(this.announceTimer);
      });
    });

    this.destroyRef.onDestroy(() => {
      clearTimeout(this.announceTimer);
      clearTimeout(this.sheetCloseTimer);
      this.sheetEl?.removeEventListener('scroll', this.onSheetScroll);
      this.sheetEl?.removeEventListener('wheel', this.onSheetWheel);
      this.setBodyScrollLock(false);
    });

    // Préserve le contenu du template sur mobile pour permettre l'animation de sortie
    effect(() => {
      const cb = this.comboboxDir();
      if (cb) {
        cb.preserveContent.set(this.compact());
      }
    });

    // Sheet mobile : verrouille le scroll du fond (compteur partagé) et restitue le focus au
    // trigger à la fermeture.
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      const compact = this.compact();
      const expanded = this.expanded();
      this.setBodyScrollLock(compact && expanded);
      if (compact && expanded) {
        this.wasExpanded = true;
      } else if (compact && this.wasExpanded) {
        this.triggerEl()?.nativeElement.focus();
      }
    });

    // Ferme au clic/tap en dehors du composant (remplace le binding d'hôte statique document:pointerdown,
    // enregistré dynamiquement pour pouvoir comparer la cible au popup monté dans un overlay).
    if (isPlatformBrowser(this.platformId)) {
      const onPointerDown = (event: PointerEvent) => {
        if (!this.expanded()) return;
        const target = event.target as Node | null;
        const popup = this.popupEl()?.nativeElement;
        if (target && (!this.host.nativeElement.contains(target) || target === popup)) {
          this.expanded.set(false);
        }
      };
      this.doc.addEventListener('pointerdown', onPointerDown);
      this.destroyRef.onDestroy(() => {
        this.doc.removeEventListener('pointerdown', onPointerDown);
      });
    }

    // Fait défiler la liste pour afficher l'option active lors de la navigation au clavier (mode
    // activedescendant). Défilement SCOPÉ à la listbox (sémantique « nearest » manuelle) — PAS
    // scrollIntoView : il scrolle aussi les ANCÊTRES, dont le popup sheet scroll-snap (ADR-0005),
    // ce qui annulait le scroll d'entrée de la sheet et la re-snappait fermée.
    effect(() => {
      const activeId = this.listboxDir()?.activeDescendant();
      if (!this.expanded() || !activeId) return;

      requestAnimationFrame(() => {
        const listbox = this.listboxEl()?.nativeElement;
        const activeEl = listbox?.querySelector('.kt-select__option--active');
        if (!listbox || !activeEl) return;
        const lbRect = listbox.getBoundingClientRect();
        const optRect = activeEl.getBoundingClientRect();
        if (optRect.top < lbRect.top) listbox.scrollTop += optRect.top - lbRect.top;
        else if (optRect.bottom > lbRect.bottom) listbox.scrollTop += optRect.bottom - lbRect.bottom;
      });
    });

    if (isDevMode()) {
      effect(() => {
        const opts = this.options();
        if (this.optionValue() !== undefined || this.compareWith() !== undefined) return;
        const sample = opts.find((o) => o !== null && typeof o === 'object') as Record<string, unknown> | undefined;
        if (sample && sample['id'] === undefined && sample['value'] === undefined) {
          console.warn(
            `[${this.host.nativeElement.tagName.toLowerCase()}] Options de type objet sans identité résoluble ` +
              "('id'/'value') ni `compareWith` : la sélection peut être incohérente au rechargement " +
              'des données. Fournissez `optionValue` ou `compareWith`.',
          );
        }
      });
    }
  }

  protected onFilterInput(event: Event): void {
    this.filterText.set((event.target as HTMLInputElement).value);
    this.scheduleResultsAnnouncement();
    this.resyncListboxSelection();
  }

  /** Relaye la navigation vers le listbox : le focus DOM est dans le champ de filtre et les
      keydown du popup ne remontent pas au combobox (le popup est un sibling DOM du trigger).
      Shift+flèches : extension de plage (multi ; sans effet en single). Home/End/Espace/
      caractères restent dans le champ (convention APG des combobox éditables). */
  protected onFilterKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.expanded.set(false);
      this.refocusTriggerAfterFilterClose();
      return;
    }
    if (event.key === 'Tab') {
      // APG : Tab ferme le popup et suit l'ordre de tabulation. Fermeture SYNCHRONE (l'effect
      // est différé : le popup, sibling DOM du trigger, resterait tabbable pendant l'action
      // par défaut) + focus sur le trigger SANS preventDefault : le Tab natif repart du
      // trigger vers l'élément suivant de la page (Shift+Tab : le précédent).
      this.closePopupNow();
      this.refocusTriggerAfterFilterClose();
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'Enter') return;
    const listbox = this.listboxEl()?.nativeElement;
    if (!listbox) return;
    event.preventDefault();
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: event.key, shiftKey: event.shiftKey, cancelable: true }));
  }

  /** Échap depuis n'importe où dans le composant popup ouvert : après un clic souris sur une
      option, le focus DOM est sur le listbox (pas le trigger) — ni le listbox ni le combobox ne
      gèrent Échap là. Le popup est rendu dans le sous-arbre DOM de l'hôte : l'événement y bulle.
      (Trigger et champ de filtre gèrent leur Échap en amont avec stopPropagation : pas de doublon.) */
  protected onHostKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !this.expanded()) return;
    event.preventDefault();
    event.stopPropagation();
    this.expanded.set(false);
    this.triggerEl()?.nativeElement.focus();
  }

  /** Annonce le contenu du filtre ~500 ms après la dernière frappe (évite le spam SR). */
  protected scheduleResultsAnnouncement(): void {
    clearTimeout(this.announceTimer);
    this.announceTimer = setTimeout(() => {
      this.announcedCount.set(this.composeFilterAnnouncement());
    }, ANNOUNCE_DELAY_MS);
  }

  /** Annonce immédiate dans la live region du panneau (annule une annonce différée en attente). */
  protected announceNow(text: string): void {
    clearTimeout(this.announceTimer);
    this.announcedCount.set(text);
  }

  /** Séquelle de la purge interne du Listbox (il vide sa valeur dès qu'un item n'est plus
      rendu) : quand le filtre redécouvre des options sélectionnées, le binding `[value]` ne
      re-pousse rien (`listboxValue` n'a pas changé) — on resynchronise le modèle du Listbox
      avec les clés sélectionnées actuellement visibles. */
  protected resyncListboxSelection(): void {
    const listbox = this.listboxDir();
    if (!listbox) return;
    const visibleKeys = new Set(this.filteredOptions().map((o) => this.keyOf(o)));
    const expected = this.listboxValue().filter((k) => visibleKeys.has(k));
    const actual = listbox.value();
    if (expected.length === actual.length && expected.every((k) => actual.includes(k))) return;
    listbox.value.set(expected);
  }

  /** Focus le trigger natif (utilisé par Signal Forms `focusBoundControl`). */
  focus(options?: FocusOptions): void {
    this.triggerEl()?.nativeElement.focus(options);
  }

  /** Referme le panneau et vide le filtre (utilisé par Signal Forms `reset`). La sélection du
      listbox dérive de `value()` (computed) et se resynchronise seule. */
  reset(): void {
    this.expanded.set(false);
    this.filterText.set('');
  }

  /** Desktop filtrable : le focus DOM vit dans le popup (champ/options) — on le rend au trigger
      à la fermeture, sinon il tombe sur `<body>`. (Écran compact : déjà géré par l'effect `compact`.) */
  protected refocusTriggerAfterFilterClose(): void {
    if (!this.filterable() || this.compact()) return;
    this.triggerEl()?.nativeElement.focus();
  }

  /** Fermeture synchrone du Popover (l'effect, différé, ne re-cachera pas : flag popoverShown). */
  protected closePopupNow(): void {
    this.expanded.set(false);
    this.resetSheetState();
    if (!this.popoverShown) return;
    const el = this.popupEl()?.nativeElement as (HTMLElement & { hidePopover?(): void }) | undefined;
    el?.classList.remove('kt-select__popup--closing');
    el?.hidePopover?.();
    this.popoverShown = false;
  }

  // --- Bottom-sheet scroll-snap (téléphone, ADR-0005) ---
  // Le popup est un scroller à snap (spacer « fermé » / carte « ouvert ») : le drag-to-dismiss
  // « attrapable partout » et l'arbitrage avec la listbox interne sont NATIFS (latching du
  // navigateur). Le JS ne fait plus que : l'entrée/sortie (scrolls programmatiques), la
  // détection du repos au snap « fermé », et la garde molette. Geste DOUBLÉ par le bouton
  // Fermer + tap-scrim + Échap (WCAG 2.5.1 / 2.5.7).
  private sheetEl: HTMLElement | null = null;
  private sheetState: 'idle' | 'opening' | 'open' | 'closing' = 'idle';
  /** Armé quand l'ouverture a dépassé 50px : un repos à ~0 est alors forcément le snap « fermé »
      (et non la position initiale) — même logique que le prototype du spike. */
  private sheetArmed = false;
  private sheetCloseTimer: ReturnType<typeof setTimeout> | undefined;

  private resetSheetState(): void {
    this.sheetState = 'idle';
    this.sheetArmed = false;
    clearTimeout(this.sheetCloseTimer);
  }

  private prefersReducedMotion(): boolean {
    return this.doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }

  /** Entrée de la sheet : position « fermée » puis scroll animé vers le snap « ouvert ». */
  private openSheetByScroll(el: HTMLElement): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.sheetState = 'opening';
    this.sheetArmed = false;
    el.scrollTop = 0;
    const behavior: ScrollBehavior = this.prefersReducedMotion() ? 'auto' : 'smooth';
    requestAnimationFrame(() => {
      el.scrollTo?.({ top: el.scrollHeight - el.clientHeight, behavior });
    });
  }

  /** Détection du snap « fermé » par position de scroll (ni scrollsnapchange ni scrollend :
      non interopérables — cf. ADR-0005). Un geste de l'utilisateur qui amène la sheet au repos
      à 0 EST la fermeture ; les fermetures programmatiques y convergent aussi. */
  private readonly onSheetScroll = (): void => {
    const el = this.sheetEl;
    if (!el || !this.compact() || this.sheetState === 'idle') return;
    const top = el.scrollTop;
    if (top > 50) this.sheetArmed = true;
    if (this.sheetState === 'opening' && top >= el.scrollHeight - el.clientHeight - 2) {
      this.sheetState = 'open';
      return;
    }
    if (this.sheetArmed && top <= 1) this.finalizeSheetClose();
  };

  /** La molette ne ferme JAMAIS la sheet (pas de geste souris — ADR-0005) : seule la listbox
      peut consommer, dans les limites de son propre défilement. */
  private readonly onSheetWheel = (event: WheelEvent): void => {
    if (!this.compact() || !this.expanded()) return;
    const listbox = this.listboxEl()?.nativeElement;
    if (listbox?.contains(event.target as Node)) {
      const canScrollDown = listbox.scrollTop + listbox.clientHeight < listbox.scrollHeight - 1;
      const canScrollUp = listbox.scrollTop > 0;
      if ((event.deltaY > 0 && canScrollDown) || (event.deltaY < 0 && canScrollUp)) return;
    }
    event.preventDefault();
  };

  private finalizeSheetClose(): void {
    this.resetSheetState();
    const el = this.sheetEl as (HTMLElement & { hidePopover?(): void }) | null;
    if (this.popoverShown) {
      el?.hidePopover?.();
      el?.classList.remove('kt-select__popup--closing');
      this.popoverShown = false;
    }
    // Dismissal par geste : synchronise le signal (les fermetures programmatiques l'ont déjà fait).
    if (this.expanded()) this.expanded.set(false);
  }

  private animateAndCloseSelect(el: HTMLElement & { hidePopover?(): void }): void {
    if (!this.compact() || !isPlatformBrowser(this.platformId)) {
      el.hidePopover?.();
      this.popoverShown = false;
      return;
    }
    // Sheet : sortie = scroll programmatique vers le snap « fermé » ; onSheetScroll finalise au
    // repos. Déjà en bas (jsdom, reduced-motion instantané, geste déjà abouti) : finalise direct.
    if (el.scrollTop <= 1) {
      this.finalizeSheetClose();
      return;
    }
    this.sheetState = 'closing';
    this.sheetArmed = true;
    el.classList.add('kt-select__popup--closing'); // fondu du scrim pendant la sortie
    el.scrollTo?.({ top: 0, behavior: this.prefersReducedMotion() ? 'auto' : 'smooth' });
    // Sécurité (scroll lisse interrompu, moteur sans événement final) — même filet que l'ancien
    // transitionend : on finalise si la fermeture est toujours d'actualité.
    clearTimeout(this.sheetCloseTimer);
    this.sheetCloseTimer = setTimeout(() => {
      if (!this.expanded() && this.popoverShown) this.finalizeSheetClose();
    }, 400);
  }
}
