import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ValidationError } from '@angular/forms/signals';
import { KtFieldErrorMatcher } from '../field/field-config';
import { KtRadio } from './radio';
import { KtRadioGroup } from './radio-group';

interface User {
  id: number;
  name: string;
}

@Component({
  imports: [KtRadioGroup, KtRadio],
  template: `
    <kt-radio-group
      [(value)]="value"
      [label]="label()"
      [hint]="hint()"
      [errors]="errors()"
      [invalid]="invalid()"
      [disabled]="disabled()"
      [required]="required()"
      [pending]="pending()"
      [ariaLabel]="ariaLabel()"
      [showAllErrors]="showAllErrors()"
      [errorMatcher]="errorMatcher()"
      [id]="groupId()"
      [name]="name()"
    >
      <kt-radio optionValue="free" label="Gratuit" />
      <kt-radio optionValue="pro" label="Pro" hint="49€/mois" [id]="radioId()" />
      <kt-radio optionValue="ent" label="Entreprise" [disabled]="entDisabled()" />
    </kt-radio-group>
  `,
})
class RadioHost {
  value = signal<string | null>(null);
  label = signal<string | undefined>('Offre');
  hint = signal<string | undefined>(undefined);
  errors = signal<readonly ValidationError[]>([]);
  invalid = signal(false);
  disabled = signal(false);
  required = signal(false);
  entDisabled = signal(false);
  pending = signal(false);
  ariaLabel = signal<string | undefined>(undefined);
  showAllErrors = signal(false);
  errorMatcher = signal<KtFieldErrorMatcher | undefined>(undefined);
  groupId = signal<string | undefined>(undefined);
  name = signal('');
  radioId = signal<string | undefined>(undefined);
}

@Component({
  imports: [KtRadioGroup, KtRadio],
  template: `
    <kt-radio-group [(value)]="value" label="Responsable" [compareWith]="sameId">
      @for (u of users; track u.id) {
        <kt-radio [optionValue]="u" [label]="u.name" />
      }
    </kt-radio-group>
  `,
})
class ObjectRadioHost {
  users: User[] = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ];
  value = signal<User | null>(null);
  sameId = (a: User, b: User): boolean => a.id === b.id;
}

describe('RadioGroup / Radio', () => {
  function inputs(el: HTMLElement): HTMLInputElement[] {
    return Array.from(el.querySelectorAll('input[type="radio"]'));
  }

  describe('valeurs primitives', () => {
    let fixture: ComponentFixture<RadioHost>;
    let host: RadioHost;
    let el: HTMLElement;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [RadioHost] });
      fixture = TestBed.createComponent(RadioHost);
      host = fixture.componentInstance;
      el = fixture.nativeElement;
      fixture.detectChanges();
    });

    it('exposes a radiogroup role labelled by the legend', () => {
      const group = el.querySelector('[role="radiogroup"]')!;
      const legend = el.querySelector('.kt-radio-group__legend')!;
      expect(group.getAttribute('aria-labelledby')).toBe(legend.id);
      expect(legend.textContent).toContain('Offre');
    });

    it('shares a single name across all radios (native keyboard grouping)', () => {
      const names = new Set(inputs(el).map((i) => i.name));
      expect(names.size).toBe(1);
      expect([...names][0]).toBeTruthy();
    });

    it('selects the value matching the model and nothing when null', () => {
      expect(inputs(el).some((i) => i.checked)).toBe(false);

      host.value.set('pro');
      fixture.detectChanges();
      const checked = inputs(el).filter((i) => i.checked);
      expect(checked.length).toBe(1);
      expect(checked[0]).toBe(inputs(el)[1]); // 'pro' = 2e radio, pas n'importe lequel
    });

    it('commits the radio value to the model on change', () => {
      inputs(el)[0].click();
      fixture.detectChanges();
      expect(host.value()).toBe('free');
    });

    it('exposes a per-option hint via aria-describedby', () => {
      const proInput = inputs(el)[1];
      const describedBy = proInput.getAttribute('aria-describedby')!;
      expect(describedBy).toBeTruthy();
      expect(el.querySelector(`#${describedBy}`)?.textContent).toContain('49€/mois');
    });

    it('disables every radio when the group is disabled', () => {
      host.disabled.set(true);
      fixture.detectChanges();
      expect(inputs(el).every((i) => i.disabled)).toBe(true);
    });

    it('disables only the targeted radio when set per option', () => {
      host.entDisabled.set(true);
      fixture.detectChanges();
      const states = inputs(el).map((i) => i.disabled);
      expect(states).toEqual([false, false, true]);
    });

    it('reflects aria-required on the group', () => {
      host.required.set(true);
      fixture.detectChanges();
      expect(el.querySelector('[role="radiogroup"]')?.getAttribute('aria-required')).toBe('true');
    });

    it('reflects the pending state via aria-busy and data-pending', () => {
      host.pending.set(true);
      fixture.detectChanges();
      const group = el.querySelector('[role="radiogroup"]')!;
      expect(group.getAttribute('aria-busy')).toBe('true');
      expect(group.getAttribute('data-pending')).toBe('');
    });

    it('focuses the first enabled radio when none is selected (focusBoundControl)', () => {
      group().focus();
      expect(document.activeElement).toBe(inputs(el)[0]);
    });

    it('focuses the checked radio when a value is selected (focusBoundControl)', () => {
      host.value.set('pro');
      fixture.detectChanges();
      group().focus();
      expect(document.activeElement).toBe(inputs(el)[1]);
    });

    function group(): KtRadioGroup<string> {
      return fixture.debugElement.query((de) => de.componentInstance instanceof KtRadioGroup)
        .componentInstance as KtRadioGroup<string>;
    }

    it('shows group-level errors only after touched', () => {
      host.invalid.set(true);
      host.errors.set([{ kind: 'required', message: 'Veuillez choisir une offre' }]);
      fixture.detectChanges();
      expect(el.querySelector('.kt-radio-group__error-message')).toBeNull();

      inputs(el)[0].click();
      fixture.detectChanges();
      expect(el.querySelector('.kt-radio-group__error-message')?.textContent).toContain('Veuillez choisir une offre');
    });

    it('repli sur aria-label quand le label du groupe est absent', () => {
      host.label.set(undefined);
      host.ariaLabel.set('Choix de l’offre');
      fixture.detectChanges();
      const grp = el.querySelector('[role="radiogroup"]')!;
      expect(grp.hasAttribute('aria-labelledby')).toBe(false);
      expect(grp.getAttribute('aria-label')).toBe('Choix de l’offre');
    });

    it('aria-invalid="true" sur le radiogroup quand showInvalid, absent tant que !touched', () => {
      const grp = el.querySelector('[role="radiogroup"]')!;
      host.invalid.set(true);
      host.errors.set([{ kind: 'required', message: 'Requis' }]);
      fixture.detectChanges();
      expect(grp.hasAttribute('aria-invalid')).toBe(false); // pas encore touché

      group().touched.set(true);
      fixture.detectChanges();
      expect(grp.getAttribute('aria-invalid')).toBe('true');
    });

    it('hint de GROUPE rendu et référencé, puis remplacé par l’erreur (exclusion mutuelle)', () => {
      host.hint.set('Choisissez une formule');
      fixture.detectChanges();
      const grp = el.querySelector('[role="radiogroup"]')!;
      const groupHint = el.querySelector('.kt-radio-group__hint')!;
      expect(groupHint.textContent).toContain('Choisissez une formule');
      expect(grp.getAttribute('aria-describedby')).toBe(groupHint.id);

      host.invalid.set(true);
      host.errors.set([{ kind: 'required', message: 'Requis' }]);
      group().touched.set(true);
      fixture.detectChanges();
      expect(el.querySelector('.kt-radio-group__hint')).toBeNull(); // hint masqué
      expect(grp.getAttribute('aria-describedby')).toContain('-error');
    });

    it('astérisque requis dans la légende, aria-hidden="true"', () => {
      host.required.set(true);
      fixture.detectChanges();
      const mark = el.querySelector('.kt-radio-group__required')!;
      expect(mark).toBeTruthy();
      expect(mark.getAttribute('aria-hidden')).toBe('true');
    });

    it('showAllErrors : une seule erreur par défaut, toutes avec le flag', () => {
      host.errorMatcher.set((s) => s.invalid);
      host.invalid.set(true);
      host.errors.set([
        { kind: 'required', message: 'Requis' },
        { kind: 'custom', message: 'Autre' },
      ]);
      fixture.detectChanges();
      expect(el.querySelectorAll('.kt-radio-group__error-message').length).toBe(1);
      host.showAllErrors.set(true);
      fixture.detectChanges();
      expect(el.querySelectorAll('.kt-radio-group__error-message').length).toBe(2);
    });

    it('select() sur groupe désactivé : ne mute ni value ni touched', () => {
      host.disabled.set(true);
      fixture.detectChanges();
      group().select('pro');
      expect(host.value()).toBeNull();
      expect(group().touched()).toBe(false);
    });

    it('un radio désactivé ne commit pas au change (garde isDisabled)', () => {
      host.entDisabled.set(true);
      fixture.detectChanges();
      inputs(el)[2].dispatchEvent(new Event('change'));
      fixture.detectChanges();
      expect(host.value()).toBeNull();
    });

    it('select() commit la valeur et marque touched ; le blur d’un radio marque le groupe touched', () => {
      group().select('pro');
      expect(host.value()).toBe('pro');
      expect(group().touched()).toBe(true);

      group().touched.set(false);
      inputs(el)[0].dispatchEvent(new Event('blur'));
      expect(group().touched()).toBe(true);
    });

    it('name custom propagé identiquement à tous les inputs', () => {
      host.name.set('offre');
      fixture.detectChanges();
      expect(inputs(el).map((i) => i.name)).toEqual(['offre', 'offre', 'offre']);
    });

    it('désélection : repasser à null décoche tous les inputs', () => {
      host.value.set('pro');
      fixture.detectChanges();
      expect(inputs(el).some((i) => i.checked)).toBe(true);
      host.value.set(null);
      fixture.detectChanges();
      expect(inputs(el).some((i) => i.checked)).toBe(false);
    });

    it('exclusivité modèle : migrer pro→free déplace la coche (un seul coché)', () => {
      host.value.set('pro');
      fixture.detectChanges();
      host.value.set('free');
      fixture.detectChanges();
      const checked = inputs(el).filter((i) => i.checked);
      expect(checked.length).toBe(1);
      expect(checked[0]).toBe(inputs(el)[0]);
    });

    it('id imposé sur un kt-radio : propagé à l’input et au hintId (aria-describedby)', () => {
      host.radioId.set('radio-pro');
      fixture.detectChanges();
      const proInput = inputs(el)[1];
      expect(proInput.id).toBe('radio-pro');
      expect(proInput.getAttribute('aria-describedby')).toBe('radio-pro-hint');
      expect(el.querySelector('#radio-pro-hint')?.textContent).toContain('49€/mois');
    });
  });

  describe('valeurs objet (compareWith)', () => {
    let fixture: ComponentFixture<ObjectRadioHost>;
    let host: ObjectRadioHost;
    let el: HTMLElement;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [ObjectRadioHost] });
      fixture = TestBed.createComponent(ObjectRadioHost);
      host = fixture.componentInstance;
      el = fixture.nativeElement;
      fixture.detectChanges();
    });

    it('preselects via compareWith on a different object instance', () => {
      host.value.set({ id: 2, name: 'Bob' });
      fixture.detectChanges();
      const checked = inputs(el).filter((i) => i.checked);
      expect(checked.length).toBe(1);
      expect(checked[0]).toBe(inputs(el)[1]); // Bob (id 2) = 2e radio, prouve le compareWith par id
    });

    it('commits the whole object on change', () => {
      inputs(el)[0].click();
      fixture.detectChanges();
      expect(host.value()).toEqual({ id: 1, name: 'Alice' });
    });
  });

  it("n'expose l'id que sur le conteneur role=radiogroup et sur l'input radio interne", () => {
    @Component({
      imports: [KtRadioGroup, KtRadio],
      template: `
        <kt-radio-group id="group-civility" label="Civilité">
          <kt-radio id="radio-mme" optionValue="mme" label="Madame" />
          <kt-radio id="radio-m" optionValue="m" label="Monsieur" />
        </kt-radio-group>
      `,
    })
    class StaticIdRadioHost {}

    const staticFixture = TestBed.createComponent(StaticIdRadioHost);
    staticFixture.detectChanges();
    const staticEl = staticFixture.nativeElement as HTMLElement;
    const groupHostEl = staticEl.querySelector('kt-radio-group')!;
    const groupDiv = staticEl.querySelector('div[role="radiogroup"]')!;
    const radioHostEls = staticEl.querySelectorAll('kt-radio');
    const inputEls = staticEl.querySelectorAll<HTMLInputElement>('input[type="radio"]');

    // Group
    expect(groupHostEl.hasAttribute('id')).toBe(false);
    expect(groupDiv.getAttribute('id')).toBe('group-civility');
    expect(staticEl.querySelectorAll('#group-civility').length).toBe(1);

    // Individual radio
    expect(radioHostEls[0].hasAttribute('id')).toBe(false);
    expect(inputEls[0].getAttribute('id')).toBe('radio-mme');
    expect(staticEl.querySelectorAll('#radio-mme').length).toBe(1);

    expect(radioHostEls[1].hasAttribute('id')).toBe(false);
    expect(inputEls[1].getAttribute('id')).toBe('radio-m');
    expect(staticEl.querySelectorAll('#radio-m').length).toBe(1);
  });
});
