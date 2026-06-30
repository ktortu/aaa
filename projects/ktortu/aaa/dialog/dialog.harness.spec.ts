// Dogfood du KtDialogHarness — posture « faux consommateur » : ouvre un vrai dialog (CDK Dialog),
// le lit et le ferme via le harness, en atteignant l'overlay au document root.
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { KtDialogImports } from './public-api';
import { injectKtDialogOpener } from './dialog-opener';
import { KtDialogHarness } from './dialog.harness';

@Component({
  imports: [KtDialogImports],
  template: `
    <h2 ktDialogTitle>Confirmer la suppression</h2>
    <p ktDialogDescription>Cette action est irréversible.</p>
    <button ktDialogClose>Annuler</button>
  `,
})
class ConfirmDialog {}

@Component({ template: `` })
class OpenerHost {
  readonly open = injectKtDialogOpener(ConfirmDialog);
}

describe('KtDialogHarness (dogfood)', () => {
  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((n) => n.remove());
  });

  it('lit titre, description et role d un dialog ouvert programmatiquement', async () => {
    const fixture = TestBed.createComponent(OpenerHost);
    fixture.componentInstance.open();
    fixture.detectChanges();
    await fixture.whenStable();

    const dialog = await TestbedHarnessEnvironment.documentRootLoader(fixture).getHarness(KtDialogHarness);
    expect(await dialog.getRole()).toBe('dialog');
    expect(await dialog.getTitle()).toBe('Confirmer la suppression');
    expect(await dialog.getDescription()).toBe('Cette action est irréversible.');
    // Plancher a11y garanti par l'opener (sans provideKtDialogDefaults dans ce test).
    expect(await dialog.isModal()).toBe(true);
  });

  it('se ferme via close() (animation pilotée par fake timers)', async () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(OpenerHost);
    const ref = fixture.componentInstance.open();
    let closed = false;
    ref.closed.subscribe(() => (closed = true));
    fixture.detectChanges();

    const dialog = await TestbedHarnessEnvironment.documentRootLoader(fixture).getHarness(KtDialogHarness);
    await dialog.close();
    await vi.advanceTimersByTimeAsync(1000); // laisse l'animation de fermeture aboutir

    expect(closed).toBe(true);
    // L'overlay est RÉELLEMENT démonté (pas seulement l'Observable `closed` qui a émis).
    expect(document.querySelector('.kt-dialog-container')).toBeNull();
  });
});
