import { Observable, Subject } from 'rxjs';

/**
 * Raison de fermeture d'une snackbar, transmise par {@link KtSnackbarRef.afterDismissed}.
 * - `'timeout'` : la minuterie (régime `'auto'`) est arrivée à échéance ;
 * - `'dismiss'` : fermeture explicite (bouton de fermeture, `Échap`, ou `ref.dismiss()`) ;
 * - `'replaced'` : la snackbar a été retirée de la file sans être affichée (file pleine — cf. `max`).
 */
export type KtSnackbarDismissReason = 'timeout' | 'dismiss' | 'replaced';

/**
 * Référence d'une snackbar ouverte, renvoyée par `KtSnackbar.open()`. Permet de fermer la
 * snackbar par programmation et d'observer sa fermeture.
 *
 * Le débutant peut l'ignorer (`snackbar.open('…')`) ; le code avancé s'en sert pour piloter la
 * fermeture et réagir à la raison de fin.
 *
 * @example
 * ```ts
 * const ref = snackbar.open('Brouillon enregistré');
 * ref.afterDismissed().subscribe((reason) => console.log(reason)); // 'timeout' | 'dismiss' | 'replaced'
 * // plus tard : ref.dismiss();
 * ```
 */
export class KtSnackbarRef {
  private readonly _afterDismissed = new Subject<KtSnackbarDismissReason>();
  private settled = false;

  /**
   * @param onDismiss Rappel exécuté une fois à la fermeture (animation de sortie + démontage de
   *   l'overlay + avance de la file), fourni par le service.
   * @internal Construit par `KtSnackbar` — n'instanciez pas `KtSnackbarRef` directement.
   */
  constructor(private readonly onDismiss: (reason: KtSnackbarDismissReason) => void) {}

  /**
   * Ferme la snackbar (idempotent). Déclenche la sortie/démontage puis émet la raison sur
   * `afterDismissed()`.
   * @param reason Raison de fermeture. @default 'dismiss'
   */
  dismiss(reason: KtSnackbarDismissReason = 'dismiss'): void {
    if (this.settled) return;
    this.settled = true;
    this.onDismiss(reason);
    this._afterDismissed.next(reason);
    this._afterDismissed.complete();
  }

  /** Émet une fois (puis complète) à la fermeture, avec la {@link KtSnackbarDismissReason}. */
  afterDismissed(): Observable<KtSnackbarDismissReason> {
    return this._afterDismissed.asObservable();
  }
}
