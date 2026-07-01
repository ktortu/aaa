// Dogfood du KtDisclosureHarness — posture « faux consommateur ». Chaque méthode du harness est
// consommée par au moins un test (gap-driven, cf. TESTING-HARNESSES.md).
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { KtDisclosure } from './disclosure';
import { KtDisclosureContent } from './disclosure-content';
import { KtDisclosureHarness } from './disclosure.harness';
import { KtDisclosureToggle } from './disclosure-toggle';

@Component({
  imports: [KtDisclosure, KtDisclosureToggle, KtDisclosureContent],
  template: `
    <div ktDisclosure #d="ktDisclosure" [(expanded)]="open">
      <button ktDisclosureToggle aria-label="Contrôle">{{ d.expanded() ? 'Voir moins' : 'Voir plus' }}</button>
      <kt-disclosure-content><p>Contenu secret</p></kt-disclosure-content>
    </div>
  `,
})
class DisclosureConsumer {
  open = signal(false);
}

describe('KtDisclosureHarness (dogfood)', () => {
  async function harness(): Promise<KtDisclosureHarness> {
    const fixture = TestBed.createComponent(DisclosureConsumer);
    return TestbedHarnessEnvironment.loader(fixture).getHarness(KtDisclosureHarness);
  }

  it('isExpanded / isContentInert reflètent l’état replié initial', async () => {
    const d = await harness();
    expect(await d.isExpanded()).toBe(false);
    expect(await d.isContentInert()).toBe(true);
  });

  it('expand ouvre, collapse referme (et l’inert suit)', async () => {
    const d = await harness();
    await d.expand();
    expect(await d.isExpanded()).toBe(true);
    expect(await d.isContentInert()).toBe(false);

    await d.collapse();
    expect(await d.isExpanded()).toBe(false);
    expect(await d.isContentInert()).toBe(true);
  });

  it('toggleExpansion bascule l’état', async () => {
    const d = await harness();
    await d.toggleExpansion();
    expect(await d.isExpanded()).toBe(true);
    await d.toggleExpansion();
    expect(await d.isExpanded()).toBe(false);
  });

  it('getToggleText suit l’état', async () => {
    const d = await harness();
    expect(await d.getToggleText()).toBe('Voir plus');
    await d.expand();
    expect(await d.getToggleText()).toBe('Voir moins');
  });

  it('getContentText lit le contenu du panneau', async () => {
    const d = await harness();
    expect(await d.getContentText()).toContain('Contenu secret');
  });
});
