import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ValidationError } from '@angular/forms/signals';
import { KtFieldErrorMatcher } from '../field/field-config';
import { KtTextArea } from './text-area';

@Component({
  imports: [KtTextArea],
  template: `
    <kt-text-area
      [(value)]="value"
      [label]="label()"
      [hint]="hint()"
      [errors]="errors()"
      [invalid]="invalid()"
      [required]="required()"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [clearable]="clearable()"
      [rows]="rows()"
      [icon]="icon()"
      [prefix]="prefix()"
      [suffix]="suffix()"
      [name]="name()"
      [autocomplete]="autocomplete()"
      [placeholder]="placeholder()"
      [errorMatcher]="errorMatcher()"
      [minLength]="minLength()"
      [maxLength]="maxLength()"
      [pending]="pending()"
    />
  `,
})
class TextAreaHost {
  value = signal('');
  label = signal<string | undefined>('Bio');
  hint = signal<string | undefined>(undefined);
  errors = signal<readonly ValidationError[]>([]);
  invalid = signal(false);
  required = signal(false);
  disabled = signal(false);
  readonly = signal(false);
  clearable = signal(false);
  rows = signal(3);
  icon = signal<string | undefined>(undefined);
  prefix = signal<string | undefined>(undefined);
  suffix = signal<string | undefined>(undefined);
  name = signal('');
  autocomplete = signal<AutoFill | undefined>(undefined);
  placeholder = signal<string | undefined>(undefined);
  errorMatcher = signal<KtFieldErrorMatcher | undefined>(undefined);
  minLength = signal<number | undefined>(undefined);
  maxLength = signal<number | undefined>(undefined);
  pending = signal(false);
}

describe('TextArea', () => {
  let fixture: ComponentFixture<TextAreaHost>;
  let host: TextAreaHost;
  let el: HTMLElement;

  function setup(): void {
    TestBed.configureTestingModule({ imports: [TextAreaHost] });
    fixture = TestBed.createComponent(TextAreaHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  }

  function textarea(): HTMLTextAreaElement {
    return el.querySelector('textarea')!;
  }

  function clearButton(): HTMLButtonElement | null {
    return el.querySelector('.kt-field-box__clear');
  }

  beforeEach(() => setup());

  it('renders a textarea associated with its label', () => {
    const ta = textarea();
    expect(ta).toBeTruthy();
    const id = ta.getAttribute('id');
    expect(el.querySelector('label')!.getAttribute('for')).toBe(id);
  });

  it('sizes to rows by default via a min-height floor (autosize grows beyond)', () => {
    host.rows.set(5);
    fixture.detectChanges();
    expect(textarea().rows).toBe(5);
    expect(textarea().style.minHeight).toBe('5lh');
  });

  it('reflects the bound value', () => {
    host.value.set('Bonjour');
    fixture.detectChanges();
    expect(textarea().value).toBe('Bonjour');
  });

  it('updates the value on input', () => {
    textarea().value = 'Salut';
    textarea().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.value()).toBe('Salut');
  });

  it('reflects the native minlength constraint', () => {
    host.minLength.set(5);
    fixture.detectChanges();
    expect(textarea().getAttribute('minlength')).toBe('5');
  });

  it('reflects the pending state via aria-busy and data-pending', () => {
    expect(textarea().getAttribute('aria-busy')).toBeNull(); // absent par défaut (garde anti-mutant « toujours busy »)
    host.pending.set(true);
    fixture.detectChanges();
    expect(textarea().getAttribute('aria-busy')).toBe('true');
    expect(el.querySelector('.kt-field-box')?.getAttribute('data-pending')).toBe('');
  });

  it('clears the value and refocuses the textarea', () => {
    host.clearable.set(true);
    host.value.set('texte');
    fixture.detectChanges();
    clearButton()!.click();
    fixture.detectChanges();
    expect(host.value()).toBe('');
    expect(document.activeElement).toBe(textarea());
  });

  function field(): KtTextArea {
    return fixture.debugElement.query((de) => de.componentInstance instanceof KtTextArea)
      .componentInstance as KtTextArea;
  }

  it('disabled : textarea désactivée, data-disabled, clear supprimé', () => {
    host.clearable.set(true);
    host.value.set('x');
    host.disabled.set(true);
    fixture.detectChanges();
    expect(textarea().disabled).toBe(true);
    expect(el.querySelector('.kt-field-box')!.getAttribute('data-disabled')).toBe('');
    expect(clearButton()).toBeNull();
  });

  it('readonly : textarea en lecture seule, clear supprimé', () => {
    host.clearable.set(true);
    host.value.set('x');
    host.readonly.set(true);
    fixture.detectChanges();
    expect(textarea().readOnly).toBe(true);
    expect(clearButton()).toBeNull();
  });

  it('required : aria-required="true" sur la textarea', () => {
    host.required.set(true);
    fixture.detectChanges();
    expect(textarea().getAttribute('aria-required')).toBe('true');
  });

  it('invalide (touché) : aria-invalid + data-invalid + aria-describedby vers l’erreur', () => {
    host.hint.set('Indice');
    fixture.detectChanges();
    const id = textarea().id;
    expect(textarea().getAttribute('aria-describedby')).toContain(`${id}-hint`);

    host.invalid.set(true);
    host.errors.set([{ kind: 'required', message: 'Requis' }]);
    textarea().dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(textarea().getAttribute('aria-invalid')).toBe('true');
    expect(el.querySelector('.kt-field-box')!.getAttribute('data-invalid')).toBe('');
    expect(textarea().getAttribute('aria-describedby')).toContain(`${id}-error`);
    expect(el.querySelector('.kt-field__error')?.textContent).toContain('Requis');
  });

  it('bouton clear : aria-label par défaut "Clear" ; icône en tête aria-hidden', () => {
    host.clearable.set(true);
    host.value.set('x');
    host.icon.set('person');
    fixture.detectChanges();
    expect(clearButton()!.getAttribute('aria-label')).toBe('Clear');
    expect(el.querySelector('.kt-field-box__icon')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('Échap vide quand clear visible (+preventDefault), inerte sinon', () => {
    host.clearable.set(true);
    host.value.set('abc');
    fixture.detectChanges();
    const ev = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    textarea().dispatchEvent(ev);
    fixture.detectChanges();
    expect(host.value()).toBe('');
    expect(ev.defaultPrevented).toBe(true);

    const ev2 = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    textarea().dispatchEvent(ev2);
    expect(ev2.defaultPrevented).toBe(false);
  });

  it('maxLength : attribut natif posé si fourni, absent sinon', () => {
    expect(textarea().hasAttribute('maxlength')).toBe(false);
    host.maxLength.set(200);
    fixture.detectChanges();
    expect(textarea().getAttribute('maxlength')).toBe('200');
  });

  it('placeholder natif (apparence fill : valeur telle quelle)', () => {
    host.placeholder.set('Quelques mots…');
    fixture.detectChanges();
    expect(textarea().getAttribute('placeholder')).toBe('Quelques mots…');
  });

  it('name et autocomplete posés si non vides, absents sinon', () => {
    expect(textarea().hasAttribute('name')).toBe(false);
    expect(textarea().hasAttribute('autocomplete')).toBe(false);
    host.name.set('bio');
    host.autocomplete.set('off');
    fixture.detectChanges();
    expect(textarea().getAttribute('name')).toBe('bio');
    expect(textarea().getAttribute('autocomplete')).toBe('off');
  });

  it('prefix et suffix rendus comme texte', () => {
    host.prefix.set('@');
    host.suffix.set('.com');
    fixture.detectChanges();
    const affixes = Array.from(el.querySelectorAll('.kt-field-box__affix')).map((a) => a.textContent?.trim());
    expect(affixes).toContain('@');
    expect(affixes).toContain('.com');
  });

  it('reset() ré-aligne la textarea native sur value()', () => {
    host.value.set('propre');
    fixture.detectChanges();
    textarea().value = 'périmé';
    field().reset();
    expect(textarea().value).toBe('propre');
  });
});
