import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type CDPSession, type Page } from '@playwright/test';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Banc d'essai du spike scroll-snap (ADR-0005, piste B) — HORS e2e:ci.
 * Chaque test référence le critère de sortie de l'ADR qu'il instruit (C1…C7).
 * Les gestes tactiles RÉELS ne sont synthétisables qu'en Chromium (CDP
 * Input.dispatchTouchEvent horodaté) : c'est en soi un résultat du spike (C6).
 */

const PROTOTYPE_URL = pathToFileURL(path.join(__dirname, 'prototype.html')).href;

const overlayScrollTop = (page: Page) => page.evaluate(() => document.getElementById('overlay')!.scrollTop);
const overlayMax = (page: Page) =>
  page.evaluate(() => {
    const el = document.getElementById('overlay')!;
    return el.scrollHeight - el.clientHeight;
  });
const listboxScrollTop = (page: Page) => page.evaluate(() => document.getElementById('listbox')!.scrollTop);
const sheetLog = (page: Page) => page.evaluate(() => (window as never as { __sheetLog: string[] }).__sheetLog);

async function openSheet(page: Page): Promise<void> {
  await page.click('#trigger');
  await expect(page.locator('#overlay')).toHaveAttribute('data-state', 'open');
}

async function expectClosed(page: Page): Promise<void> {
  await expect(page.locator('#overlay')).toHaveAttribute('data-state', 'closed');
  await expect(page.locator('#overlay')).toBeHidden();
}

/**
 * Drag tactile RÉEL via CDP Input.dispatchTouchEvent — Chromium uniquement.
 * (Input.synthesizeScrollGesture source « touch » est inopérant : constat du spike.)
 * dy > 0 = doigt vers le bas. Les timestamps synthétiques pilotent le vélocimètre :
 * stepMs grand + pauseMs = drag lent relâché immobile (vélocité nulle, snap au plus
 * proche) ; stepMs petit sans pause = flick (fling projeté).
 */
async function touchDrag(
  cdp: CDPSession,
  x: number,
  y: number,
  dy: number,
  { steps = 12, stepMs = 16, pauseMs = 0 } = {},
): Promise<void> {
  let t = Date.now() / 1000;
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y }],
    timestamp: t,
  });
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
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y: y + dy }],
      timestamp: t,
    });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [], timestamp: t });
}

test.beforeEach(async ({ page }) => {
  await page.goto(PROTOTYPE_URL);
});

// ---------------------------------------------------------------- C4 / C6 —
// ouverture, fermetures programmatiques et détection du snap "fermé"
// (sans scrollsnapchange) sur les TROIS moteurs.

test('C4 — ouverture : la sheet snappe en position ouverte', async ({ page }) => {
  await openSheet(page);
  const max = await overlayMax(page);
  await expect.poll(() => overlayScrollTop(page)).toBeGreaterThanOrEqual(max - 2);
});

test('C4 — Échap ferme (scroll programmatique + détection)', async ({ page }) => {
  await openSheet(page);
  await page.keyboard.press('Escape');
  await expectClosed(page);
  expect(await sheetLog(page)).toContain('closing:escape');
});

test('C4 — le clic sur le scrim ferme', async ({ page }) => {
  await openSheet(page);
  // Clic par coordonnées brutes : locator.click() ferait défiler le scroller.
  await page.mouse.click(page.viewportSize()!.width / 2, 60);
  await expectClosed(page);
  expect(await sheetLog(page)).toContain('closing:scrim');
});

test('C4 — le bouton Fermer ferme', async ({ page }) => {
  await openSheet(page);
  await page.click('#closeBtn');
  await expectClosed(page);
});

// ---------------------------------------------------------------------- C3 —
// réouverture ×3 : position stable, pas de re-snap parasite après repos.

test('C3 — trois cycles ouverture/fermeture sans re-snap parasite', async ({ page }) => {
  for (let cycle = 0; cycle < 3; cycle++) {
    await openSheet(page);
    const max = await overlayMax(page);
    await expect.poll(() => overlayScrollTop(page)).toBeGreaterThanOrEqual(max - 2);
    // Deux frames de repos : la position ne doit pas dériver (re-snap Firefox/Safari).
    await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
    expect(await overlayScrollTop(page)).toBeGreaterThanOrEqual(max - 2);
    await page.keyboard.press('Escape');
    await expectClosed(page);
  }
});

// ---------------------------------------------------------------------- C2 —
// molette desktop : ne doit JAMAIS fermer (pas de geste souris — décision ferme).

test('C2 — la molette sur la carcasse ne ferme pas', async ({ page, isMobile }) => {
  test.skip(isMobile, 'molette = desktop uniquement');
  await openSheet(page);
  const header = (await page.locator('.sheet__header').boundingBox())!;
  await page.mouse.move(header.x + header.width / 2, header.y + header.height / 2);
  await page.mouse.wheel(0, -600); // vers la position fermée
  await page.mouse.wheel(0, -600);
  await expect(page.locator('#overlay')).toHaveAttribute('data-state', 'open');
  const max = await overlayMax(page);
  expect(await overlayScrollTop(page)).toBeGreaterThanOrEqual(max - 2);
});

test('C2 — la molette sur la listbox scrolle la listbox, jamais la sheet', async ({ page, isMobile }) => {
  test.skip(isMobile, 'molette = desktop uniquement');
  await openSheet(page);
  const lb = (await page.locator('#listbox').boundingBox())!;
  await page.mouse.move(lb.x + lb.width / 2, lb.y + lb.height / 2);
  await page.mouse.wheel(0, 300); // descend dans la liste
  await expect.poll(() => listboxScrollTop(page)).toBeGreaterThan(0);
  await page.mouse.wheel(0, -1200); // remonte, puis dépasse le haut
  await expect.poll(() => listboxScrollTop(page)).toBe(0);
  await page.mouse.wheel(0, -600); // au-delà du haut : la garde doit bloquer
  await expect(page.locator('#overlay')).toHaveAttribute('data-state', 'open');
});

// ---------------------------------------------------------------------- C1 —
// arbitrage tactile RÉEL (latching natif). Chromium/CDP uniquement : Firefox
// et WebKit ne savent pas synthétiser un geste de scroll tactile (→ C6).

test('C1 — listbox en haut : le drag vers le bas ferme la sheet', async ({ page, isMobile, browserName }) => {
  test.skip(!isMobile || browserName !== 'chromium', 'geste tactile synthétisable en Chromium seul');
  await openSheet(page);
  const cdp = await page.context().newCDPSession(page);
  const lb = (await page.locator('#listbox').boundingBox())!;
  expect(await listboxScrollTop(page)).toBe(0);
  await touchDrag(cdp, lb.x + lb.width / 2, lb.y + 40, 400, { steps: 20, stepMs: 24, pauseMs: 400 });
  await expectClosed(page);
});

test('C1 — listbox scrollée : le drag vers le bas re-scrolle la liste, la sheet reste', async ({
  page,
  isMobile,
  browserName,
}) => {
  test.skip(!isMobile || browserName !== 'chromium', 'geste tactile synthétisable en Chromium seul');
  await openSheet(page);
  const cdp = await page.context().newCDPSession(page);
  const lb = (await page.locator('#listbox').boundingBox())!;
  // Scroll interne réel (doigt vers le haut = descendre dans la liste).
  await touchDrag(cdp, lb.x + lb.width / 2, lb.y + lb.height / 2, -300, { pauseMs: 200 });
  await expect.poll(() => listboxScrollTop(page)).toBeGreaterThan(0);
  const before = await listboxScrollTop(page);
  // Doigt vers le bas : doit être consommé par la listbox, PAS par la sheet.
  await touchDrag(cdp, lb.x + lb.width / 2, lb.y + lb.height / 2, 120, { pauseMs: 200 });
  await expect(page.locator('#overlay')).toHaveAttribute('data-state', 'open');
  await expect.poll(() => listboxScrollTop(page)).toBeLessThan(before);
  const max = await overlayMax(page);
  expect(await overlayScrollTop(page)).toBeGreaterThanOrEqual(max - 2);
});

test('C1 — drag vers le bas depuis l’en-tête (carcasse) : ferme', async ({ page, isMobile, browserName }) => {
  test.skip(!isMobile || browserName !== 'chromium', 'geste tactile synthétisable en Chromium seul');
  await openSheet(page);
  const cdp = await page.context().newCDPSession(page);
  const header = (await page.locator('.sheet__header').boundingBox())!;
  await touchDrag(cdp, header.x + header.width / 2, header.y + header.height / 2, 400, {
    steps: 20,
    stepMs: 24,
    pauseMs: 400,
  });
  await expectClosed(page);
});

test('C1 — drag partiel sous la moitié : la sheet re-snappe ouverte', async ({ page, isMobile, browserName }) => {
  test.skip(!isMobile || browserName !== 'chromium', 'geste tactile synthétisable en Chromium seul');
  await openSheet(page);
  const cdp = await page.context().newCDPSession(page);
  const header = (await page.locator('.sheet__header').boundingBox())!;
  // Pause avant relâchement = vélocité nulle → snap au point le plus proche (ouvert).
  await touchDrag(cdp, header.x + header.width / 2, header.y + header.height / 2, 100, {
    stepMs: 24,
    pauseMs: 400,
  });
  const max = await overlayMax(page);
  await expect.poll(() => overlayScrollTop(page)).toBeGreaterThanOrEqual(max - 2);
  await expect(page.locator('#overlay')).toHaveAttribute('data-state', 'open');
});

test('C1 — flick rapide vers le bas : ferme (vélocité)', async ({ page, isMobile, browserName }) => {
  test.skip(!isMobile || browserName !== 'chromium', 'geste tactile synthétisable en Chromium seul');
  await openSheet(page);
  const cdp = await page.context().newCDPSession(page);
  const header = (await page.locator('.sheet__header').boundingBox())!;
  await touchDrag(cdp, header.x + header.width / 2, header.y + header.height / 2, 120, {
    steps: 4,
    stepMs: 8,
  });
  await expectClosed(page);
});

test('C1 — anti-inertie : un fling de la liste atteignant le haut ne ferme PAS', async ({
  page,
  isMobile,
  browserName,
}) => {
  test.skip(!isMobile || browserName !== 'chromium', 'geste tactile synthétisable en Chromium seul');
  await openSheet(page);
  const cdp = await page.context().newCDPSession(page);
  const lb = (await page.locator('#listbox').boundingBox())!;
  // Descendre un peu dans la liste, puis fling violent vers le bas : l'inertie
  // dépasse le haut de liste — le momentum ne doit PAS se transférer à la sheet.
  await touchDrag(cdp, lb.x + lb.width / 2, lb.y + lb.height / 2, -200, { pauseMs: 200 });
  await expect.poll(() => listboxScrollTop(page)).toBeGreaterThan(0);
  await touchDrag(cdp, lb.x + lb.width / 2, lb.y + lb.height / 2, 300, { steps: 4, stepMs: 8 });
  await expect.poll(() => listboxScrollTop(page)).toBe(0);
  await expect(page.locator('#overlay')).toHaveAttribute('data-state', 'open');
  const max = await overlayMax(page);
  expect(await overlayScrollTop(page)).toBeGreaterThanOrEqual(max - 2);
});

// ------------------------------------------------------------------ C1/C6 —
// le tap et la saisie survivent (pas de preventDefault, pas de geste avalé).

test('C1 — un tap sur une option sélectionne sans fermer', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'tap tactile = projet mobile');
  await openSheet(page);
  const first = page.locator('[role="option"]').first();
  const box = (await first.boundingBox())!;
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await expect(first).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#overlay')).toHaveAttribute('data-state', 'open');
});

test('C4 — la saisie dans le filtre fonctionne, sheet stable', async ({ page }) => {
  await openSheet(page);
  await page.click('#filter');
  await page.keyboard.type('ba');
  await expect(page.locator('[role="option"]:visible')).toHaveCount(1); // Banane
  await expect(page.locator('#overlay')).toHaveAttribute('data-state', 'open');
});

// ---------------------------------------------------------------------- C5 —
// AXE : aucune violation, y compris scrollable-region-focusable (tabindex posé).

test('C5 — axe sans violation sheet ouverte', async ({ page, browserName, isMobile }) => {
  test.skip(browserName !== 'chromium' || isMobile, 'scan axe sur chromium desktop');
  await openSheet(page);
  const results = await new AxeBuilder({ page }).include('#overlay').analyze();
  expect(results.violations).toEqual([]);
});

// ------------------------------------------------------------------- info —
// support des événements de détection (repris dans le rapport).

test('diagnostic — support scrollend / scrollsnapchange du moteur', async ({ page }, testInfo) => {
  const log = await sheetLog(page);
  testInfo.annotations.push({
    type: 'support',
    description: log.filter((l) => l.startsWith('support:')).join(' | '),
  });
  expect(log.length).toBeGreaterThan(0);
});
