# Backlog post-revue — Accessibilité

> Issus de la revue de renforcement (panel d'ingénieurs). Ces points d'accessibilité
> sont **identifiés et documentés**, mais **volontairement non corrigés en v1** : ils
> relèvent d'une revue d'accessibilité dédiée ultérieure. Chaque item est sourcé.
>
> Contexte de décision : la charte acte (**R10b**) que les primitives à sémantique HTML
> native gardent un câblage ARIA maison (choix assumé). Les trous ci-dessous sont les
> manques résiduels de ce câblage, à combler lors de la passe a11y.

| Réf  | Composant             | Trou a11y                                                                                                                                                                        | Source                                                                                      | Sévérité |
| ---- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------- |
| PA-1 | Checkbox              | Contenu projeté non-textuel sans `ariaLabel` ⇒ aucun nom accessible (le `*` requis est `aria-hidden`). Le switch fait mieux via `aria-labelledby`.                               | `forms/checkbox/checkbox.ts:55-72`                                                          | 🟠       |
| PA-2 | Chips                 | Pas de suppression clavier `Delete`/`Backspace` sur la puce focalisée (attendu par l'APG grid pattern) ; suppression seulement via le bouton ×.                                  | `forms/chips/chip.html:3-12`                                                                | 🟡       |
| PA-3 | Chips                 | Aucun bloc `@media (prefers-reduced-motion)` (hover/ombre/transition non neutralisés), contrairement à checkbox/radio/switch.                                                    | `forms/chips/chip.css`                                                                      | 🟡       |
| PA-4 | Number                | `role="spinbutton"` sur `type="text"` sans `aria-valuetext` ⇒ le lecteur d'écran lit la chaîne brute, pas la valeur formatée.                                                    | `forms/number-field/number-field.html:34-36`                                                | 🟠       |
| PA-5 | Radio / Checkbox      | Pas d'assertion dev-mode : `KtRadio` hors groupe → erreur NullInjector brute ; `kt-checkbox [value]="'x'"` utilisé standalone → toujours coché silencieusement (`Boolean('x')`). | `forms/radio/radio.ts:48`, `forms/checkbox/checkbox.ts:145`                                 | 🟠       |
| PA-6 | Tooltip               | Double écouteur Escape (host `keydown.escape` + listener `document`) ; consolider ou commenter l'intention pour éviter le double-handling.                                       | `tooltip/tooltip.ts:66,235`                                                                 | 🟡       |
| PA-7 | Select / Multi-select | Lignes « aucun résultat » et « N premiers affichés » portent `role="option"` ⇒ gonfle le set-size annoncé ; `aria-expanded="true"` codé en dur sur l'input filtre.               | `forms/select/select.html:137,142` ; `forms/multi-select/multi-select.html:180,185`         | 🟡       |
| PA-8 | Tabs / Switch         | 44×44 px non garanti sur les chevrons du pager (`iconOnly`) ; cible 44px du switch exprimée en `px` au lieu des logical properties utilisées ailleurs.                           | `tabs/tab-scroller-pager.ts:42-68`, `cdk/styles/tabs.css` ; `forms/switch/switch.css:46-54` | 🟡       |

## Notes transverses

- **Réactivité au fuseau horaire** (hors a11y stricte, lié) : `KtInstantField` et `KtTemporalDatePipe`
  lisent `clock.timeZoneId()` (non-signal) ⇒ pas de recalcul si le fuseau change en cours de vie
  du composant. Acceptable avec `KtFixedClock` statique ; à revoir si horloge dynamique.
  Source : `forms/instant-field/instant-field.ts:44`, `forms/temporal/temporal-date.pipe.ts:39`.
