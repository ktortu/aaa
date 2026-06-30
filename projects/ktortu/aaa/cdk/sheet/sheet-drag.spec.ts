import { createKtSheetDrag, KtSheetDrag } from './sheet-drag';

const DRAG_CLASS = 'kt-sheet--dragging';

interface Rig {
  drag: KtSheetDrag;
  handle: HTMLElement;
  pane: HTMLElement;
  dismiss: ReturnType<typeof vi.fn>;
}

const created: KtSheetDrag[] = [];
// Garantit le détachement des écouteurs document même si un test ne termine pas le geste (pas d'`up`).
afterEach(() => {
  while (created.length) created.pop()!.destroy();
});

/** Monte une poignée + un pane (hauteur forcée à 400px) et câble `start` sur le pointerdown réel. */
function rig(threshold?: number): Rig {
  const handle = document.createElement('div');
  const pane = document.createElement('div');
  pane.getBoundingClientRect = () => ({ height: 400 }) as DOMRect;
  const dismiss = vi.fn();
  const drag = createKtSheetDrag({ pane: () => pane, onDismiss: dismiss, draggingClass: DRAG_CLASS, threshold });
  handle.addEventListener('pointerdown', (e) => drag.start(e as PointerEvent));
  created.push(drag);
  return { drag, handle, pane, dismiss };
}

function down(handle: HTMLElement, clientY = 0): MouseEvent {
  const ev = new MouseEvent('pointerdown', { button: 0, clientY, bubbles: true, cancelable: true });
  handle.dispatchEvent(ev);
  return ev;
}
const move = (clientY: number): void => void document.dispatchEvent(new MouseEvent('pointermove', { clientY }));
const up = (clientY: number): void => void document.dispatchEvent(new MouseEvent('pointerup', { clientY }));

describe('createKtSheetDrag', () => {
  it('start : ajoute la classe de drag et empêche le vol de focus (preventDefault)', () => {
    const { handle, pane } = rig();
    const ev = down(handle);
    expect(pane.classList.contains(DRAG_CLASS)).toBe(true);
    expect(ev.defaultPrevented).toBe(true);
  });

  it('translate la feuille vers le bas pendant le glissement (jamais vers le haut)', () => {
    const { handle, pane } = rig();
    down(handle, 0);
    move(120);
    expect(pane.style.translate).toBe('0 120px');
    // Tirer vers le haut est borné à 0 (drag uniquement vers le bas).
    move(-50);
    expect(pane.style.translate).toBe('0 0px');
  });

  it('au-delà du seuil (25% de 400px = 100px) : ferme et glisse jusqu’en bas', () => {
    const { handle, pane, dismiss } = rig();
    down(handle, 0);
    up(150);
    expect(dismiss).toHaveBeenCalledTimes(1);
    expect(pane.style.translate).toBe('0 100%');
    expect(pane.classList.contains(DRAG_CLASS)).toBe(false);
  });

  it('sous le seuil : snap-back (translate vidé) sans fermeture', () => {
    const { handle, pane, dismiss } = rig();
    down(handle, 0);
    up(60);
    expect(dismiss).not.toHaveBeenCalled();
    expect(pane.style.translate).toBe('');
    expect(pane.classList.contains(DRAG_CLASS)).toBe(false);
  });

  it('seuil personnalisé respecté', () => {
    const { handle, dismiss } = rig(0.9); // 0.9 * 400 = 360px
    down(handle, 0);
    up(200); // sous 360 → pas de fermeture
    expect(dismiss).not.toHaveBeenCalled();
  });

  it('ignore les boutons non principaux (clic droit / milieu)', () => {
    const { handle, pane, dismiss } = rig();
    handle.dispatchEvent(new MouseEvent('pointerdown', { button: 2, clientY: 0, bubbles: true }));
    expect(pane.classList.contains(DRAG_CLASS)).toBe(false);
    up(300); // aucun suivi actif
    expect(dismiss).not.toHaveBeenCalled();
  });

  it('prefers-reduced-motion : applique l’état final sans transition, ferme quand même', () => {
    const original = window.matchMedia;
    window.matchMedia = ((q: string) => ({ matches: true, media: q })) as typeof window.matchMedia;
    try {
      const { handle, pane, dismiss } = rig();
      down(handle, 0);
      up(150);
      expect(dismiss).toHaveBeenCalledTimes(1);
      expect(pane.style.translate).toBe('0 100%');
      expect(pane.classList.contains(DRAG_CLASS)).toBe(false);
    } finally {
      window.matchMedia = original;
    }
  });

  it('destroy : détache les écouteurs document (un move résiduel n’a plus d’effet)', () => {
    const { drag, handle, pane } = rig();
    down(handle, 0);
    drag.destroy();
    move(200);
    expect(pane.style.translate).toBe(''); // aucune translation après destroy
  });
});
