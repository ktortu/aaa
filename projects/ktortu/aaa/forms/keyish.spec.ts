import { accessor, defaultIdentity, defaultLabel } from './keyish';

describe('accessor', () => {
  it('renvoie le fallback quand la clé est undefined', () => {
    const fallback = (n: number): string => `#${n}`;
    expect(accessor<number, string>(undefined, fallback)(7)).toBe('#7');
  });

  it('renvoie la fonction telle quelle quand une fonction est fournie', () => {
    const fn = (o: { city: string }): string => o.city.toUpperCase();
    expect(accessor(fn, () => 'fallback')({ city: 'lyon' })).toBe('LYON');
  });

  it('dérive un accesseur de propriété quand une clé est fournie', () => {
    const read = accessor<{ id: number }, number>('id', () => -1);
    expect(read({ id: 42 })).toBe(42);
  });
});

describe('defaultLabel', () => {
  it('objet : préfère label puis name', () => {
    expect(defaultLabel({ label: 'Paris', name: 'FR-75' })).toBe('Paris');
    expect(defaultLabel({ name: 'Lyon' })).toBe('Lyon');
  });

  it('objet : label null retombe sur name', () => {
    expect(defaultLabel({ label: null, name: 'Nice' })).toBe('Nice');
  });

  it('objet : label falsy mais défini (0) est conservé', () => {
    expect(defaultLabel({ label: 0 })).toBe('0');
  });

  it('objet sans label/name : String(item)', () => {
    expect(defaultLabel({ foo: 'bar' })).toBe('[object Object]');
  });

  it('primitifs et null : String(item)', () => {
    expect(defaultLabel('texte')).toBe('texte');
    expect(defaultLabel(12)).toBe('12');
    expect(defaultLabel(null)).toBe('null');
  });
});

describe('defaultIdentity', () => {
  it('objet : préfère id puis value', () => {
    expect(defaultIdentity({ id: 'a', value: 'b' })).toBe('a');
    expect(defaultIdentity({ value: 'b' })).toBe('b');
  });

  it('objet : id falsy mais défini (0, "") est conservé', () => {
    expect(defaultIdentity({ id: 0, value: 'x' })).toBe(0);
    expect(defaultIdentity({ id: '', value: 'x' })).toBe('');
  });

  it('objet : id null retombe sur value (?? ne capte que null/undefined)', () => {
    expect(defaultIdentity({ id: null, value: 'fallback' })).toBe('fallback');
  });

  it('objet sans id/value : l’item lui-même', () => {
    const item = { foo: 'bar' };
    expect(defaultIdentity(item)).toBe(item);
  });

  it('primitifs et null : l’item lui-même', () => {
    expect(defaultIdentity('p')).toBe('p');
    expect(defaultIdentity(5)).toBe(5);
    expect(defaultIdentity(null)).toBeNull();
  });
});
