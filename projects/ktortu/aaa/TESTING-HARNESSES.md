# Conventions des component harnesses (`@ktortu/aaa`)

> Statut : **interne, non publié.** Les harnesses vivent dans des fichiers `*.harness.ts`
> exclus du build de la lib (`tsconfig.lib.json`). Ils seront promus en API publique
> (`@ktortu/aaa/<entry-point>/testing`) à la **V1.0**, une fois la surface stabilisée.

## Pourquoi des harnesses

Un harness expose une API stable, orientée intention, pour piloter un composant en test, en
cachant le DOM réel. Deux bénéfices : (1) découpler nos tests des sélecteurs CSS internes
(résilience au refactor) ; (2) offrir à terme aux **consommateurs** un moyen de tester leur app
sans dépendre de notre structure interne.

## Règles (non négociables)

1. **Gap-driven.** On n'ajoute **aucune méthode** sans un **vrai test migré** qui la consomme.
   Le spec « dogfood » (faux consommateur) _illustre_ l'usage, il ne _justifie_ pas une méthode.
   → garantit l'adoption interne et évite la dérive / le code mort.
2. **ARIA-first.** Cibler les rôles et attributs ARIA (`[role="option"]`, `aria-selected`,
   `aria-busy`, `aria-disabled`) plutôt que les classes CSS quand la sémantique existe. Un harness
   qui échoue parce que la sémantique a cassé est un bon harness (audit a11y déguisé).
3. **Ne remplace pas les tests d'accessibilité.** Le harness lit/clique ; il ne teste ni le clavier
   complet, ni le focus trap, ni le contraste. axe + tests focus/clavier restent à part.
   (Clause à afficher dans la doc publique au moment de la publication.)
4. **Desktop only** pour l'instant. Le mode bottom-sheet tactile (focus `roving`, ouverture
   différente) est hors scope tant qu'aucun vrai test mobile ne le réclame.
5. **Cohabitation harness ↔ internals.** Comportement observable par le DOM → harness. Accès à
   l'instance (`internals(fixture)`) réservé au white-box inatteignable par le DOM (ex. purge interne
   du listbox, pose de `touched` qui n'est pas un input public).

## Conventions d'API

- **Nommage** : `getX()` (lecture qui renvoie une valeur), `isX()` (booléen d'état),
  `clickX()` / `toggleX()` (action), `open()` / `close()`.
- **Filtres de ciblage** : `static with(filters): HarnessPredicate<...>` (ex. `KtSelectHarness.with({ label })`).
- **Sous-harness** pour les éléments répétés (ex. `KtSelectOptionHarness` : `getText`, `isDisabled`,
  `isSelected`, `click`). Le parent expose `getOptions(filter?)` / `getOption(filter)`.
- **Async partout** (CDK) : tout renvoie `Promise`. Les méthodes ouvrent le popup au besoin.
- **Héritage** quand le DOM est partagé : `KtMultiSelectHarness extends KtSelectHarness`
  (override `hostSelector` + `with()`), n'ajoute que le spécifique.
- **Composition** : un harness peut renvoyer un sous-harness d'un autre composant via
  `locatorFor(AutreHarness)` (ex. `KtSelectHarness.getField()` → `KtFieldHarness`).
- **Réutiliser l'officiel** : quand `@angular/aria` fournit déjà un harness
  (`@angular/aria/<x>/testing` : menu, combobox, listbox…), **l'étendre** plutôt que le réécrire ;
  n'ajouter que la valeur propre à la lib (ex. `KtMenuItemHarness extends MenuItemHarness` +
  `isChecked()`, le trou `aria-checked` qu'aria laisse). On garde le nom `Kt*` pour la cohérence.

## Pièges jsdom connus (résolus)

- **Ouverture au CLAVIER** : le clic synthétique n'ouvre pas le combobox en jsdom ; `open()` fait
  `focus()` + `sendKeys(DOWN_ARROW)` (et c'est plus conforme WAI-ARIA).
- **`scrollIntoView`** : non implémenté par jsdom. Corrigé _dans le composant_
  (`activeEl?.scrollIntoView?.()` dans `base-select.ts`) → aucun polyfill requis côté consommateur.
- **Texte d'option** : exclure les glyphes décoratifs (`text({ exclude: '.kt-select__checkbox' })`)
  pour ne pas polluer le libellé en mode multi-sélection.
- **Dialog ouvert programmatiquement** : il vit dans l'overlay au document root → le charger via
  `TestbedHarnessEnvironment.documentRootLoader(fixture)` (pas le loader de fixture).
- **Fermeture de dialog animée** : `ref.closed` n'émet qu'après l'animation ; en test, piloter via
  fake timers (`vi.useFakeTimers()` + `advanceTimersByTimeAsync`), pas un `setTimeout` réel.

## Critère de gel (V1.0)

On fige et on publie quand : les composants structurants (champ + à overlay : Field, Select,
MultiSelect, Menu, Dialog) sont **couverts via des tests réels migrés**, ET deux releases de la lib
n'ont demandé **aucune nouvelle méthode** de harness (stabilité observée, pas ressentie).

## Couverture actuelle

| Composant   | Harness                                       | Statut                      |
| ----------- | --------------------------------------------- | --------------------------- |
| Select      | `KtSelectHarness` (+ `KtSelectOptionHarness`) | ✅ adopté                   |
| MultiSelect | `KtMultiSelectHarness` (hérite de Select)     | ✅ adopté                   |
| Field       | `KtFieldHarness`                              | ✅ adopté                   |
| Menu        | `KtMenuHarness` / `KtMenuItemHarness`         | ✅ (étend aria + isChecked) |
| Dialog      | `KtDialogHarness`                             | ✅ (overlay + close animé)  |
| Snackbar    | `KtSnackbarHarness`                           | ✅ (overlay service, FIFO)  |
| Tooltip     | `KtTooltipHarness`                            | ✅ (lecture seule, overlay) |
| Tabs        | `KtTabScrollerPagerHarness`                   | ✅ (overflow/chevrons)      |
