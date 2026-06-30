# @ktortu/aaa

Bibliothèque de composants Angular **headless + thémés par tokens CSS** (`--kt-*`).
Les composants sont des directives/composants accessibles (appui sur `@angular/aria` / CDK) ;
leur apparence vit dans des feuilles CSS globales que vous importez à part.

> **Démo & documentation vivante** : [ktortu-aaa-demo.web.app](https://ktortu-aaa-demo.web.app/)

## Convention de nommage

- **Selectors** (templates) : préfixe `kt` — `[ktButton]`, `<kt-text-field>`, `[ktDialogTitle]`…
- **Symboles TypeScript** : préfixe `Kt` — classes/directives/pipes `KtX` (`KtButton`,
  `KtSelect`…), tokens `KT_X` (`KT_BUTTON_CONFIG`, `KT_BREAKPOINTS`…). Ce préfixe évite les
  collisions d'imports chez les consommateurs.
- **Exception assumée** : le namespace natif `Temporal` et ses alias de types
  (`Timestamp`, `CalendarDate`, `WallTime`, `LocalDateTime`, `ZonedTimestamp`) ne sont pas
  préfixés, pour rester ergonomiques côté dates.

## Utilisation (TypeScript)

Chaque famille est importable depuis son point d'entrée `@ktortu/aaa/<feature>` ; les utilitaires
transverses (breakpoints, viewport, sheet-drag, générateur d'id) depuis `@ktortu/aaa/cdk`.

```ts
import { Component } from '@angular/core';
import { KtButton } from '@ktortu/aaa/button';
import { KtTextField } from '@ktortu/aaa/forms';

@Component({
  selector: 'app-exemple',
  imports: [KtButton, KtTextField],
  template: `
    <kt-text-field label="E-mail" type="email" [(value)]="email" />
    <button ktButton mode="filled" color="primary">Enregistrer</button>
  `,
})
export class Exemple {
  email = '';
}
```

Points d'entrée TypeScript : `@ktortu/aaa/button`, `/card`, `/dialog`, `/menu`, `/snackbar`, `/tabs`,
`/tooltip`, `/forms`, `/cdk` (breakpoints, viewport, sheet-drag, id-generator) et `/i18n`
(traductions). La racine `@ktortu/aaa` ré-exporte tout par commodité, mais importer depuis le
point d'entrée précis préserve le tree-shaking. Les thèmes sont des fichiers CSS (cf. §Styles),
pas un point d'entrée TypeScript.
Familles agrégées prêtes pour `imports:` : `KtCardImports`, `KtMenuImports`, `KtDialogImports`
(ex. `imports: [...KtCardImports]`).

### Formulaires & Signal Forms

Les contrôles dédiés (`kt-text-field`, `kt-number-field`, `kt-select`, `kt-checkbox`, champs
temporels…) implémentent le contrat **Signal Forms** (`FormValueControl`) : on les lie via
`[(value)]` ou via le directive `[formField]` d'`@angular/forms/signals`. Ils n'implémentent PAS
`ControlValueAccessor` ; pour les intégrer à des `ReactiveForms` existants, passez par le pont
officiel d'Angular (`compatForm` / `SignalFormControl`, `@angular/forms/signals`) et liez avec
`[formField]` plutôt que `formControlName`.

Pour un contrôle natif quelconque, le chrome de champ générique (`KtField` + `KtFieldControl`)
l'enveloppe : `<kt-field label="…"><input ktFieldControl [(value)]="…" /></kt-field>`.

### Configuration

Les valeurs par défaut sont surchargeables par token d'injection (`KT_*_CONFIG`,
type `Partial<…>`) ou via les helpers `provideKt*` :

```ts
import { KT_BUTTON_CONFIG } from '@ktortu/aaa/button';
import { provideKtBreakpoints } from '@ktortu/aaa/cdk';
import { provideKtDialogDefaults } from '@ktortu/aaa/dialog';

providers: [
  { provide: KT_BUTTON_CONFIG, useValue: { size: 'lg' } },
  provideKtBreakpoints({ tablet: 768, desktop: 1200 }),
  provideKtDialogDefaults({ maxWidth: '40rem' }),
];
```

## Styles (CSS)

L'apparence vit dans des **feuilles CSS globales** thémées par des tokens `--kt-*` : importez le
CSS de la lib en plus des composants.

### Mise en place minimale

Importez la feuille **agrégée** (socle + styles de base de tous les composants, ordre de cascade
garanti) :

```css
/* dans votre styles.css global */
@import '@ktortu/aaa/styles.css';
```

…ou via `angular.json` :

```jsonc
"styles": [
  "node_modules/@ktortu/aaa/styles.css",
  "src/styles.css"
]
```

> Le **Dialog** et la **Snackbar** s'appuient sur l'overlay du CDK : ajoutez aussi
> `@import '@angular/cdk/overlay-prebuilt.css';`. La **Snackbar** annonce via le `LiveAnnouncer` —
> ajoutez également `@import '@angular/cdk/a11y-prebuilt.css';` (masque l'élément d'annonce).

### Thèmes (optionnels, à la carte)

Les thèmes ne sont **pas** inclus dans `styles.css`. Importez ceux que vous voulez, **après** :

```css
@import '@ktortu/aaa/styles.css';
@import '@ktortu/aaa/themes/theme-material.css';
```

Thèmes disponibles (`@ktortu/aaa/themes/theme-<id>.css`) :
`material`, `material-you`, `primer`, `carbon`, `fluent`, `ant`, `bootstrap`,
`catppuccin`, `architecte`, `vegetal`, `cyberpunk`, `aurora`.

Un thème = des redéclarations de tokens `--kt-*`. Surcharger un seul `--kt-*` (ex. `--kt-primary`)
rebrande toute la lib.

### Import à la carte (socle + composants choisis)

Pour n'embarquer que ce qui vous intéresse, importez le **socle** (requis) puis **un fichier par
composant**. Chaque bundle inclut déjà ses propres tokens — pas besoin d'importer les `*-tokens`
séparément.

```css
@import '@ktortu/aaa/foundation.css'; /* REQUIS — socle de tokens --kt-*, à mettre en premier */
@import '@ktortu/aaa/menu.css'; /* puis uniquement les composants utilisés */
@import '@ktortu/aaa/button.css';
```

Bundles disponibles :

| Import                       | Contenu                                                      |
| ---------------------------- | ------------------------------------------------------------ |
| `@ktortu/aaa/foundation.css` | **socle de tokens `--kt-*`** (requis, à importer en premier) |
| `@ktortu/aaa/button.css`     | bouton (`ktButton`)                                          |
| `@ktortu/aaa/card.css`       | carte (`ktCard` + marqueurs)                                 |
| `@ktortu/aaa/menu.css`       | menu (`ktMenu`, `ktMenuItem`, …)                             |
| `@ktortu/aaa/tooltip.css`    | tooltip (`ktTooltip`)                                        |
| `@ktortu/aaa/dialog.css`     | dialog (requiert aussi l'overlay CDK)                        |
| `@ktortu/aaa/snackbar.css`   | snackbar (requiert l'overlay CDK + `a11y-prebuilt.css`)      |
| `@ktortu/aaa/forms.css`      | base des formulaires (champs, chips, switch)                 |
| `@ktortu/aaa/tabs.css`       | onglets                                                      |

> `foundation.css` doit **toujours** être importé en premier (les bundles composant en dérivent).
> Si vous utilisez plusieurs composants, l'agrégat `@ktortu/aaa/styles.css` fait tout cela dans le
> bon ordre.
>
> Les formulaires « riches » (Select, MultiSelect, Field, Chips) embarquent leur CSS via les
> composants eux-mêmes (`styleUrl`) : rien à importer en plus pour ceux-ci.

## Développement

```bash
ng build @ktortu/aaa     # build de la lib -> dist/ktortu/aaa
ng test                  # tests unitaires (Vitest)
ng serve demo            # app de démo / documentation vivante (port 4210)
```

### Publication

```bash
cd dist/ktortu/aaa
npm publish
```
