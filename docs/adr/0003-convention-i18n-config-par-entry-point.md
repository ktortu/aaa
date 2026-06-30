# ADR-0003 — Configuration & i18n par entry-point (token + cascade)

- **Statut** : accepté
- **Date** : 2026-06-30 (formalise une convention déjà en place)
- **Portée** : transverse (`field`, `select`, `chips`, `snackbar`, `tabs`, `tooltip`,
  `button`, `card`, `cdk/breakpoints`…)

## Contexte

La lib expose des libellés visibles (boutons « effacer », « fermer », messages d'erreur,
pluriels…). Elle doit être **neutre en i18n** (utilisable dans n'importe quelle langue) sans
imposer de système de traduction, tout en permettant une surcharge fine par application et
par instance.

## Décision

1. **Un token d'injection `KT_*_CONFIG` par entry-point** (`KT_FIELD_CONFIG`,
   `KT_SELECT_CONFIG`, `KT_CHIPS_CONFIG`, `KT_SNACKBAR_CONFIG`, `KT_TABS_CONFIG`,
   `KT_TOOLTIP_CONFIG`…), typé `Partial<…Config>`, avec un helper `provideKt*()`.
2. **Défauts embarqués en anglais neutre** (ex. `'Clear'`, `'Close'`, `'This field is
required.'`). Aucun fichier de traduction JSON ; pas de dépendance à `$localize` dans la
   lib.
3. **Cascade de résolution uniforme** : `input ?? KT_*_CONFIG ?? défaut anglais`.
   La valeur est capturée à la **construction** du contrôle (contrat figé par instance).
4. **Traductions fournies par l'application** : `@ktortu/aaa/i18n` offre
   `provideKtTranslations(...)` (par famille) et `provideKtDefaultFR()` (français complet
   prêt à l'emploi). Une `KtSelectConfig` directive permet aussi la config **par sous-arbre**.

## Alternatives écartées

- **`$localize` / fichiers de traduction dans la lib** : forcerait un système i18n côté
  consommateur et un build de traduction ; contraire à la neutralité voulue.
- **Un service de config monolithique** : couplerait toutes les familles ; le token par
  entry-point garde le tree-shaking et l'isolation.

## Conséquences

- ➕ Lib utilisable « telle quelle » (anglais), franco-prête via un seul provider, et
  surchargée au besoin (global, sous-arbre, ou par instance).
- ➕ Toute nouvelle clé traduisible suit le même patron ; le tree-shaking par entry-point
  est préservé.
- ➖ La résolution étant capturée à la construction, un changement **dynamique** du token
  après création d'un contrôle n'est pas relu (contrat assumé).
- 🛡️ Une **garde de complétude** (test i18n) vérifie que le français couvre toutes les clés
  traduisibles des 5 familles (registre lié aux types via `satisfies (keyof Config)[]`).
