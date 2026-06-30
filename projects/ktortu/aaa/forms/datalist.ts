/** Suggestion d'un champ de saisie (rendu `<datalist>`) : soit la valeur seule, soit un couple
    `{ value, label }` où `label` est le texte affiché et `value` ce qui est inséré dans le champ.
    @template V Type de la valeur du champ (string, number, ou type Temporal selon le champ). */
export type KtSuggestion<V> = V | { value: V; label?: string };

/** Option `<datalist>` normalisée : `value` est la chaîne posée sur l'attribut DOM, `label` le
    libellé affiché (ou `null`). */
export interface KtDatalistOption {
  value: string;
  label: string | null;
}

/** Normalise une liste de suggestions en options `<datalist>`. `toValue` sérialise la valeur en
    chaîne attendue par l'input natif (identité pour le texte, `String()` pour les nombres,
    `serialize()` pour les champs Temporal). */
export function normalizeKtSuggestions<V>(
  suggestions: readonly KtSuggestion<V>[] | undefined,
  toValue: (value: V) => string,
): readonly KtDatalistOption[] {
  if (!suggestions) return [];
  return suggestions.map((suggestion) => {
    if (typeof suggestion === 'object' && suggestion !== null && 'value' in suggestion) {
      return { value: toValue(suggestion.value), label: suggestion.label ?? null };
    }
    return { value: toValue(suggestion as V), label: null };
  });
}
