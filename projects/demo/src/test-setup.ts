// Rend `Temporal` disponible pendant les tests du projet démo (Vitest sous Node < 26, sans natif) :
// les composants `@ktortu/aaa/forms` importent `temporal.ts`, qui exige le polyfill global.
import 'temporal-polyfill/global';

import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

// #1 — Runtime de test aligné sur la prod : l'app démo est zoneless (pas de zone.js), on le rend explicite.
beforeEach(() => {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
});

// #3 — Nettoyage global de l'état de test entre chaque cas (spies, stubs globaux, timers).
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
