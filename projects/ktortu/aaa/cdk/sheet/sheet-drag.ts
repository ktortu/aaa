/** Contrôleur de drag-to-dismiss d'une bottom-sheet. À câbler sur le `pointerdown` de la poignée. */
export interface KtSheetDrag {
  /** Démarre le suivi du glissement ; à brancher sur le `pointerdown` de la poignée. */
  start(event: PointerEvent): void;
  /** Détache les écouteurs et réinitialise l'état ; à appeler à la destruction. */
  destroy(): void;
}

export interface KtSheetDragOptions {
  /** Élément translaté pendant le glissement (la feuille elle-même). Lu à chaque `start`. */
  pane: () => HTMLElement | null;
  /** Fermeture déclenchée quand le seuil est franchi (ex. `expanded.set(false)` / `dialogRef.close()`). */
  onDismiss: () => void;
  /** Classe togglée sur le pane pendant le drag (coupe la transition CSS du glissement). */
  draggingClass: string;
  /** Fraction de la hauteur de la feuille au-delà de laquelle on ferme (défaut 0.25). */
  threshold?: number;
}

/**
 * Drag-to-dismiss vertical (vers le BAS uniquement) d'une bottom-sheet, factorisé entre le Select
 * (popup Popover) et le Dialog (pane CDK). Chaque appelant ne fournit que SON élément à translater
 * et SON callback de fermeture.
 *
 * Geste DOUBLÉ côté appelant par Échap + bouton Fermer + tap-extérieur (WCAG 2.5.1) : ce module ne
 * gère que le glissement. Le gating « écran compact uniquement » reste à l'appelant (signal `isCompact`
 * de `KtViewport`) — la primitive est volontairement agnostique.
 *
 * @param opts Élément à translater, callback de fermeture, classe de drag et seuil optionnel.
 * @returns Un contrôleur {@link KtSheetDrag} (`start` à brancher sur `pointerdown`, `destroy` au teardown).
 * @example
 * ```ts
 * const drag = createKtSheetDrag({
 *   pane: () => paneEl(),
 *   onDismiss: () => dialogRef.close(),
 *   draggingClass: 'kt-sheet--dragging',
 * });
 * // <div class="handle" (pointerdown)="drag.start($event)"></div>
 * ```
 */
export function createKtSheetDrag(opts: KtSheetDragOptions): KtSheetDrag {
  const threshold = opts.threshold ?? 0.25;
  let startY = 0;
  let pane: HTMLElement | null = null;
  let handle: HTMLElement | null = null;
  let ownerDoc: Document | null = null;

  const cleanupListeners = (): void => {
    if (!ownerDoc) return;
    ownerDoc.removeEventListener('pointermove', onMove);
    ownerDoc.removeEventListener('pointerup', onEnd);
    ownerDoc.removeEventListener('pointercancel', onEnd);
  };

  const onMove = (event: PointerEvent): void => {
    if (!pane) return;
    const dy = Math.max(0, event.clientY - startY); // on ne tire que vers le bas
    pane.style.translate = `0 ${dy}px`;
  };

  const onEnd = (event: PointerEvent): void => {
    if (!pane || !handle) return;
    cleanupListeners();

    const dragged = event.clientY - startY;
    const dismiss = dragged > pane.getBoundingClientRect().height * threshold;
    // WCAG 2.3.3 : sous prefers-reduced-motion, on applique l'état final SANS animation.
    const reduceMotion = !!ownerDoc?.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      // draggingClass (transition coupée) encore présente : la translation finale est instantanée,
      // puis on retire la classe (aucun changement de valeur ⇒ aucune animation déclenchée).
      pane.style.translate = dismiss ? '0 100%' : '';
      pane.classList.remove(opts.draggingClass);
    } else {
      pane.classList.remove(opts.draggingClass); // réactive la transition CSS (glissement / snap-back)
      pane.style.translate = dismiss ? '0 100%' : ''; // dismiss : glisse jusqu'en bas ; sinon snap-back à 0
    }
    if (dismiss) opts.onDismiss();

    pane = null;
    handle = null;
    ownerDoc = null;
  };

  return {
    start(event: PointerEvent): void {
      if (event.button !== 0) return;
      const el = opts.pane();
      if (!el) return;
      handle = event.currentTarget as HTMLElement;
      ownerDoc = handle.ownerDocument;
      // La poignée ne doit PAS voler le focus (sinon un close-on-blur fermerait prématurément).
      event.preventDefault();
      startY = event.clientY;
      pane = el;
      pane.classList.add(opts.draggingClass);
      // Écoute au niveau du document : un pointer qui sort de la poignée (petite cible) ou une
      // capture perdue n'interrompt plus le suivi du glissement ni le snap-back.
      ownerDoc.addEventListener('pointermove', onMove);
      ownerDoc.addEventListener('pointerup', onEnd);
      ownerDoc.addEventListener('pointercancel', onEnd);
    },
    destroy(): void {
      cleanupListeners();
      pane = null;
      handle = null;
      ownerDoc = null;
    },
  };
}
