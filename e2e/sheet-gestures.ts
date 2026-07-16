import type { Locator, Page } from '@playwright/test';
import { expect } from './fixtures';

/**
 * Gestes tactiles RÉELS pour la bottom-sheet scroll-snap (ADR-0005), via CDP — projet `mobile`
 * (Chromium) uniquement. Constats du spike (spikes/scroll-snap-sheet/NOTES.md) :
 * - `Input.synthesizeScrollGesture` source « touch » est inopérant → `Input.dispatchTouchEvent` ;
 * - le snap au relâchement exige le NOUVEAU headless (`channel: 'chromium'`, cf. playwright.config) ;
 * - les timestamps synthétiques pilotent le vélocimètre : une pause immobile avant relâchement
 *   annule la vélocité (snap au point le plus proche) ; des pas rapides = flick (fling projeté).
 */
export interface TouchDragOptions {
  steps?: number;
  stepMs?: number;
  /** Pause immobile avant relâchement (vélocité nulle → snap au plus proche). */
  pauseMs?: number;
}

/** Drag tactile vertical depuis (x, y). `dy > 0` = doigt vers le bas. */
export async function touchDrag(
  page: Page,
  x: number,
  y: number,
  dy: number,
  opts: TouchDragOptions = {},
): Promise<void> {
  const { steps = 12, stepMs = 16, pauseMs = 0 } = opts;
  const cdp = await page.context().newCDPSession(page);
  try {
    let t = Date.now() / 1000;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }], timestamp: t });
    for (let i = 1; i <= steps; i++) {
      t += stepMs / 1000;
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x, y: y + (dy * i) / steps }],
        timestamp: t,
      });
    }
    for (let i = 0; i < Math.ceil(pauseMs / 50); i++) {
      t += 0.05;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + dy }], timestamp: t });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [], timestamp: t });
  } finally {
    await cdp.detach();
  }
}

/** Drag tactile depuis le centre d'un élément (la sheet s'attrape PARTOUT — poignée décorative). */
export async function touchDragFrom(locator: Locator, dy: number, opts?: TouchDragOptions): Promise<void> {
  const box = await locator.boundingBox();
  if (!box) throw new Error('touchDragFrom : élément sans boundingBox');
  await touchDrag(locator.page(), box.x + box.width / 2, box.y + box.height / 2, dy, opts);
}

/** Attend que la sheet scroll-snap soit au REPOS en position ouverte (fin du scroll d'entrée).
    Indispensable avant toute mesure/geste : le scroll lisse n'est PAS une Web Animation —
    `document.getAnimations()` ne le voit pas. */
export async function settleSheetOpen(popup: Locator): Promise<void> {
  await expect
    .poll(async () => popup.evaluate((el) => el.scrollHeight - el.clientHeight - el.scrollTop))
    .toBeLessThanOrEqual(2);
}
