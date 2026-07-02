import { defineConfig } from '@playwright/test';

/**
 * Suite e2e assertive : couvre les angles morts de jsdom (layout/positionnement, Popover,
 * clavier/focus réels, AXE). Cible un serveur DÉDIÉ (port 4300) auto-démarré et réutilisé —
 * JAMAIS le `ng serve` de l'utilisateur (port 4210).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: 'http://localhost:4300',
    browserName: 'chromium',
    headless: true,
    viewport: { width: 1280, height: 900 },
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', testIgnore: /\.mobile\.spec\.ts$/ },
    { name: 'firefox', use: { browserName: 'firefox' }, testIgnore: /\.mobile\.spec\.ts$/ },
    { name: 'webkit', use: { browserName: 'webkit' }, testIgnore: /\.mobile\.spec\.ts$/ },
    {
      name: 'mobile',
      testMatch: /\.mobile\.spec\.ts$/,
      // hasTouch + petit viewport → (pointer: coarse) and (hover: none) → bottom-sheet.
      use: { viewport: { width: 390, height: 844 }, hasTouch: true },
    },
  ],
  webServer: {
    command: process.env.CI ? 'ng serve --port 4300 --configuration ci' : 'npm run serve:debug',
    url: 'http://localhost:4300',
    reuseExistingServer: true,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
