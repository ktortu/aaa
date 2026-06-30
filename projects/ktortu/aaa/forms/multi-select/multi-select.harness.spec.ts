// Dogfood Phase 2 du KtMultiSelectHarness — posture « faux consommateur ».
// Sans polyfill scrollIntoView (le fix base-select rend le composant tolérant en jsdom).
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { KtMultiSelect } from './multi-select';
import { KtMultiSelectHarness } from './multi-select.harness';

@Component({
  imports: [KtMultiSelect],
  template: `<kt-multi-select label="Fruits" placeholder="Choisir" [options]="fruits" [(value)]="value" clearable />`,
})
class ConsumerForm {
  fruits = ['Pomme', 'Banane', 'Cerise'];
  value = signal<string[]>([]);
}

describe('KtMultiSelectHarness (dogfood)', () => {
  it('toggle plusieurs options par clic — le popup reste ouvert', async () => {
    const fixture = TestBed.createComponent(ConsumerForm);
    const ms = await TestbedHarnessEnvironment.loader(fixture).getHarness(KtMultiSelectHarness);

    await ms.toggleOption({ text: 'Banane' });
    expect(await ms.isOpen()).toBe(true); // spécifique multi : ne se ferme pas
    await ms.toggleOption({ text: 'Cerise' });

    expect(fixture.componentInstance.value()).toEqual(['Banane', 'Cerise']);
    expect(await ms.getChipTexts()).toEqual(['Banane', 'Cerise']);

    const banane = await ms.getOption({ text: 'Banane' });
    expect(await banane.isSelected()).toBe(true);
    const pomme = await ms.getOption({ text: 'Pomme' });
    expect(await pomme.isSelected()).toBe(false);
  });

  it('retire une sélection via le chip', async () => {
    const fixture = TestBed.createComponent(ConsumerForm);
    const ms = await TestbedHarnessEnvironment.loader(fixture).getHarness(KtMultiSelectHarness);

    await ms.toggleOption({ text: 'Banane' });
    await ms.toggleOption({ text: 'Cerise' });
    await ms.removeChip(0);

    expect(fixture.componentInstance.value()).toEqual(['Cerise']);
    expect(await ms.getChipTexts()).toEqual(['Cerise']);
  });

  it('vide toute la sélection via clear', async () => {
    const fixture = TestBed.createComponent(ConsumerForm);
    const ms = await TestbedHarnessEnvironment.loader(fixture).getHarness(KtMultiSelectHarness);

    await ms.toggleOption({ text: 'Banane' });
    await ms.toggleOption({ text: 'Cerise' });
    await ms.clear();

    expect(fixture.componentInstance.value()).toEqual([]);
    expect(await ms.getChipTexts()).toEqual([]);
  });
});
