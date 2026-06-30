import { ApplicationRef, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KtDialogClose } from './dialog-close.directive';
import { KtDialogDescription } from './dialog-description.directive';
import { KtDialogTitle } from './dialog-title.directive';
import { KtDialogContainer } from './dialog-container';
import { provideKtDialogDefaults, resolveKtDialogPanelClass } from './dialog-config';
import { defineKtDialog, injectKtDialogOpener } from './dialog-opener';

describe('Dialog directives', () => {
  describe('DialogClose', () => {
    it('ferme le dialog avec le résultat fourni au clic', () => {
      const close = vi.fn();

      @Component({
        imports: [KtDialogClose],
        template: `<button [ktDialogClose]="'ok'">Fermer</button>`,
      })
      class Host {}

      TestBed.configureTestingModule({
        imports: [Host],
        providers: [{ provide: DialogRef, useValue: { close } }],
      });
      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      expect(button.getAttribute('type')).toBe('button');

      button.click();
      expect(close).toHaveBeenCalledWith('ok');
    });
  });

  describe('DialogTitle', () => {
    it('enregistre son id comme aria-labelledby du conteneur', async () => {
      @Component({
        imports: [KtDialogTitle],
        template: `
          <div class="cdk-dialog-container">
            <h2 ktDialogTitle>Titre</h2>
          </div>
        `,
      })
      class Host {}

      TestBed.configureTestingModule({
        imports: [Host],
      });
      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      await fixture.whenStable();

      const container = fixture.nativeElement.querySelector('.cdk-dialog-container') as HTMLElement;
      const title = fixture.nativeElement.querySelector('h2') as HTMLElement;
      expect(title.id).toMatch(/^kt-dialog-title-\d+$/);
      expect(container.getAttribute('aria-labelledby')).toBe(title.id);
    });
  });

  describe('DialogDescription', () => {
    it('câble config.ariaDescribedBy avec son id', () => {
      const config: { ariaDescribedBy: string | null } = { ariaDescribedBy: null };

      @Component({
        imports: [KtDialogDescription],
        template: `<p ktDialogDescription>Contexte court.</p>`,
      })
      class Host {}

      TestBed.configureTestingModule({
        imports: [Host],
        providers: [{ provide: DialogRef, useValue: { config } }],
      });
      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();

      const id = (fixture.nativeElement.querySelector('p') as HTMLElement).id;
      expect(id).toMatch(/^kt-dialog-desc-\d+$/);
      expect(config.ariaDescribedBy).toBe(id);
    });
  });
});

describe('injectKtDialogOpener', () => {
  class FakeDialogComponent {}

  it('ouvre le composant avec data + baseConfig + override fusionnés', () => {
    const open = vi.fn().mockReturnValue({ closed: { subscribe() {} } });
    TestBed.configureTestingModule({ providers: [{ provide: Dialog, useValue: { open } }] });

    const opener = TestBed.runInInjectionContext(() =>
      injectKtDialogOpener<FakeDialogComponent, { x: number }, string>(FakeDialogComponent, {
        panelClass: 'kt-dialog',
      }),
    );

    opener({ x: 1 }, { disableClose: true });

    expect(open).toHaveBeenCalledTimes(1);
    const [component, config] = open.mock.calls[0];
    expect(component).toBe(FakeDialogComponent);
    // `kt-dialog` vient de la présentation par défaut ET est repassé en `panelClass` ci-dessus :
    // le résultat est dédoublonné en une seule occurrence.
    expect(config).toMatchObject({ data: { x: 1 }, panelClass: ['kt-dialog'], disableClose: true });
    // Plancher a11y garanti par l'opener, indépendamment de provideKtDialogDefaults().
    expect(config).toMatchObject({ ariaModal: true, role: 'dialog', restoreFocus: true });
  });

  it('le plancher a11y de l’opener cède à un override par appel', () => {
    const open = vi.fn().mockReturnValue({ closed: { subscribe() {} } });
    TestBed.configureTestingModule({ providers: [{ provide: Dialog, useValue: { open } }] });

    const opener = TestBed.runInInjectionContext(() =>
      injectKtDialogOpener<FakeDialogComponent, void, string>(FakeDialogComponent),
    );
    opener(undefined, { ariaModal: false });

    expect(open.mock.calls[0][1]).toMatchObject({ ariaModal: false });
  });
});

describe('defineKtDialog', () => {
  class FakeDialogComponent {}

  it('injectData() renvoie la donnée DIALOG_DATA typée', () => {
    const data = { name: 'rapport.pdf' };
    TestBed.configureTestingModule({ providers: [{ provide: DIALOG_DATA, useValue: data }] });

    const contract = defineKtDialog<{ name: string }, 'confirm'>();
    const got = TestBed.runInInjectionContext(() => contract.injectData());

    expect(got).toBe(data);
  });

  it('injectRef() renvoie le DialogRef (close avec le résultat R)', () => {
    const close = vi.fn();
    TestBed.configureTestingModule({ providers: [{ provide: DialogRef, useValue: { close } }] });

    const contract = defineKtDialog<void, 'accept'>();
    const ref = TestBed.runInInjectionContext(() => contract.injectRef());
    ref.close('accept');

    expect(close).toHaveBeenCalledWith('accept');
  });

  it('injectOpener() ouvre le composant avec la data (mêmes types que le contrat)', () => {
    const open = vi.fn().mockReturnValue({ closed: { subscribe() {} } });
    TestBed.configureTestingModule({ providers: [{ provide: Dialog, useValue: { open } }] });

    const contract = defineKtDialog<{ x: number }, string>();
    const opener = TestBed.runInInjectionContext(() => contract.injectOpener(FakeDialogComponent));
    opener({ x: 2 });

    expect(open).toHaveBeenCalledTimes(1);
    const [component, config] = open.mock.calls[0];
    expect(component).toBe(FakeDialogComponent);
    expect(config).toMatchObject({ data: { x: 2 } });
  });
});

describe('resolveKtDialogPanelClass (fonction pure)', () => {
  it('résout les présentations concrètes et les variantes responsive selon compact', () => {
    expect(resolveKtDialogPanelClass('centered')).toEqual(['kt-dialog']);
    expect(resolveKtDialogPanelClass('fullscreen')).toEqual(['kt-dialog', 'kt-dialog--fullscreen']);
    expect(resolveKtDialogPanelClass('sheet')).toEqual(['kt-dialog', 'kt-dialog--sheet']);
    expect(resolveKtDialogPanelClass('centered-fullscreen', false)).toEqual(['kt-dialog']);
    expect(resolveKtDialogPanelClass('centered-fullscreen', true)).toEqual(['kt-dialog', 'kt-dialog--fullscreen']);
    expect(resolveKtDialogPanelClass('centered-sheet', false)).toEqual(['kt-dialog']);
    expect(resolveKtDialogPanelClass('centered-sheet', true)).toEqual(['kt-dialog', 'kt-dialog--sheet']);
  });
});

describe('Dialog directives — trous (audit)', () => {
  it('ktDialogClose ne pose AUCUN type sur un hôte non-<button> (<a>)', () => {
    @Component({ imports: [KtDialogClose], template: `<a [ktDialogClose]="'x'">Fermer</a>` })
    class AnchorHost {}
    TestBed.configureTestingModule({
      imports: [AnchorHost],
      providers: [{ provide: DialogRef, useValue: { close: vi.fn() } }],
    });
    const f = TestBed.createComponent(AnchorHost);
    f.detectChanges();
    expect((f.nativeElement.querySelector('a') as HTMLElement).hasAttribute('type')).toBe(false);
  });

  it('ktDialogClose avertit (dev) quand le bouton de fermeture n’a aucun nom accessible', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    @Component({ imports: [KtDialogClose], template: `<button ktDialogClose></button>` })
    class NamelessHost {}
    TestBed.configureTestingModule({
      imports: [NamelessHost],
      providers: [{ provide: DialogRef, useValue: { close: vi.fn() } }],
    });
    TestBed.createComponent(NamelessHost).detectChanges();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[ktDialogClose]'));
  });

  it('ktDialogDescription préserve un id consommateur et le nettoie au démontage', () => {
    const config: { ariaDescribedBy: string | null } = { ariaDescribedBy: null };
    @Component({ imports: [KtDialogDescription], template: `<p ktDialogDescription id="mon-desc">Contexte.</p>` })
    class IdHost {}
    TestBed.configureTestingModule({ imports: [IdHost], providers: [{ provide: DialogRef, useValue: { config } }] });
    const f = TestBed.createComponent(IdHost);
    f.detectChanges();
    expect((f.nativeElement.querySelector('p') as HTMLElement).id).toBe('mon-desc');
    expect(config.ariaDescribedBy).toBe('mon-desc');

    f.destroy();
    expect(config.ariaDescribedBy).toBeNull();
  });

  it('ktDialogTitle préserve un id consommateur (aria-labelledby sur cet id)', async () => {
    @Component({
      imports: [KtDialogTitle],
      template: `<div class="cdk-dialog-container"><h2 ktDialogTitle id="mon-titre">Titre</h2></div>`,
    })
    class IdTitleHost {}
    TestBed.configureTestingModule({ imports: [IdTitleHost] });
    const f = TestBed.createComponent(IdTitleHost);
    f.detectChanges();
    await f.whenStable();
    expect((f.nativeElement.querySelector('h2') as HTMLElement).id).toBe('mon-titre');
    expect(
      (f.nativeElement.querySelector('.cdk-dialog-container') as HTMLElement).getAttribute('aria-labelledby'),
    ).toBe('mon-titre');
  });
});

describe('KtDialogContainer — montage réel (CDK Dialog)', () => {
  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container, .cdk-overlay-container *').forEach((n) => n.remove());
  });

  it('pose aria-modal="true" et role="dialog" sur le conteneur monté', () => {
    @Component({ imports: [KtDialogTitle], template: `<h2 ktDialogTitle>Titre</h2>` })
    class DialogContent {}
    TestBed.configureTestingModule({ providers: [provideKtDialogDefaults()] });
    const dialog = TestBed.inject(Dialog);
    const ref = dialog.open(DialogContent, { container: KtDialogContainer });
    TestBed.inject(ApplicationRef).tick();
    const container = document.querySelector('.kt-dialog-container') as HTMLElement;
    expect(container).toBeTruthy();
    expect(container.getAttribute('aria-modal')).toBe('true');
    expect(container.getAttribute('role')).toBe('dialog');
    ref.close();
  });

  it('résout aria-labelledby du conteneur vers le titre monté (cible existante, non pendante)', () => {
    // Fige le câblage a11y exposé par le conteneur (binding `ariaLabelledBy`, qui encapsule l'accès
    // gardé au membre interne `_ariaLabelledByQueue` du CDK) : non-régression du refactor P4.
    @Component({ imports: [KtDialogTitle], template: `<h2 ktDialogTitle>Titre du dialog</h2>` })
    class TitledDialog {}
    @Component({ template: `` })
    class OpenerHost {
      readonly open = injectKtDialogOpener(TitledDialog);
    }
    TestBed.configureTestingModule({ providers: [provideKtDialogDefaults()] });
    const fixture = TestBed.createComponent(OpenerHost);
    fixture.componentInstance.open();
    TestBed.inject(ApplicationRef).tick();

    const container = document.querySelector('.kt-dialog-container') as HTMLElement;
    const labelledBy = container.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    // La cible existe RÉELLEMENT dans le DOM (pas de référence pendante) et porte le titre.
    const titleEl = document.getElementById(labelledBy!);
    expect(titleEl).toBeTruthy();
    expect(titleEl!.textContent).toContain('Titre du dialog');
  });
});
