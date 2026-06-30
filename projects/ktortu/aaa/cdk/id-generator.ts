import { Injectable } from '@angular/core';

/**
 * Génère des identifiants numériques incrémentaux uniques au sein de l'application, soit globalement,
 * soit par préfixe (compteur dédié). Sert à construire des `anchor-name` / `id` stables et distincts.
 *
 * @example
 * ```ts
 * const idGen = inject(KtIdGenerator);
 * const anchor = `--kt-menu-anchor-${idGen.generateId('menu')}`;
 * ```
 */
@Injectable({
  // Stryker disable next-line all: `providedIn` doit rester statiquement analysable par l'AOT (NG1010).
  providedIn: 'root',
})
export class KtIdGenerator {
  private readonly counters = new Map<string, number>();
  private nextGlobalId = 0;

  /**
   * Renvoie le prochain identifiant. Sans `prefix`, utilise le compteur global ; avec `prefix`,
   * utilise un compteur dédié à ce préfixe (séquences indépendantes).
   * @param prefix Clé optionnelle de compteur ; chaque préfixe a sa propre séquence.
   * @returns Le compteur courant (number) pour la portée demandée, avant incrément.
   */
  generateId(prefix?: string): number {
    if (!prefix) {
      return this.nextGlobalId++;
    }
    const current = this.counters.get(prefix) ?? 0;
    this.counters.set(prefix, current + 1);
    return current;
  }
}
