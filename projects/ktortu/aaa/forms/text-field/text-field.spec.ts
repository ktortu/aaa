import { Component, TemplateRef, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ValidationError } from '@angular/forms/signals';
import { KT_FIELD_CONFIG, KtFieldErrorMatcher, type KtFieldAppearance, type KtFloatLabel } from '../field/field-config';
import { type KtSuggestion } from '../datalist';
import { KtTextField, type KtTextFieldType } from './text-field';

@Component({
  imports: [KtTextField],
  template: `
    <kt-text-field
      [(value)]="value"
      [label]="label()"
      [hint]="hint()"
      [errors]="errors()"
      [invalid]="invalid()"
      [required]="required()"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [clearable]="clearable()"
      [prefix]="prefix()"
      [suffix]="suffix()"
      [type]="type()"
      [name]="name()"
      [autocomplete]="autocomplete()"
      [placeholder]="placeholder()"
      [appearance]="appearance()"
      [floatLabel]="floatLabel()"
      [suggestions]="suggestions()"
      [errorMatcher]="errorMatcher()"
      [minLength]="minLength()"
      [maxLength]="maxLength()"
      [pattern]="pattern()"
      [pending]="pending()"
    />
    <ng-template #affix><span class="tpl-affix">€</span></ng-template>
  `,
})
class TextFieldHost {
  value = signal('');
  label = signal<string | undefined>('Nom');
  hint = signal<string | undefined>(undefined);
  errors = signal<readonly ValidationError[]>([]);
  invalid = signal(false);
  required = signal(false);
  disabled = signal(false);
  readonly = signal(false);
  clearable = signal(false);
  prefix = signal<string | TemplateRef<unknown> | undefined>(undefined);
  suffix = signal<string | TemplateRef<unknown> | undefined>(undefined);
  type = signal<KtTextFieldType>('text');
  name = signal('');
  autocomplete = signal<AutoFill | undefined>(undefined);
  placeholder = signal<string | undefined>(undefined);
  appearance = signal<KtFieldAppearance | undefined>(undefined);
  floatLabel = signal<KtFloatLabel | undefined>(undefined);
  suggestions = signal<readonly KtSuggestion<string>[] | undefined>(undefined);
  errorMatcher = signal<KtFieldErrorMatcher | undefined>(undefined);
  minLength = signal<number | undefined>(undefined);
  maxLength = signal<number | undefined>(undefined);
  pattern = signal<readonly RegExp[]>([]);
  pending = signal(false);
  affix = viewChild.required<TemplateRef<unknown>>('affix');
}

describe('TextField', () => {
  let fixture: ComponentFixture<TextFieldHost>;
  let host: TextFieldHost;
  let el: HTMLElement;

  function setup(): void {
    TestBed.configureTestingModule({ imports: [TextFieldHost] });
    fixture = TestBed.createComponent(TextFieldHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  }

  function input(): HTMLInputElement {
    return el.querySelector('input')!;
  }

  function clearButton(): HTMLButtonElement | null {
    return el.querySelector('.kt-field-box__clear');
  }

  beforeEach(() => setup());

  it('renders an input and a label', () => {
    expect(input()).toBeTruthy();
    expect(el.querySelector('label')?.textContent).toContain('Nom');
  });

  it('reflects the bound value into the input', () => {
    host.value.set('Alice');
    fixture.detectChanges();
    expect(input().value).toBe('Alice');
  });

  it('updates the bound value on input', () => {
    input().value = 'Bob';
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.value()).toBe('Bob');
  });

  it('hides the clear button unless clearable and non-empty', () => {
    expect(clearButton()).toBeNull();
    host.clearable.set(true);
    fixture.detectChanges();
    expect(clearButton()).toBeNull();
    host.value.set('x');
    fixture.detectChanges();
    expect(clearButton()).toBeTruthy();
  });

  it('clears the value and refocuses the input', () => {
    host.clearable.set(true);
    host.value.set('x');
    fixture.detectChanges();
    clearButton()!.click();
    fixture.detectChanges();
    expect(host.value()).toBe('');
    expect(document.activeElement).toBe(input());
  });

  it('focuses the native input via focus() (Signal Forms focusBoundControl)', () => {
    const field = fixture.debugElement.query((de) => de.componentInstance instanceof KtTextField)
      .componentInstance as KtTextField;
    field.focus();
    expect(document.activeElement).toBe(input());
  });

  it('reflects native minlength/maxlength/pattern constraints', () => {
    host.minLength.set(3);
    host.maxLength.set(10);
    host.pattern.set([/[a-z]+/]);
    fixture.detectChanges();
    expect(input().getAttribute('minlength')).toBe('3');
    expect(input().getAttribute('maxlength')).toBe('10');
    expect(input().getAttribute('pattern')).toBe('[a-z]+');
  });

  it('reflects the pending state via aria-busy and data-pending', () => {
    expect(input().getAttribute('aria-busy')).toBeNull();
    host.pending.set(true);
    fixture.detectChanges();
    expect(input().getAttribute('aria-busy')).toBe('true');
    expect(el.querySelector('.kt-field-box')?.getAttribute('data-pending')).toBe('');
  });

  it('reset() re-syncs the native input to the model value', () => {
    const field = fixture.debugElement.query((de) => de.componentInstance instanceof KtTextField)
      .componentInstance as KtTextField;
    host.value.set('clean');
    fixture.detectChanges();
    input().value = 'stale'; // désync DOM ↔ modèle
    field.reset();
    expect(input().value).toBe('clean');
  });

  it('gives the clear button a neutral default accessible label', () => {
    host.clearable.set(true);
    host.value.set('x');
    fixture.detectChanges();
    expect(clearButton()!.getAttribute('aria-label')).toBe('Clear');
  });

  it('lets FIELD_CONFIG override the clear button label', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [TextFieldHost],
      providers: [{ provide: KT_FIELD_CONFIG, useValue: { clearLabel: 'Effacer' } }],
    });
    const f = TestBed.createComponent(TextFieldHost);
    f.componentInstance.clearable.set(true);
    f.componentInstance.value.set('x');
    f.detectChanges();
    const btn: HTMLButtonElement = f.nativeElement.querySelector('.kt-field-box__clear');
    expect(btn.getAttribute('aria-label')).toBe('Effacer');
  });

  it('does not mark invalid before the field is touched', () => {
    host.invalid.set(true);
    host.errors.set([{ kind: 'required', message: 'Requis' }]);
    fixture.detectChanges();
    expect(input().getAttribute('aria-invalid')).not.toBe('true');
    expect(el.querySelector('.kt-field__error')?.textContent).not.toContain('Requis');
  });

  it('marks invalid and shows the error after blur', () => {
    host.invalid.set(true);
    host.errors.set([{ kind: 'required', message: 'Requis' }]);
    input().dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(el.querySelector('.kt-field__error')?.textContent).toContain('Requis');
  });

  it('renders a string prefix', () => {
    host.prefix.set('https://');
    fixture.detectChanges();
    expect(el.querySelector('.kt-field-box__affix')?.textContent).toContain('https://');
  });

  it('shows errors immediately with a custom errorMatcher (edit-form case)', () => {
    host.errorMatcher.set((s) => s.invalid);
    host.invalid.set(true);
    host.errors.set([{ kind: 'required', message: 'Requis' }]);
    fixture.detectChanges();
    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(el.querySelector('.kt-field__error')?.textContent).toContain('Requis');
  });

  function field(): KtTextField {
    return fixture.debugElement.query((de) => de.componentInstance instanceof KtTextField)
      .componentInstance as KtTextField;
  }

  it('required : aria-required natif + astérisque visuel', () => {
    host.required.set(true);
    fixture.detectChanges();
    expect(input().getAttribute('aria-required')).toBe('true');
    expect(el.querySelector('.kt-field__required')).toBeTruthy();
  });

  it('associe le label à l’input via for/id', () => {
    const id = input().id;
    expect(id).toBeTruthy();
    expect(el.querySelector('label')!.getAttribute('for')).toBe(id);
  });

  it('aria-describedby pointe vers le hint puis l’erreur', () => {
    host.hint.set('Indice');
    fixture.detectChanges();
    const id = input().id;
    expect(input().getAttribute('aria-describedby')).toContain(`${id}-hint`);

    host.errorMatcher.set((s) => s.invalid);
    host.invalid.set(true);
    host.errors.set([{ kind: 'required', message: 'Requis' }]);
    fixture.detectChanges();
    expect(input().getAttribute('aria-describedby')).toContain(`${id}-error`);
  });

  it('disabled : input désactivé, data-disabled, et bouton clear supprimé', () => {
    host.clearable.set(true);
    host.value.set('x');
    host.disabled.set(true);
    fixture.detectChanges();
    expect(input().disabled).toBe(true);
    expect(el.querySelector('.kt-field-box')!.getAttribute('data-disabled')).toBe('');
    expect(clearButton()).toBeNull();
  });

  it('readonly : input en lecture seule et bouton clear supprimé', () => {
    host.clearable.set(true);
    host.value.set('x');
    host.readonly.set(true);
    fixture.detectChanges();
    expect(input().readOnly).toBe(true);
    expect(clearButton()).toBeNull();
  });

  it('type natif : "text" par défaut, reflète email', () => {
    expect(input().getAttribute('type')).toBe('text');
    host.type.set('email');
    fixture.detectChanges();
    expect(input().getAttribute('type')).toBe('email');
  });

  it('Échap vide le champ quand showClear, et ne fait rien sinon', () => {
    host.clearable.set(true);
    host.value.set('abc');
    fixture.detectChanges();
    const ev = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    input().dispatchEvent(ev);
    fixture.detectChanges();
    expect(host.value()).toBe('');
    expect(ev.defaultPrevented).toBe(true);

    // champ vide → Escape inerte (pas de preventDefault)
    const ev2 = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    input().dispatchEvent(ev2);
    expect(ev2.defaultPrevented).toBe(false);
  });

  it('suggestions : datalist rendu, attribut list lié ; absent sans suggestion', () => {
    expect(input().hasAttribute('list')).toBe(false);
    host.suggestions.set(['Alice', { value: 'bob', label: 'Bob' }]);
    fixture.detectChanges();
    const listId = input().getAttribute('list')!;
    expect(listId).toBeTruthy();
    const datalist = el.querySelector(`#${listId}`)!;
    expect(datalist.tagName.toLowerCase()).toBe('datalist');
    const opts = datalist.querySelectorAll('option');
    expect(opts.length).toBe(2);
    expect(opts[1].getAttribute('value')).toBe('bob');
    expect(opts[1].getAttribute('label')).toBe('Bob');
  });

  it('le blur seul (champ valide) marque touched', () => {
    expect(field().touched()).toBe(false);
    input().dispatchEvent(new Event('blur'));
    expect(field().touched()).toBe(true);
  });

  it('placeholder selon appearance/floatLabel : fill direct, outline+auto sentinelle, outline+always réel', () => {
    host.placeholder.set('Ex. Jean');
    fixture.detectChanges();
    expect(input().getAttribute('placeholder')).toBe('Ex. Jean'); // fill : direct

    host.appearance.set('outline');
    fixture.detectChanges();
    expect(input().getAttribute('placeholder')).toBe('Ex. Jean'); // placeholder fourni → réel

    host.placeholder.set(undefined);
    fixture.detectChanges();
    expect(input().getAttribute('placeholder')).toBe(' '); // outline+auto sans placeholder → sentinelle

    host.floatLabel.set('always');
    fixture.detectChanges();
    expect(input().hasAttribute('placeholder')).toBe(false); // outline+always sans placeholder → aucun
  });

  it('pattern : seule la première regex est posée ; [] retire l’attribut', () => {
    host.pattern.set([/[a-z]+/, /\d+/]);
    fixture.detectChanges();
    expect(input().getAttribute('pattern')).toBe('[a-z]+');
    host.pattern.set([]);
    fixture.detectChanges();
    expect(input().hasAttribute('pattern')).toBe(false);
  });

  it('name et autocomplete : posés si non vides, absents sinon', () => {
    expect(input().hasAttribute('name')).toBe(false);
    expect(input().hasAttribute('autocomplete')).toBe(false);
    host.name.set('email');
    host.autocomplete.set('email');
    fixture.detectChanges();
    expect(input().getAttribute('name')).toBe('email');
    expect(input().getAttribute('autocomplete')).toBe('email');
  });

  it('suffix texte et TemplateRef, prefix TemplateRef', () => {
    host.suffix.set('kg');
    fixture.detectChanges();
    const affixes = () => Array.from(el.querySelectorAll('.kt-field-box__affix')).map((a) => a.textContent?.trim());
    expect(affixes()).toContain('kg');

    host.suffix.set(host.affix());
    host.prefix.set(host.affix());
    fixture.detectChanges();
    expect(el.querySelectorAll('.tpl-affix').length).toBe(2); // prefix + suffix via TemplateRef
  });

  it('affiche une seule erreur par défaut même si plusieurs sont fournies', () => {
    host.errorMatcher.set((s) => s.invalid);
    host.invalid.set(true);
    host.errors.set([
      { kind: 'required', message: 'Requis' },
      { kind: 'custom', message: 'Autre' },
    ]);
    fixture.detectChanges();
    expect(el.querySelectorAll('.kt-field__error-message').length).toBe(1);
  });
});
