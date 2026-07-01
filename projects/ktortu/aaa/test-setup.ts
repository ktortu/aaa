// Rend `Temporal` disponible pendant les tests (Vitest tourne ici sous Node < 26, sans natif).
import 'temporal-polyfill/global';

import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KT_AUDIT_ENABLED } from './cdk/audit';

// #1 — Aligne EXPLICITEMENT le runtime de test sur le runtime de prod : la lib n'embarque pas
// zone.js (cf. package.json), donc l'app est zoneless. On le rend explicite ici plutôt que de
// dépendre de l'absence implicite de zone.js — un test qui passe sous zoneless doit le faire
// parce qu'on l'a décidé, pas par accident de configuration.
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection(), { provide: KT_AUDIT_ENABLED, useValue: false }],
  });
});

// #3 — Nettoyage global de l'état de test (équivalent `restoreMocks`/`unstubGlobals` en config).
// Restaure les spies `vi.spyOn`, retire les `vi.stubGlobal`, et rend les timers réels.
// → permet de supprimer les `mockRestore()` / `try { … } finally { vi.useRealTimers() }` manuels.
afterEach(async () => {
  // 1. Flush any pending microtasks first (e.g. Angular scheduler microtasks)
  await Promise.resolve();

  // 2. Now that microtasks have run and scheduled their timers, flush the timers
  try {
    vi.runAllTimers();
  } catch {
    // Faux timers non actifs
  }
  vi.clearAllTimers();
  vi.useRealTimers();

  // 3. Always wait 300ms to let all real requestAnimationFrame / setTimeout settle
  await new Promise<void>((resolve) => setTimeout(resolve, 300));

  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
