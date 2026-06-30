import type { Temporal as TemporalNamespace } from 'temporal-polyfill';

/**
 * Point d'import unique de Temporal pour toute la lib.
 *
 * - La **valeur** runtime `Temporal` vient de `globalThis.Temporal` : native sur Chrome/Edge 144+,
 *   Firefox 139+, Node 26+ ; sinon posée par le polyfill chargé dans `main.ts`
 *   (`temporal-polyfill/global`) ou `test-setup.ts`.
 * - Les **types** (`TemporalNamespace.PlainDate`, …) viennent d'un `import type` (effacé au build
 *   → 0 KB, le polyfill n'est jamais bundlé dans la lib).
 *
 * Convention : importer `{ Temporal, type TemporalNamespace }` — `Temporal` pour les appels
 * (`Temporal.PlainDate.from(...)`), `TemporalNamespace` pour les annotations
 * (`TemporalNamespace.PlainDate`). Le jour où le natif est garanti partout (Safari inclus), il
 * suffira de retirer le polyfill de `main.ts` : ce fichier ne change pas.
 */

// Type de la valeur runtime `Temporal` (l'objet namespace contenant les classes PlainDate…),
// récupéré via une expression `import type` — entièrement effacée au build.
type TemporalImpl = (typeof import('temporal-polyfill'))['Temporal'];

/** Résout la valeur runtime `Temporal` (native ou polyfill) au moment de l'APPEL, pas à
    l'évaluation du module. Capturer `globalThis.Temporal` à l'import rendrait la lib fragile à
    l'ordre d'initialisation des modules décidé par le bundler : sur un moteur sans Temporal natif
    (Safari/WebKit), le module Temporal de la lib pouvait s'évaluer avant l'installation du polyfill
    et jeter au boot. */
function resolveTemporal(): TemporalImpl {
  const value = (globalThis as unknown as { Temporal?: TemporalImpl }).Temporal;
  if (value == null) {
    throw new Error(
      `[ktortu/aaa] L'espace de noms 'Temporal' est introuvable. ` +
        `Veuillez vous assurer que le polyfill 'temporal-polyfill/global' est correctement importé ` +
        `dans le fichier 'main.ts' de votre application.`,
    );
  }
  return value;
}

/** Point d'accès `Temporal` de la lib. Proxy à résolution paresseuse : le namespace réel n'est lu
    qu'au premier accès de propriété (`Temporal.PlainDate`…), jamais à l'import — ce qui supprime la
    dépendance à l'ordre d'init des modules et fait booter Safari/WebKit tant que le polyfill est
    importé dans `main.ts`. */
export const Temporal: TemporalImpl = new Proxy({} as TemporalImpl, {
  get: (_target, property) => Reflect.get(resolveTemporal() as object, property),
  has: (_target, property) => Reflect.has(resolveTemporal() as object, property),
}) as TemporalImpl;

/** Espace de noms des types Temporal (`TemporalNamespace.PlainDate`, `.PlainTime`, …). */
export type { TemporalNamespace };

// Alias domaine : le code applicatif peut manipuler des noms métier plutôt que l'API brute.

/** Date civile (jour/mois/année), sans heure ni fuseau — alias de `Temporal.PlainDate`.
    À utiliser pour une date « pure » : naissance, échéance, jour d'un événement.
 *
 * @example
 * ```ts
 * import { type CalendarDate } from '@ktortu/aaa';
 * ```
 */
export type CalendarDate = TemporalNamespace.PlainDate;

/** Heure « au mur » (heure/minute/seconde), sans date ni fuseau — alias de `Temporal.PlainTime`.
    À utiliser pour une heure isolée : heure d'ouverture, créneau de rendez-vous récurrent. */
export type WallTime = TemporalNamespace.PlainTime;

/** Date + heure locale, sans fuseau — alias de `Temporal.PlainDateTime`.
    À utiliser quand date et heure comptent mais que le fuseau est implicite/non pertinent
    (heure « au mur » : ne représente pas un instant absolu). */
export type LocalDateTime = TemporalNamespace.PlainDateTime;

/** Instant absolu sur la ligne du temps, en UTC — alias de `Temporal.Instant`.
    À utiliser pour horodater un événement réel (création, mesure) indépendamment du fuseau
    d'affichage ; la conversion en heure locale se fait à la présentation (via `KtClock`). */
export type Timestamp = TemporalNamespace.Instant; // instant absolu (UTC)

/** Instant + fuseau nommé (IANA) — alias de `Temporal.ZonedDateTime`.
    À utiliser quand le fuseau fait partie de la donnée (ex. « 14h00 à Paris ») et doit être
    conservé, contrairement à `Timestamp` qui ne porte pas de fuseau. */
export type ZonedTimestamp = TemporalNamespace.ZonedDateTime; // instant + fuseau nommé
