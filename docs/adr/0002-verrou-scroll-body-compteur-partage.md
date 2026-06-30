# ADR-0002 — Verrou de scroll du fond par service à compteur de références

- **Statut** : accepté
- **Date** : 2026-06-30
- **Composant** : `@ktortu/aaa/cdk` (`KtBodyScrollLock`), consommé par `KtBaseSelect`

## Contexte

En présentation compacte (mobile), un `kt-select` / `kt-multi-select` s'ouvre en
bottom-sheet et doit **verrouiller le défilement du fond** (`document.body.style.overflow =
'hidden'`) tant que la sheet est ouverte.

Tant que chaque instance écrivait directement `body.style.overflow`, **deux sheets ouvertes
simultanément se désynchronisaient** : la fermeture de la première restaurait le scroll alors
que la seconde était encore ouverte (la dernière écriture gagne, sans coordination).

## Décision

Un service `KtBodyScrollLock` (`providedIn: 'root'`) à **compteur de références** :

- `lock()` : au **premier** appel, mémorise l'`overflow` courant puis force `hidden` ;
  incrémente le compteur.
- `unlock()` : décrémente ; au **dernier** relâchement, restaure la valeur d'origine.

Chaque consommateur pose/relâche son verrou de façon **idempotente** (n'agit qu'à la
transition). Le fond n'est restauré que lorsque **plus aucune** surface modale ne le tient.

## Alternatives écartées

- **Écritures par instance** (l'état initial) : la cause du bug de désynchronisation.
- **`BlockScrollStrategy` du CDK Overlay** : plus lourde, liée au cycle d'un overlay CDK
  alors que la sheet du select n'est pas un overlay CDK ; elle n'est **pas non plus
  comptée par référence** entre surfaces indépendantes. Un petit service dédié est plus
  simple et **réutilisable** (la sheet du dialog peut s'en servir aussi).

## Conséquences

- ➕ Plusieurs surfaces modales coexistent sans se marcher dessus.
- ➕ Restaure la **valeur d'origine** de l'`overflow` (pas un `''` aveugle).
- ➕ Nouvel export public `@ktortu/aaa/cdk` : réutilisable par tout code applicatif
  construisant ses propres surfaces modales.
- ➖ Responsabilité de **relâcher** le verrou côté consommateur (au démontage, ou quand le
  viewport repasse desktop) — `KtBaseSelect` le fait via un drapeau d'état + `onDestroy`.
