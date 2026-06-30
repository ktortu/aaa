// Dogfood du KtSnackbarHarness — posture « faux consommateur » : ouvre des snackbars via le service
// et les lit/ferme via le harness, en atteignant l'overlay au document root.
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { KtSnackbar } from './snackbar.service';
import { KtSnackbarHarness } from './snackbar.harness';

@Component({ template: `` })
class Host {}

describe('KtSnackbarHarness (dogfood)', () => {
  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container, .cdk-overlay-container *').forEach((n) => n.remove());
  });

  it('lit le message et la variante d une snackbar ouverte par le service', async () => {
    const fixture = TestBed.createComponent(Host);
    TestBed.inject(KtSnackbar).open('Fichier supprimé', { variant: 'success' });

    const snackbar = await TestbedHarnessEnvironment.documentRootLoader(fixture).getHarness(KtSnackbarHarness);
    expect(await snackbar.getMessage()).toBe('Fichier supprimé');
    expect(await snackbar.getVariant()).toBe('success');
    expect(await snackbar.hasIcon()).toBe(true);
  });

  it('cible la snackbar visible par son texte via le prédicat (file FIFO : une seule à la fois)', async () => {
    const fixture = TestBed.createComponent(Host);
    TestBed.inject(KtSnackbar).open('Connexion rétablie');

    const loader = TestbedHarnessEnvironment.documentRootLoader(fixture);
    const found = await loader.getHarness(KtSnackbarHarness.with({ text: /rétablie/ }));
    expect(await found.getMessage()).toBe('Connexion rétablie');
  });

  it('ferme une snackbar closable via dismiss()', async () => {
    const fixture = TestBed.createComponent(Host);
    const ref = TestBed.inject(KtSnackbar).open('Action', { closable: true });
    let dismissed = false;
    ref.afterDismissed().subscribe(() => (dismissed = true));

    const snackbar = await TestbedHarnessEnvironment.documentRootLoader(fixture).getHarness(KtSnackbarHarness);
    expect(await snackbar.isClosable()).toBe(true);
    await snackbar.dismiss();
    expect(dismissed).toBe(true);
    // L'overlay quitte le DOM (exitDurationMs=0 en jsdom → dispose synchrone), pas juste l'Observable.
    expect(document.querySelector('.kt-snackbar')).toBeNull();
  });
});
