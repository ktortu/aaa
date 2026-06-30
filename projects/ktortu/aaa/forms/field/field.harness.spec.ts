// Dogfood du KtFieldHarness — posture « faux consommateur ».
// Valide aussi le pattern de COMPOSITION : un harness de contrôle qui renvoie le KtFieldHarness.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { KtField, KtFieldError } from './field';
import { KtFieldControl } from './field-control';
import { KtFieldHarness } from './field.harness';
import { KtSelect } from '../select/select';
import { KtSelectHarness } from '../select/select.harness';

@Component({
  imports: [KtField, KtFieldControl],
  template: `<kt-field
    [label]="label"
    [hint]="hint()"
    [required]="required()"
    [invalid]="invalid()"
    [errors]="errors()"
  >
    <input ktFieldControl />
  </kt-field>`,
})
class FieldHost {
  label = 'Courriel';
  hint = signal<string | undefined>(undefined);
  required = signal(false);
  invalid = signal(false);
  errors = signal<readonly KtFieldError[]>([]);
}

@Component({
  imports: [KtSelect],
  template: `<kt-select label="Pays" [options]="opts" />`,
})
class SelectHost {
  opts = ['France', 'Italie'];
}

describe('KtFieldHarness (dogfood)', () => {
  it('lit label, hint, requis et erreurs', async () => {
    const fixture = TestBed.createComponent(FieldHost);
    const field = await TestbedHarnessEnvironment.loader(fixture).getHarness(KtFieldHarness);

    expect(await field.getLabel()).toBe('Courriel');
    expect(await field.isRequired()).toBe(false);
    expect(await field.hasError()).toBe(false);

    fixture.componentInstance.required.set(true);
    fixture.componentInstance.hint.set('Adresse professionnelle');
    expect(await field.isRequired()).toBe(true);
    expect(await field.getHint()).toBe('Adresse professionnelle');

    fixture.componentInstance.invalid.set(true);
    fixture.componentInstance.errors.set([{ kind: 'required', message: 'Requis' }]);
    expect(await field.getErrorMessages()).toEqual(['Requis']);
    expect(await field.hasError()).toBe(true);
  });

  it('cible un champ par son label via le prédicat', async () => {
    const fixture = TestBed.createComponent(FieldHost);
    const field = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      KtFieldHarness.with({ label: 'Courriel' }),
    );
    expect(await field.getLabel()).toBe('Courriel');
  });

  it('composition : un KtSelectHarness expose son KtFieldHarness', async () => {
    const fixture = TestBed.createComponent(SelectHost);
    const select = await TestbedHarnessEnvironment.loader(fixture).getHarness(KtSelectHarness);

    const field = await select.getField();
    expect(await field.getLabel()).toBe('Pays');
  });
});
