import { test as base, expect } from '@playwright/test';

/**
 * Étend `test` avec un garde-fou AUTOMATIQUE : aucune erreur console ni erreur de page
 * pendant le test. S'applique à tous les tests sans qu'ils aient à l'invoquer (`auto: true`).
 */
export const test = base.extend<{ consoleGuard: void }>({
  consoleGuard: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() !== 'error') return;
        const text = msg.text();
        // Ignore les échecs de chargement réseau (CDN polices Google Fonts, etc.) : flakiness
        // d'environnement, pas une erreur applicative.
        if (text.includes('Failed to load resource') || text.includes('net::ERR')) return;
        // WebKit/Safari logue en `error` un avertissement bénin sur la valeur de viewport
        // `interactive-widget` (amélioration progressive pour le clavier mobile, non encore
        // reconnue) : ce n'est pas une erreur applicative.
        if (text.includes('interactive-widget')) return;
        errors.push(text);
      });
      page.on('pageerror', (err) => errors.push(err.message));
      await use();
      expect(errors, 'aucune erreur console / page').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
