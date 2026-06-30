/** Clé (propriété) OU fonction d'accès, pour dériver une valeur d'un item.
    Partagé par les sélecteurs (BaseSelect) et les chips (ChipList). */
export type KtKeyish<T, R> = keyof T | ((item: T) => R);

/** Normalise une clé/fonction en fonction d'accès, avec repli si non fourni. */
export function accessor<T, R>(key: KtKeyish<T, R> | undefined, fallback: (item: T) => R): (item: T) => R {
  if (key === undefined) return fallback;
  if (typeof key === 'function') return key;
  return (item: T) => (item as Record<PropertyKey, unknown>)[key] as R;
}

/** Libellé par défaut : `label`/`name` pour un objet, sinon `String(item)`. */
export function defaultLabel<T>(item: T): string {
  if (item !== null && typeof item === 'object') {
    const o = item as Record<string, unknown>;
    const v = o['label'] ?? o['name'];
    if (v !== undefined && v !== null) return String(v);
  }
  return String(item);
}

/** Identité par défaut : `id`/`value` pour un objet, sinon l'item lui-même (primitif). */
export function defaultIdentity<T>(item: T): unknown {
  if (item !== null && typeof item === 'object') {
    const o = item as Record<string, unknown>;
    return o['id'] ?? o['value'] ?? item;
  }
  return item;
}
