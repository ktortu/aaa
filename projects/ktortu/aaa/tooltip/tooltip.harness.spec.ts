// Dogfood du KtTooltipHarness — posture « faux consommateur » : affiche l'infobulle (survol +
// délai 0) puis la lit via le harness, en atteignant le nœud rendu dans le body.
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { KtTooltip } from './tooltip';
import { KtTooltipHarness } from './tooltip.harness';

@Component({
  imports: [KtTooltip],
  template: `<button [ktTooltip]="'Aide contextuelle'" tooltipPosition="bottom" [showDelay]="0">?</button>`,
})
class Host {}

describe('KtTooltipHarness (dogfood)', () => {
  afterEach(() => {
    document.body.querySelectorAll('.kt-tooltip').forEach((node) => node.remove());
  });

  it('lit le texte, le rôle et la position de l infobulle affichée', async () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    // Affichage : piloté par le test (survol du déclencheur + délai 0).
    (fixture.nativeElement.querySelector('button') as HTMLElement).dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(0); // laisse passer le showDelay=0
    fixture.detectChanges();

    const tip = await TestbedHarnessEnvironment.documentRootLoader(fixture).getHarness(KtTooltipHarness);
    expect(await tip.getText()).toBe('Aide contextuelle');
    expect(await tip.getRole()).toBe('tooltip');
    expect(await tip.getPosition()).toBe('bottom');
  });
});
