// Dogfood Phase 1 du KtSelectHarness — joue le rôle d'un CONSOMMATEUR de la lib qui teste son
// propre formulaire via le harness, sans connaître le DOM interne du Select.
//
// NB : aucun polyfill `scrollIntoView` ici (contrairement aux autres specs select). C'est volontaire :
// le garde `activeEl?.scrollIntoView?.()` ajouté dans base-select.ts rend le composant tolérant en
// jsdom. Ce spec est donc la preuve qu'un consommateur n'a RIEN à polyfiller pour nous tester.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { KtSelect } from './select';
import { KtSelectHarness } from './select.harness';

@Component({
  imports: [KtSelect],
  template: `
    <kt-select label="Fruit" placeholder="Choisir" [options]="fruits" [(value)]="fruit" />
    <kt-select label="Pays" placeholder="Choisir" [options]="countries" [(value)]="country" />
  `,
})
class ConsumerForm {
  fruits = ['Pomme', 'Banane', 'Cerise'];
  countries = ['France', 'Italie', 'Japon'];
  fruit = signal<string | null>(null);
  country = signal<string | null>(null);
}

@Component({
  imports: [KtSelect],
  template: `<kt-select label="Fruit" [filterable]="true" [options]="fruits" [(value)]="fruit" />`,
})
class FilterableConsumer {
  fruits = ['Pomme', 'Banane', 'Cerise', 'Pêche'];
  fruit = signal<string | null>(null);
}

interface City {
  name: string;
  closed?: boolean;
}

@Component({
  imports: [KtSelect],
  template: `<kt-select
    label="Ville"
    [options]="cities"
    optionLabel="name"
    [optionDisabled]="isClosed"
    [(value)]="city"
  />`,
})
class CityForm {
  cities: City[] = [{ name: 'Lyon' }, { name: 'Nice', closed: true }];
  isClosed = (c: City): boolean => !!c.closed;
  city = signal<City | null>(null);
}

describe('KtSelectHarness (dogfood)', () => {
  it('un consommateur pilote son champ de bout en bout', async () => {
    const fixture = TestBed.createComponent(ConsumerForm);
    const select = await TestbedHarnessEnvironment.loader(fixture).getHarness(KtSelectHarness.with({ label: 'Fruit' }));

    expect(await select.getValueText()).toBe('Choisir');
    expect(await select.isOpen()).toBe(false);

    await select.open();
    expect(await select.isOpen()).toBe(true);
    expect(await select.getOptionTexts()).toEqual(['Pomme', 'Banane', 'Cerise']);

    await select.clickOption({ text: 'Banane' });
    expect(await select.getValueText()).toBe('Banane');
    expect(fixture.componentInstance.fruit()).toBe('Banane');
  });

  it('cible le bon select parmi plusieurs via le filtre par label', async () => {
    const fixture = TestBed.createComponent(ConsumerForm);
    const loader = TestbedHarnessEnvironment.loader(fixture);

    const pays = await loader.getHarness(KtSelectHarness.with({ label: 'Pays' }));
    await pays.clickOption({ text: 'Japon' });

    expect(fixture.componentInstance.country()).toBe('Japon');
    expect(fixture.componentInstance.fruit()).toBeNull(); // l'autre select n'a pas bougé
  });

  it('lit l état des options via le sous-harness (option désactivée)', async () => {
    const fixture = TestBed.createComponent(CityForm);
    const select = await TestbedHarnessEnvironment.loader(fixture).getHarness(KtSelectHarness);

    const [lyon, nice] = await select.getOptions();
    expect(await lyon.getText()).toBe('Lyon');
    expect(await lyon.isDisabled()).toBe(false);
    expect(await nice.isDisabled()).toBe(true);
  });

  it('filtre la liste et lit l option active (mode filtrable)', async () => {
    const fixture = TestBed.createComponent(FilterableConsumer);
    const select = await TestbedHarnessEnvironment.loader(fixture).getHarness(KtSelectHarness);

    await select.open();
    expect(await select.getActiveOptionText()).toBe('Pomme'); // 1re option active à l'ouverture

    await select.filter('ceri');
    expect(await select.getOptionTexts()).toEqual(['Cerise']);

    await select.clickOption({ text: 'Cerise' });
    expect(fixture.componentInstance.fruit()).toBe('Cerise');
  });

  it('ferme le popup via Échap', async () => {
    const fixture = TestBed.createComponent(ConsumerForm);
    const select = await TestbedHarnessEnvironment.loader(fixture).getHarness(KtSelectHarness.with({ label: 'Fruit' }));

    await select.open();
    expect(await select.isOpen()).toBe(true);
    await select.close();
    expect(await select.isOpen()).toBe(false);
  });
});
