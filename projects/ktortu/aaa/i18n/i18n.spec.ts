import { ProviderToken, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  KT_FIELD_CONFIG,
  KT_CHIPS_CONFIG,
  KT_SELECT_CONFIG,
  DEFAULT_KT_SELECT_CONFIG,
  type KtFieldConfig,
  type KtChipsConfig,
} from '@ktortu/aaa/forms';
import { KT_SNACKBAR_CONFIG, type KtSnackbarConfig } from '@ktortu/aaa/snackbar';
import { KT_TABS_CONFIG, type KtTabsConfig } from '@ktortu/aaa/tabs';
import { KT_DIALOG_CONFIG, type KtDialogConfig } from '@ktortu/aaa/dialog';
import { KT_FR_TRANSLATIONS, provideKtDefaultFR, provideKtTranslations } from './public-api';

/** Lit un token de config dans le contexte d'injection du TestBed (optionnel : null si absent). */
function read<T>(token: ProviderToken<T>): T | null {
  return TestBed.runInInjectionContext(() => inject(token, { optional: true }));
}

describe('i18n — provideKtDefaultFR', () => {
  it('fournit les libellés français sur les six familles de tokens', () => {
    TestBed.configureTestingModule({ providers: [provideKtDefaultFR()] });

    expect(read(KT_FIELD_CONFIG)?.clearLabel).toBe('Effacer');
    expect(read(KT_TABS_CONFIG)?.previousLabel).toBe('Onglets précédents');
    expect(read(KT_TABS_CONFIG)?.nextLabel).toBe('Onglets suivants');
    expect(read(KT_SELECT_CONFIG)?.emptyText).toBe('Aucune option');
    expect(read(KT_CHIPS_CONFIG)?.listLabel).toBe('Éléments sélectionnés');
    expect(read(KT_SNACKBAR_CONFIG)?.closeLabel).toBe('Fermer');
    expect(read(KT_DIALOG_CONFIG)?.sheetCloseLabel).toBe('Fermer');
  });

  it('résout les libellés à pluriel (fonctions) en français', () => {
    TestBed.configureTestingModule({ providers: [provideKtDefaultFR()] });

    expect(read(KT_SELECT_CONFIG)?.filterResultsText?.(1)).toBe('1 résultat');
    expect(read(KT_SELECT_CONFIG)?.filterResultsText?.(3)).toBe('3 résultats');
    expect(read(KT_CHIPS_CONFIG)?.removeItemLabel?.('Paris')).toBe('Retirer Paris');
  });

  it('surcharge un libellé précis sans perdre le reste du français (fusion par famille)', () => {
    TestBed.configureTestingModule({
      providers: [provideKtDefaultFR({ tabs: { nextLabel: 'Suivant' } })],
    });

    const tabs = read(KT_TABS_CONFIG);
    expect(tabs?.nextLabel).toBe('Suivant'); // override
    expect(tabs?.previousLabel).toBe('Onglets précédents'); // conservé du FR
  });

  it('n’altère pas le dictionnaire figé KT_FR_TRANSLATIONS lors d’une surcharge', () => {
    provideKtDefaultFR({ tabs: { nextLabel: 'Suivant' } });
    expect(KT_FR_TRANSLATIONS.tabs?.nextLabel).toBe('Onglets suivants');
  });
});

describe('i18n — fonctions FR (messages d’erreur, pluriels)', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideKtDefaultFR()] }));

  it('résout les messages d’erreur de champ paramétrés', () => {
    const msgs = read(KT_FIELD_CONFIG)?.errorMessages ?? {};
    const call = (kind: string, params: Record<string, unknown>): string => {
      const m = (msgs as Record<string, unknown>)[kind];
      return typeof m === 'function' ? (m as (e: unknown) => string)(params) : (m as string);
    };
    expect(call('min', { min: 5 })).toContain('5');
    expect(call('max', { max: 10 })).toContain('10');
    expect(call('minLength', { minLength: 3 })).toContain('3');
    expect(call('maxLength', { maxLength: 20 })).toContain('20');
    expect(call('minDate', { minDate: new Date('2026-01-15') })).toContain('Choisissez une date');
    expect(call('maxDate', { maxDate: new Date('2026-12-31') })).toContain("jusqu'au");
    expect(call('required', {})).toBeTruthy();
  });

  it('résout les pluriels du select (singulier vs pluriel)', () => {
    const select = read(KT_SELECT_CONFIG);
    expect(select?.selectionSummaryText?.(1)).toBe('1 élément sélectionné');
    expect(select?.selectionSummaryText?.(4)).toBe('4 éléments sélectionnés');
    expect(select?.selectionCountText?.(1)).toBe('1 sélectionné');
    expect(select?.selectionCountText?.(3)).toBe('3 sélectionnés');
    expect(select?.itemRemovedText?.('Lyon')).toBe('Lyon retiré');
    expect(select?.removeItemLabel?.('Lyon')).toBe('Retirer Lyon');
    expect(select?.moreChipsLabel?.(2)).toBe('+2 de plus');
    expect(select?.selectedItemsLabel?.('Villes')).toContain('Villes');
    expect(select?.selectedItemsLabel?.('')).toBeTruthy(); // fallback sans libellé de champ
    expect(select?.truncatedResultsText?.(10, 150)).toContain('Affichage des 10 premiers résultats sur 150');
    expect(select?.truncatedResultsAnnouncement?.(10, 150)).toContain('150');
  });

  it('résout les pluriels des chips', () => {
    const chips = read(KT_CHIPS_CONFIG);
    expect(chips?.removeItemLabel?.('Angular')).toBe('Retirer Angular');
    expect(chips?.itemRemovedText?.('Angular')).toBe('Angular retiré');
    expect(chips?.moreLabel?.(3)).toBe('+3 de plus');
  });
});

describe('i18n — complétude FR (anti-dérive)', () => {
  // Clés NON traduisibles de la config select : placeholder/filterPlaceholder sont propres à l'appli,
  // closeOnSelect est un comportement (pas un texte). Exclues du contrôle de complétude.
  const NON_TRANSLATABLE_SELECT_KEYS = new Set(['placeholder', 'filterPlaceholder', 'closeOnSelect']);

  it('KT_FR_TRANSLATIONS.select couvre toutes les clés TEXTE de DEFAULT_KT_SELECT_CONFIG', () => {
    const translatable = Object.keys(DEFAULT_KT_SELECT_CONFIG).filter((k) => !NON_TRANSLATABLE_SELECT_KEYS.has(k));
    const frSelect = KT_FR_TRANSLATIONS.select ?? {};
    const missing = translatable.filter((k) => !(k in frSelect));
    expect(missing).toEqual([]);
  });

  // Les tokens field/chips/snackbar/tabs sont des `Partial<>` SANS objet de défauts runtime (≠ select
  // et son `DEFAULT_KT_SELECT_CONFIG`) : on ne peut pas énumérer leurs clés automatiquement. Ce registre
  // explicite est la source ; `satisfies (keyof Config)[]` le LIE aux types → un renommage/retrait de clé
  // de config casse la compilation, et toute dérive entre KT_FR_TRANSLATIONS et le registre fait échouer
  // le test (clé manquante OU en trop). À mettre à jour en ajoutant un libellé traduisible.
  const TRANSLATABLE_KEYS = {
    field: ['clearLabel', 'helpLabel', 'numberParseError', 'errorMessages'] satisfies (keyof KtFieldConfig)[],
    chips: [
      'removeItemLabel',
      'itemRemovedText',
      'moreLabel',
      'lessLabel',
      'listLabel',
    ] satisfies (keyof KtChipsConfig)[],
    snackbar: ['closeLabel'] satisfies (keyof KtSnackbarConfig)[],
    tabs: ['previousLabel', 'nextLabel'] satisfies (keyof KtTabsConfig)[],
    // `sheetCloseButton` / `sheetHandle` sont des COMPORTEMENTS (booléens), pas des textes : hors
    // dictionnaire de traduction, comme `closeOnSelect` côté select.
    dialog: ['sheetCloseLabel'] satisfies (keyof KtDialogConfig)[],
  };
  const FIELD_ERROR_KINDS = [
    'required',
    'email',
    'min',
    'max',
    'minLength',
    'maxLength',
    'minDate',
    'maxDate',
    'pattern',
  ];

  for (const [family, keys] of Object.entries(TRANSLATABLE_KEYS)) {
    it(`KT_FR_TRANSLATIONS.${family} fournit exactement les libellés traduisibles enregistrés`, () => {
      const fr = (KT_FR_TRANSLATIONS as Record<string, Record<string, unknown> | undefined>)[family] ?? {};
      expect(Object.keys(fr).sort()).toEqual([...keys].sort());
    });
  }

  it('KT_FR_TRANSLATIONS.field.errorMessages couvre tous les kinds d’erreur traduisibles', () => {
    const errorMessages = KT_FR_TRANSLATIONS.field?.errorMessages ?? {};
    expect(Object.keys(errorMessages).sort()).toEqual([...FIELD_ERROR_KINDS].sort());
  });

  it('aucun libellé FR statique n’est vide (un libellé vide casserait l’a11y)', () => {
    // Contrat (pas le copywriting) : chaque chaîne du dictionnaire doit être non vide. Robuste aux
    // reformulations. Les fonctions (pluriels) sont vérifiées par les tests dédiés ci-dessus.
    const emptyPaths: string[] = [];
    const walk = (node: unknown, path: string): void => {
      if (typeof node === 'string') {
        if (node.trim() === '') emptyPaths.push(path);
        return;
      }
      if (node && typeof node === 'object') {
        for (const [key, value] of Object.entries(node)) walk(value, path ? `${path}.${key}` : key);
      }
    };
    walk(KT_FR_TRANSLATIONS, '');
    expect(emptyPaths).toEqual([]);
  });
});

describe('i18n — provideKtTranslations (générique)', () => {
  it('n’enregistre QUE les familles fournies (les autres restent absentes du DI)', () => {
    TestBed.configureTestingModule({
      providers: [provideKtTranslations({ tabs: { previousLabel: 'Prev' } })],
    });

    expect(read(KT_TABS_CONFIG)?.previousLabel).toBe('Prev');
    expect(read(KT_FIELD_CONFIG)).toBeNull();
    expect(read(KT_SELECT_CONFIG)).toBeNull();
    expect(read(KT_CHIPS_CONFIG)).toBeNull();
  });
});
