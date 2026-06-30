import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

/**
 * Verrou de défilement du `<body>` à COMPTEUR DE RÉFÉRENCES, partagé (`providedIn: 'root'`).
 *
 * Plusieurs surfaces modales simultanées (sheets, popups) peuvent verrouiller le scroll du fond :
 * `overflow: hidden` n'est posé qu'au premier `lock()` et restauré (à sa valeur d'origine) qu'au
 * dernier `unlock()`. Sans ce compteur, deux consommateurs par-instance se désynchronisent — la
 * fermeture du premier restaure le scroll alors que le second est encore ouvert.
 */
@Injectable({ providedIn: 'root' })
export class KtBodyScrollLock {
  private readonly doc = inject(DOCUMENT);
  private count = 0;
  private previousOverflow = '';

  /** Pose un verrou (premier appelant : mémorise puis force `overflow: hidden`). */
  lock(): void {
    if (this.count === 0) {
      this.previousOverflow = this.doc.body.style.overflow;
      this.doc.body.style.overflow = 'hidden';
    }
    this.count++;
  }

  /** Relâche un verrou ; restaure l'`overflow` d'origine quand le dernier consommateur relâche. */
  unlock(): void {
    if (this.count === 0) return;
    this.count--;
    if (this.count === 0) {
      this.doc.body.style.overflow = this.previousOverflow;
    }
  }
}
