# ADR-0001 — Interception de la fermeture du dialog pour l'animation de sortie

- **Statut** : accepté
- **Date** : 2026-06-30
- **Composant** : `@ktortu/aaa/dialog` (`KtDialogContainer`)

## Contexte

`KtDialogContainer` étend `CdkDialogContainer` (`@angular/cdk/dialog`) et doit jouer une
**animation de sortie** sur **toute** fermeture : programmatique (`dialogRef.close(result)`
appelé par le consommateur), touche **Échap**, et **clic backdrop**.

Le CDK Dialog **n'expose aucun hook « avant fermeture »** (contrairement à `MatDialog`,
qui anime via son propre conteneur). `DialogRef.close()` détache immédiatement l'overlay :
sans interception, impossible d'insérer une animation entre la demande de fermeture et le
démontage.

## Décision

On **réassigne la méthode publique `close` de la `DialogRef`** de l'instance pour la router
vers `animateAndClose(result, originalClose)`. C'est le **point d'interception unique** :
tout chemin de fermeture y passe.

Conséquence directe : Échap et backdrop sont **gérés nativement par le CDK**, qui appelle
lui-même `dialogRef.close()` (avec `preventDefault()` + gardes `hasModifierKey`/`_canClose`).
On **ne réimplémente donc PAS** Échap/backdrop dans le conteneur — ils transitent déjà par
l'interception.

## Alternatives écartées

- **Sous-classer `DialogRef`** pour surcharger `close()` proprement : le CDK **instancie la
  réf en interne**, sans point d'injection pour fournir une sous-classe. Non faisable.
- **N'animer que nos propres chemins de fermeture** (Échap/backdrop réimplémentés + directive
  `[ktDialogClose]`) : ferait perdre l'animation sur les fermetures **programmatiques**
  (`ref.close(result)` après une action) → **régression UX**.
- **Attendre un hook CDK** : inexistant à ce jour.

## Conséquences

- ➕ Une seule porte d'entrée pour l'animation ; comportement uniforme.
- ➖ Couplage à la **méthode publique** `close()` (API stable, risque faible). Tout autre
  accès à de l'interne CDK est isolé ailleurs et **gardé** (cf. le getter `ariaLabelledBy`
  encapsulant `_ariaLabelledByQueue`).
- 🛡️ **Filets de régression** : test harness (fermeture via bouton → démontage réel sous
  fake timers) et **e2e Échap** (fermeture + restitution du focus). Si une montée du CDK
  changeait le contrat de `close()`, ces tests cassent.
