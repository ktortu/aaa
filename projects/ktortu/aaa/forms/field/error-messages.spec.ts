import { TestBed } from '@angular/core/testing';
import type { ValidationError } from '@angular/forms/signals';
import { KT_FIELD_CONFIG } from './field-config';
import { KtFieldErrorResolver, KT_DEFAULT_FIELD_ERROR_MESSAGES } from './error-messages';

/** Fabrique une `ValidationError` minimale pour les tests (params typés ajoutés au besoin). */
function err(kind: string, extra: Record<string, unknown> = {}): ValidationError {
  return { kind, ...extra } as ValidationError;
}

function resolver(config?: Partial<{ errorMessages: Record<string, unknown> }>): KtFieldErrorResolver {
  TestBed.configureTestingModule({
    providers: config ? [{ provide: KT_FIELD_CONFIG, useValue: config }] : [],
  });
  return TestBed.inject(KtFieldErrorResolver);
}

describe('KtFieldErrorResolver', () => {
  describe('resolve() — défauts anglais embarqués', () => {
    it('rend un message statique pour un kind sans param', () => {
      expect(resolver().resolve(err('required'))).toBe('This field is required.');
    });

    it('rend les messages statiques email et pattern (texte littéral)', () => {
      const r = resolver();
      // Asserts le texte LITTÉRAL (pas le constant, qui serait muté de la même façon).
      expect(r.resolve(err('email'))).toBe('Enter a valid email address.');
      expect(r.resolve(err('pattern'))).toBe('The value is not in the expected format.');
    });

    it('interpole les params numériques (min, max, minLength, maxLength)', () => {
      const r = resolver();
      expect(r.resolve(err('minLength', { minLength: 3 }))).toBe('Enter at least 3 characters.');
      expect(r.resolve(err('maxLength', { maxLength: 8 }))).toBe('Enter at most 8 characters.');
      expect(r.resolve(err('min', { min: 10 }))).toBe('Enter a value greater than or equal to 10.');
      expect(r.resolve(err('max', { max: 20 }))).toBe('Enter a value less than or equal to 20.');
    });

    it('interpole les params date (minDate/maxDate), localisés comme le runtime', () => {
      const r = resolver();
      const min = new Date(2024, 0, 15);
      const max = new Date(2024, 11, 31);
      // Même `toLocaleDateString()` des deux côtés → assertion indépendante de la locale du runtime.
      expect(r.resolve(err('minDate', { minDate: min }))).toBe(
        `Choose a date on or after ${min.toLocaleDateString()}.`,
      );
      expect(r.resolve(err('maxDate', { maxDate: max }))).toBe(
        `Choose a date on or before ${max.toLocaleDateString()}.`,
      );
    });

    it('retourne undefined pour un kind inconnu', () => {
      expect(resolver().resolve(err('totallyCustom'))).toBeUndefined();
    });
  });

  describe('resolve() — surcharge via KT_FIELD_CONFIG', () => {
    it('un override de kind prime sur le défaut anglais', () => {
      const r = resolver({ errorMessages: { required: 'Champ obligatoire.' } });
      expect(r.resolve(err('required'))).toBe('Champ obligatoire.');
    });

    it('les kinds non surchargés gardent leur défaut anglais', () => {
      const r = resolver({ errorMessages: { required: 'X' } });
      expect(r.resolve(err('email'))).toBe(KT_DEFAULT_FIELD_ERROR_MESSAGES['email']);
    });
  });

  describe('resolveAll() — précédence et suppression', () => {
    it('le message du validateur prime sur le défaut', () => {
      const out = resolver().resolveAll([err('required', { message: 'Prénom requis.' })]);
      expect(out).toEqual([{ kind: 'required', message: 'Prénom requis.' }]);
    });

    it('applique le défaut quand le validateur ne fournit pas de message', () => {
      const out = resolver().resolveAll([err('required')]);
      expect(out).toEqual([{ kind: 'required', message: 'This field is required.' }]);
    });

    it("écarte une erreur dont le message est vide (suppression via message: '')", () => {
      const out = resolver().resolveAll([err('required', { message: '' })]);
      expect(out).toEqual([]);
    });

    it('écarte une erreur au message blanc (espaces seulement) — trim', () => {
      const out = resolver().resolveAll([err('required', { message: '   ' })]);
      expect(out).toEqual([]);
    });

    it('écarte les erreurs sans défaut connu et conserve les autres', () => {
      const out = resolver().resolveAll([err('custom'), err('required')]);
      expect(out).toEqual([{ kind: 'required', message: 'This field is required.' }]);
    });
  });
});
