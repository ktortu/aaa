# ADR-0005 — Drag-to-dismiss des sheets : saisie sur toute la surface, handle décoratif

- **Statut** : proposé (moteur de geste à trancher par spike GO/NO-GO)
- **Date** : 2026-07-16
- **Portée** : `cdk/sheet` (primitive de geste), `dialog` (présentations sheet), `forms/select`
  et `forms/multi-select` (mode compact)

## Contexte

Aujourd'hui le drag-to-dismiss n'est déclenché que par la **poignée** (`[ktDialogSheetHandle]`,
`.kt-select__sheet-grab`), via `createKtSheetDrag` (`cdk/sheet/sheet-drag.ts`) : Pointer Events
suivis sur `document`, seuil de fermeture **distance pure** (25 % de la hauteur du pane), pas de
vélocité, `preventDefault()` au pointerdown (anti close-on-blur du combobox), `touch-action: none`
sur la poignée seule. Aucun `overscroll-behavior` dans la lib.

Le pattern attendu (Instagram/YouTube) : poignée **purement visuelle**, sheet saisissable
**partout** ; si le contenu est scrollable, le geste de fermeture ne prend que si le scroll
interne est déjà en haut et qu'on tire vers le bas. Le vrai sujet n'est donc pas le drag mais
**l'arbitrage scroll interne ↔ geste de fermeture**. Rien dans le CDK ne le fournit (DragDrop
écoute `touchstart` en **passif**, sans notion de `scrollTop`).

État de l'art étudié : **vaul** (décision différée au premier `pointermove`, remontée des
ancêtres scrollables, anti-inertie ~100 ms, verrou par geste, seuils 25 % **ou** vélocité
~0,4 px/ms, `touchmove` non-passif anti rubber-band iOS), **Ionic** (mêmes checks dans onMove),
**Android BottomSheetBehavior** (nested scrolling → re-handoff en cours de geste, **non
réplicable** sur le web), et l'approche **scroll-snap** (la sheet est un scroller snappé,
l'arbitrage est rendu au navigateur).

Support navigateurs au 2026-07-16 : `scroll-snap-type` universel ; `scrollsnapchange`
(détection propre du snap de fermeture) **Chromium 129+ uniquement, ~69 %** ; `scrollend`
Chrome 114+ / Firefox 109+ / **Safari 26.2+ seulement**, ~87 %.

## Décision

### Partie ferme (quel que soit le moteur)

- La poignée devient **purement décorative** et **rendue par défaut** sur toutes les sheets :
  auto-rendue par le conteneur du dialog en présentation sheet (plus de directive à poser par le
  consommateur), déjà rendue par le select compact ; opt-out via la config existante.
  Elle reste `aria-hidden`, non focusable ; le `cursor: grab` est **retiré** (affordance
  mensongère sinon).
- Le **drag à la souris disparaît** : sur desktop, Échap + scrim + bouton Fermer + clavier
  suffisent. Le geste tactile, lui, se saisit **sur toute la surface** de la sheet.
- **Pas de re-handoff** en cours de geste : une fois le geste de fermeture pris, il est
  verrouillé jusqu'au relâchement (choix de vaul ; le web n'a pas de contrat de nested
  scrolling, même Flutter n'y parvient pas proprement).
- Invariants a11y **non négociables** : le geste n'est jamais le seul moyen de fermer
  (WCAG 2.5.7 Dragging Movements, 2.5.1 Pointer Gestures) ; `prefers-reduced-motion` supprime
  l'animation mais pas la fermeture ; le focus n'est jamais volé à l'appui ; `touch-action: none`
  confiné à la carcasse (jamais au contenu ni au document — pinch-zoom 1.4.4 préservé).

### Moteur de geste : deux pistes, tranchées par spike sur le Select compact

- **Piste A — arbitrage JS (vaul-like)** : la primitive `cdk/sheet` devient un contrôleur
  attaché au pane ; machine à états (appui → attente d'arbitrage → geste pris → relâchement) ;
  décision au **premier `pointermove`** (sélection de texte, marqueur d'opt-out, direction,
  chaîne d'ancêtres scrollables à `scrollTop === 0`, délai anti-inertie ~100 ms **injectable**) ;
  fermeture par distance ≥ 25 % **ou** vélocité ; `overscroll-behavior: contain` sur les
  scrollers internes ; écouteur `touchmove` non-passif actif **uniquement sheet ouverte**.
- **Piste B — scroll-snap natif** : la sheet est un scroller à snap points ; l'arbitrage
  (latching) et l'inertie sont natifs ; le dismiss est détecté via scroll + `scrollend`
  (fallback position pour iOS < 26.2) ; Échap/scrim/bouton deviennent des scrolls programmatiques.

**Critères de sortie du spike** (tous requis pour un GO piste B) :

1. fidélité du geste au doigt (arbitrage avec la listbox scrollable, inertie, zéro fermeture
   accidentelle) ;
2. molette desktop maîtrisée (pas de dismiss accidentel en scrollant le contenu) ;
3. réouverture sans re-snap parasite (Firefox/Safari) ;
4. détection de fermeture fiable sur chromium / firefox / webkit ;
5. axe sans nouvelle violation ;
6. testabilité Playwright déterministe (aucun sleep arbitraire) ;
7. coût pipeline e2e dans le budget des shards existants.

NO-GO sur un seul critère → piste A, déjà spécifiée, sans regret. Le verdict sera consigné ici
au passage du statut à « accepté ».

## Alternatives écartées

- **Étendre le modèle actuel (poignée seule déclencheuse)** : n'atteint pas le pattern attendu ;
  la poignée reste une serrure sur une porte qu'on devrait pouvoir pousser.
- **`touch-action` dynamique au pointerdown** : non interopérable — la spec ignore les
  changements une fois le geste commencé, timing non spécifié (Safari).
- **CDK DragDrop** : `touchstart` passif, aucun arbitrage `scrollTop`, pas de vélocité de
  relâchement, modèle « déplacer un item » inadapté.
- **Re-handoff bidirectionnel façon Android** : impossible proprement sur le web (pas de
  nested scroll contract ; scroller programmatiquement pour l'imiter est fragile).
- **`preventDefault()` au pointerdown sur toute la surface** (modèle actuel de la poignée) :
  tuerait les taps sur options/boutons/champs. Remplacé par décision différée + seuil de
  mouvement ; la vigilance close-on-blur du champ filtre du Select est transférée au câblage.

## Conséquences

- ⚠️ **Contrat public** : `createKtSheetDrag` (démarrage manuel depuis une poignée) évolue vers
  un contrôleur attaché au pane (piste A) ou disparaît (piste B) — dépréciation courte
  documentée, l'export `cdk` est public.
- ➖ `KtDialogSheetHandle` devient décoratif (ou disparaît au profit du rendu auto par le
  conteneur) ; les e2e « drag depuis la poignée » et « poignée ≥ 44px » sont à réaligner — la
  cible 44 px (2.5.5) ne s'applique plus à un élément décoratif.
- 🧹 Nettoyage au passage : sélecteur orphelin `kt-dialog-container--dragging` (`dialog.css`).
- ♿ Opportunité : `tabindex` sur la zone scrollable → lever la désactivation axe
  `scrollable-region-focusable` (suivi ouvert depuis la réparation e2e).
- 🛡️ Vigilances de câblage : close-on-blur du champ filtre du Select ; repli volontaire du
  clavier virtuel à la prise de geste ; hauteur de référence **figée à l'appui** (contenu
  asynchrone) ; idempotence de la fermeture (Échap pendant un drag) ; compteur du verrou body
  toujours équilibré ; purge du `translate` résiduel conservée.
- ⚠️ Risque résiduel assumé : Playwright WebKit ≠ iOS Safari réel → **passe manuelle sur
  appareil iOS** exigée et consignée dans la PR avant merge.
