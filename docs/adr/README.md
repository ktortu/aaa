# Architecture Decision Records (ADR)

Décisions d'architecture **durables** de `@ktortu/aaa` : le _quoi_, le _pourquoi_, et
surtout **l'alternative écartée et la raison**. Format [Michael Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).

Un ADR sert quand une décision **survit à un seul changement** et risque d'être
re-questionnée (« pourquoi c'est fait comme ça ? »). Il n'y a **pas** d'ADR par
fonctionnalité : le _pourquoi_ d'un changement vit dans le message de commit / la PR,
celui d'une ligne subtile dans un commentaire inline. On ne « monte » à l'ADR que pour
les choix structurels.

Statuts : `proposé` · `accepté` · `remplacé par ADR-NNNN` · `déprécié`. Un ADR est
**immuable** : on ne le réécrit pas, on en crée un nouveau qui le remplace.

| #    | Titre                                                                                          | Statut  |
| ---- | ---------------------------------------------------------------------------------------------- | ------- |
| 0001 | [Interception de la fermeture du dialog](0001-interception-fermeture-dialog.md)                | accepté |
| 0002 | [Verrou de scroll du fond par compteur partagé](0002-verrou-scroll-body-compteur-partage.md)   | accepté |
| 0003 | [Configuration i18n par entry-point](0003-convention-i18n-config-par-entry-point.md)           | accepté |
| 0004 | [Disclosure composé plutôt que `<details>` natif](0004-disclosure-compose-vs-details-natif.md) | accepté |
| 0005 | [Drag-to-dismiss des sheets sur toute la surface](0005-sheet-drag-toute-surface.md)            | proposé |
