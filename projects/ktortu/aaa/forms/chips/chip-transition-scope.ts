import { Signal } from '@angular/core';

/** Portée de transition des chips. Fourni par `ChipList` (via `useExisting`) ; injecté en
    optionnel par `Chip` pour ne porter un `view-transition-name` QUE pendant la transition
    de SA liste — sinon tous les chips de la page deviendraient des groupes indépendants et
    « glisseraient » individuellement à chaque reflow déclenché par une autre liste.
    Fichier séparé : évite l'import circulaire Chip ↔ ChipList. */
export abstract class ChipTransitionScope {
  abstract readonly transitioning: Signal<boolean>;
}
