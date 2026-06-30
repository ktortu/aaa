import { normalizeKtSuggestions, type KtSuggestion } from './datalist';

describe('normalizeKtSuggestions', () => {
  it('retourne [] pour undefined', () => {
    expect(normalizeKtSuggestions(undefined, String)).toEqual([]);
  });

  it('retourne [] pour une liste vide', () => {
    expect(normalizeKtSuggestions([], String)).toEqual([]);
  });

  it('normalise des valeurs simples (label null, value sérialisée par toValue)', () => {
    const result = normalizeKtSuggestions(['a', 'b'], (v) => v.toUpperCase());
    expect(result).toEqual([
      { value: 'A', label: null },
      { value: 'B', label: null },
    ]);
  });

  it('sérialise des nombres via toValue', () => {
    const result = normalizeKtSuggestions([1, 2, 30], String);
    expect(result).toEqual([
      { value: '1', label: null },
      { value: '2', label: null },
      { value: '30', label: null },
    ]);
  });

  it('normalise les couples { value, label }', () => {
    const suggestions: KtSuggestion<number>[] = [
      { value: 12, label: 'Décembre' },
      { value: 6, label: 'Juin' },
    ];
    expect(normalizeKtSuggestions(suggestions, String)).toEqual([
      { value: '12', label: 'Décembre' },
      { value: '6', label: 'Juin' },
    ]);
  });

  it('met label à null quand un objet { value } n’a pas de label', () => {
    const result = normalizeKtSuggestions([{ value: 'x' }], (v) => v);
    expect(result).toEqual([{ value: 'x', label: null }]);
  });

  it('traite un objet SANS clé `value` comme une valeur simple (cas Temporal/objet)', () => {
    // Une valeur objet (ex. Temporal.PlainYearMonth) n'a pas de propriété `value` → branche « simple ».
    const ym = { toString: () => '2028-04' };
    const result = normalizeKtSuggestions([ym as unknown as KtSuggestion<{ toString(): string }>], (v) => v.toString());
    expect(result).toEqual([{ value: '2028-04', label: null }]);
  });

  it('gère un mélange de valeurs simples et de couples étiquetés', () => {
    const result = normalizeKtSuggestions(['brut', { value: 'clé', label: 'Libellé' }], (v) =>
      typeof v === 'string' ? v : String(v),
    );
    expect(result).toEqual([
      { value: 'brut', label: null },
      { value: 'clé', label: 'Libellé' },
    ]);
  });
});
