# ADR-0004 — Disclosure : composant composé plutôt que `<details>` natif

- **Statut** : accepté
- **Date** : 2026-06-30
- **Portée** : `disclosure` (nouvel entry-point `@ktortu/aaa/disclosure`)

## Contexte

Besoin d'un composant qui replie/déplie un **bloc d'interface** (volet d'options, module de
dashboard, section d'une fiche produit), souvent à contenu **interactif**, avec une animation
de hauteur soignée et cohérente avec le reste de la lib (cf. snackbar).

Trois pistes existaient :

1. **`<details>/<summary>` natif** — sémantique disclosure gratuite, clavier et `aria-expanded`
   intégrés, contenu fermé réellement masqué (pas de piège de focus), `<details name>` pour
   l'exclusivité.
2. **Thème sur `@angular/aria/accordion`** — primitive officielle, mais orientée **groupe**
   (sa propre doc déconseille l'accordion pour une section unique → « use a disclosure pattern »),
   convention `ng-template` imposée, `role=region`.
3. **Composant composé maison** (un déclencheur `<button>` + une région pilotée par signal).

Aucune primitive `@angular/aria/disclosure` n'existe ; la doc Angular renvoie au « disclosure
pattern » sans le fournir.

## Décision

On retient l'option **3, le composant composé**, en trois marqueurs :

- `[ktDisclosure]` (directive hôte, `exportAs: 'ktDisclosure'`) : possède l'état
  `expanded = model<boolean>()`, génère l'`id` du panneau, expose `toggle/expand/collapse`.
- `[ktDisclosureToggle]` (sur un **vrai `<button>`**) : câble `(click)`, `aria-expanded`,
  `aria-controls` ; le clavier (Entrée/Espace) est natif au bouton.
- `<kt-disclosure-content>` (**composant** élément) : enveloppe le contenu d'un wrapper
  `overflow:hidden` (requis par l'animation grid), porte l'`id`, et passe **`inert`** quand
  c'est fermé.

L'animation est un **grid `0fr ↔ 1fr`** en CSS pur (token `--disclosure-anim-duration`),
neutralisée sous `prefers-reduced-motion`. Aucune mesure JS.

**Frontière documentée** : `ktDisclosure` vise la divulgation d'**interface**. Pour une
**section de contenu** de page (façon Wikipédia, FAQ), préférer `<details>` natif (sémantique,
find-in-page, SEO, zéro JS). La page de démo porte un encart « utiliser quand / préférer
`<details>` quand ».

## Alternatives écartées

- **`<details>` natif pour ce besoin** : l'**animation de hauteur** n'est pas fiable
  cross-browser à ce jour (dépend de `::details-content` + `interpolate-size`, Chromium d'abord,
  Safari/Firefox en cours), et `<summary>` doit être le **premier enfant** → pas de liberté de
  mise en page (déclencheur détaché, vrai `<button>` imbriqué impossible). Reste recommandé pour
  les **sections de contenu**.
- **Thème `@angular/aria/accordion`** : orienté groupe, déconseillé par sa propre doc pour une
  section unique ; convention `ng-template` + `role=region` non désirées ici. Réservé à un futur
  `ktAccordion` si un besoin **groupé** (clavier APG, ouverture exclusive) apparaît.

## Conséquences

- ➕ Animation fluide et **identique partout** (grid CSS), liberté de mise en page, `expanded()`
  exposé pour un template réactif (label « Voir plus / Voir moins » piloté côté consommateur).
- ➖ On **assume l'accessibilité** (`aria-expanded` / `aria-controls` / `inert`) au lieu de
  l'hériter de la plateforme — surface connue (pattern Radix/Headless), couverte par les tests et
  un harness.
- ➖ On perd le find-in-page auto-open et le `<details name>` natif. Un futur groupe exclusif se
  fera par **signal partagé** (`ktDisclosureGroup`), pas par la primitive aria.
- 🛡️ Garde-fous dev : un `[ktDisclosureToggle]` sans nom accessible (4.1.2) et un hôte contenant
  plus d'un toggle/panneau (id dupliqué) émettent un avertissement. Le panneau **n'a pas**
  `role=region` (anti-pollution du rotor de régions).
- ♿ Durcissement a11y : cible tactile du déclencheur ≥ 44px (2.5.5, token `--disclosure-toggle-min-size`),
  `type="button"` posé **si absent** (sans écraser un type explicite) et bloc `forced-colors` pour le
  chevron. Invariant « focus jamais dans le contenu replié » couvert par un test e2e (jsdom ne simule
  pas `inert`).
- ⚠️ `expanded` est un `model()` (pour `[(expanded)]`) et un `model()` n'accepte pas
  `booleanAttribute` : il s'utilise **en binding**, jamais en attribut nu (`<div ktDisclosure expanded>`
  pousserait `''`). Choix assumé : pas de surface dérivée (`open()`) pour rattraper l'attribut nu —
  on perd la parité avec les booléens nus one-way (`card.interactive`), objet différent.
- 📦 API minuscule : `expanded` (model) + `toggle/expand/collapse` sur l'hôte, `chevron` (input
  booléen, **défaut true**) sur le déclencheur — la directive applique elle-même la classe de
  style, rien à écrire côté template. **Aucun token de config DI** (libellés côté template,
  cf. ADR-0003).
