import { defineConfig } from '@playwright/test';

/**
 * Config DÉDIÉE au spike scroll-snap (ADR-0005, piste B) — hors e2e:ci.
 * Cible le prototype statique en file:// : aucun serveur, aucun impact pipeline.
 * Lancer : npx playwright test -c spikes/scroll-snap-sheet/spike.config.ts
 */
export default defineConfig({
  testDir: './',
  testMatch: /spike\.spec\.ts$/,
  fullyParallel: true,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: 'list',
  use: { headless: true },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium', viewport: { width: 1280, height: 900 } } },
    { name: 'firefox', use: { browserName: 'firefox', viewport: { width: 1280, height: 900 } } },
    { name: 'webkit', use: { browserName: 'webkit', viewport: { width: 1280, height: 900 } } },
    {
      // Même recette que le projet "mobile" de la suite e2e réelle, MAIS en
      // NOUVEAU headless (channel chromium) : le headless shell ne déclenche
      // JAMAIS le snap au relâchement d'un geste tactile (constat du spike).
      name: 'mobile',
      use: {
        browserName: 'chromium',
        channel: 'chromium',
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
      },
    },
  ],
});
