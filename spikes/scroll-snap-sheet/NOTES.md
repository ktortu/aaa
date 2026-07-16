# Spike scroll-snap sheet — résultats (ADR-0005, piste B)

Prototype **jetable**, hors CI. Lancer le banc :

```sh
npx playwright test -c spikes/scroll-snap-sheet/spike.config.ts
```

Exécuté le 2026-07-16 : **42 passés / 0 échec** (26 skips par capacité), 38,8 s,
projets chromium + firefox + webkit + mobile (chromium tactile 390×844).

## Verdict par critère de sortie

| #   | Critère                             | Résultat                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C1  | Fidélité du geste au doigt          | ✅ Latching natif parfait : liste scrollée → la liste consomme ; liste en haut + doigt bas → la sheet part ; drag partiel → re-snap ouvert ; flick → ferme (vélocité) ; **anti-inertie native** (fling de la liste atteignant le haut : le momentum ne se transfère pas — pas besoin du timeout 100 ms de vaul)                                                                                                                                                                      |
| C2  | Molette desktop maîtrisée           | ✅ avec une petite garde JS wheel non-passive (bloque la molette hors listbox, et au-delà des bornes de la listbox)                                                                                                                                                                                                                                                                                                                                                                  |
| C3  | Réouverture sans re-snap parasite   | ✅ 3 cycles verts sur les 3 moteurs (le bug re-snap documenté par viliket ne se manifeste pas dans ce design modal)                                                                                                                                                                                                                                                                                                                                                                  |
| C4  | Détection de fermeture fiable       | ✅ 3 moteurs — détection par position de scroll (repos à 0 = snap fermé), **sans** scrollsnapchange (Chromium-only) ni scrollend (Safari 26.2+)                                                                                                                                                                                                                                                                                                                                      |
| C5  | Axe sans violation                  | ✅ zéro violation sheet ouverte (dont scrollable-region-focusable : tabindex posé sur la listbox)                                                                                                                                                                                                                                                                                                                                                                                    |
| C6  | Testabilité Playwright déterministe | ✅ **sous condition** : projet mobile en `channel: 'chromium'` (nouveau headless). Constats : `Input.synthesizeScrollGesture` source touch **inopérant** ; le **headless shell ne déclenche jamais le snap au relâchement** (la sheet reste figée entre deux snaps) ; le nouveau headless snappe correctement. Gestes = `Input.dispatchTouchEvent` horodatés (le vélocimètre suit les timestamps synthétiques → drags lents et flicks déterministes, zéro sleep dans les assertions) |
| C7  | Coût pipeline                       | ✅ banc complet 4 projets en ~39 s ; la poignée de tests réels à ajouter tient dans les shards                                                                                                                                                                                                                                                                                                                                                                                       |

## Ce que la piste B ne supprime PAS (JS résiduel, ~40 lignes vs ~200 de machine à états)

- garde molette non-passive (C2) ;
- détection du repos à scrollTop 0 + machine à états minimale (closed/opening/open/closing) ;
- fermetures programmatiques (Échap, scrim, bouton) = scrollTo animé (`auto` sous prefers-reduced-motion) ;
- verrou de scroll du body (inchangé).

## Réserves hors périmètre du banc

- **Retrofit réel non couvert** : le prototype est autonome. Select compact : le popup
  plein écran (`kt-select__popup--sheet`) devient le scroller à snap — chemin direct.
  Dialog : restructuration du pane CDK (focus trap, aria, chaîne d'animation existante) — plus lourd.
- **Passe manuelle iOS réelle obligatoire** avant merge (rubber-band du scroller externe,
  clavier virtuel/visualViewport, barre d'URL dynamique) — Playwright WebKit ≠ iOS Safari.
- CI : le projet mobile devra basculer sur le **nouveau headless** (`channel: 'chromium'`) pour
  tout test de geste snap — à répercuter dans `playwright.config.ts` lors du câblage réel.

## Gestes synthétiques — aide-mémoire

`Input.dispatchTouchEvent` : dy > 0 = doigt vers le bas ; timestamps espacés de `stepMs` ;
une pause immobile (~400 ms de touchMove sur place) annule la vélocité → snap au plus proche ;
4 pas de 8 ms = flick (fling projeté). `synthesizeScrollGesture` : source `touch` morte,
source défaut = molette (bloquée par la garde C2, donc inutilisable ici).
