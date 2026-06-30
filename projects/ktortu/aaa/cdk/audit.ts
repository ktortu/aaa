import { InjectionToken, isDevMode } from '@angular/core';

/**
 * InjectionToken permettant d'activer ou désactiver les audits d'accessibilité à l'exécution
 * (gardes-fous console.warn en mode dev). Activé par défaut si `isDevMode()` est vrai.
 */
export const KT_AUDIT_ENABLED = new InjectionToken<boolean>('KT_AUDIT_ENABLED', {
  providedIn: 'root',
  factory: () => isDevMode(),
});
