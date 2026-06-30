// Dogfood du KtMenuHarness — posture « faux consommateur ».
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Menu, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { KtMenu, KtMenuItem } from './menu';
import { KtMenuItemCheckbox } from './menu-toggle';
import { KtMenuTrigger } from './menu-trigger';
import { KtMenuHarness } from './menu.harness';

@Component({
  imports: [Menu, MenuItem, MenuTrigger, KtMenu, KtMenuItem, KtMenuItemCheckbox, KtMenuTrigger],
  template: `
    <button ngMenuTrigger ktMenuTrigger [menu]="m">Options</button>
    <div ngMenu ktMenu #m="ngMenu">
      <button ngMenuItem ktMenuItem [value]="'new'">Nouveau</button>
      <button ngMenuItem ktMenuItem ktMenuItemCheckbox role="menuitemcheckbox" [value]="'wrap'" [(checked)]="wrap">
        Retour à la ligne
      </button>
    </div>
  `,
})
class MenuConsumer {
  wrap = signal(false);
}

describe('KtMenuHarness (dogfood)', () => {
  it('ouvre, liste les items, ferme', async () => {
    const fixture = TestBed.createComponent(MenuConsumer);
    const menu = await TestbedHarnessEnvironment.loader(fixture).getHarness(KtMenuHarness);

    expect(await menu.isOpen()).toBe(false);
    await menu.open();
    expect(await menu.isOpen()).toBe(true);

    const items = await menu.getItems();
    expect(await Promise.all(items.map((i) => i.getText()))).toEqual(['Nouveau', 'Retour à la ligne']);

    await menu.close();
    expect(await menu.isOpen()).toBe(false);
  });

  it('lit et bascule l état coché d un menuitemcheckbox via isChecked()', async () => {
    const fixture = TestBed.createComponent(MenuConsumer);
    const menu = await TestbedHarnessEnvironment.loader(fixture).getHarness(KtMenuHarness);

    await menu.open();
    const [, wrapItem] = await menu.getItems();
    expect(await wrapItem.isChecked()).toBe(false);

    await wrapItem.click();
    expect(await wrapItem.isChecked()).toBe(true);
    expect(fixture.componentInstance.wrap()).toBe(true);
  });

  it('cible un item à cocher par son état via le prédicat', async () => {
    const fixture = TestBed.createComponent(MenuConsumer);
    const menu = await TestbedHarnessEnvironment.loader(fixture).getHarness(KtMenuHarness);

    await menu.open();
    const unchecked = await menu.getItems({ checked: false });
    expect(await Promise.all(unchecked.map((i) => i.getText()))).toContain('Retour à la ligne');
  });
});
