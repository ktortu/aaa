import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormShowcaseDemo } from './form-showcase-demo';

/** Test d'intégration réel : nos contrôles `kt-*` pilotés par Signal Forms (`[formField]`). */
describe('FormShowcaseDemo', () => {
  let fixture: ComponentFixture<FormShowcaseDemo>;
  let el: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [FormShowcaseDemo] });
    fixture = TestBed.createComponent(FormShowcaseDemo);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  /** kt-text-field dont le libellé contient `label`. */
  function textField(label: string): HTMLElement {
    return [...el.querySelectorAll('kt-text-field')].find((f) => f.textContent?.includes(label)) as HTMLElement;
  }

  function inputOf(label: string): HTMLInputElement {
    return textField(label).querySelector('input')!;
  }

  function type(label: string, value: string): void {
    const input = inputOf(label);
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();
  }

  it('renders the showcase form and the live inspector', () => {
    expect(el.querySelector('h1')?.textContent).toContain('Signal Forms');
    expect(el.querySelectorAll('.showcase__group').length).toBeGreaterThanOrEqual(5);
    expect(el.querySelector('.inspector')).toBeTruthy();
  });

  it('pushes schema validators onto native control attributes (declare once, reflected automatically)', () => {
    const pwd = inputOf('Mot de passe');
    expect(pwd.getAttribute('minlength')).toBe('8');
    expect(pwd.getAttribute('pattern')).toBe('(?=.*[A-Z])(?=.*\\d)');
    expect(pwd.getAttribute('aria-required')).toBe('true');
  });

  it('shows a required error only after the field is touched, and clears it once filled', () => {
    const before = textField('Prénom').textContent ?? '';
    expect(before).not.toContain('Prénom requis.');

    inputOf('Prénom').dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();
    expect(textField('Prénom').textContent).toContain('Prénom requis.');

    type('Prénom', 'Ada');
    expect(textField('Prénom').textContent).not.toContain('Prénom requis.');
  });

  it('validates across fields: confirmation must match the password (validateTree)', () => {
    type('Mot de passe', 'Calcul123');
    type('Confirmer le mot de passe', 'Different1');
    expect(textField('Confirmer le mot de passe').textContent).toContain('ne correspondent pas');

    type('Confirmer le mot de passe', 'Calcul123');
    expect(textField('Confirmer le mot de passe').textContent).not.toContain('ne correspondent pas');
  });

  it('reveals the phone field only when contact method is "phone" (reactive hidden)', () => {
    const phoneRendered = () => !!textField('Téléphone');
    expect(phoneRendered()).toBe(false);

    const group = [...el.querySelectorAll('kt-radio-group')].find((g) => g.textContent?.includes('Moyen de contact'))!;
    const radios = group.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    radios[1].click(); // "Téléphone"
    fixture.detectChanges();
    expect(phoneRendered()).toBe(true);

    radios[0].click(); // "E-mail"
    fixture.detectChanges();
    expect(phoneRendered()).toBe(false);
  });

  it('prefill clears all validation errors; reset brings them back', () => {
    const errorCount = () => el.querySelectorAll('.inspector__errors li').length;

    // Données valides : aucune erreur de validation synchrone (la vérif async du username reste
    // `pending`, ce qui n'ajoute pas d'erreur — `valid()` resterait juste false le temps de la résolution).
    (fixture.componentInstance as unknown as { prefill(): void }).prefill();
    fixture.detectChanges();
    expect(errorCount()).toBe(0);

    (fixture.componentInstance as unknown as { onReset(): void }).onReset();
    fixture.detectChanges();
    expect(errorCount()).toBeGreaterThan(0);
  });

  it('an invalid submit reports an error (and does not succeed)', async () => {
    await (fixture.componentInstance as unknown as { onSubmit(): Promise<void> }).onSubmit();
    fixture.detectChanges();
    expect(el.querySelector('.showcase__alert--err')).toBeTruthy();
    expect(el.querySelector('.showcase__alert--ok')).toBeNull();
  });
});
