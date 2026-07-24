import { ApplicationRef, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KtDialogClose } from './dialog-close.directive';
import { KtDialogDescription } from './dialog-description.directive';
import { KtDialogTitle } from './dialog-title.directive';
import { KtDialogContainer } from './dialog-container';
import {
  DEFAULT_KT_DIALOG_CONFIG,
  KT_DIALOG_CONFIG,
  provideKtDialog,
  provideKtDialogDefaults,
  resolveKtDialogPanelClass,
} from './dialog-config';
import { KtDialogActions, KtDialogFocusInitial } from './dialog-structure';
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
    expect(config).toMatchObject({
      data: { x: 1 },
      panelClass: ['kt-dialog', 'kt-dialog--centered'],
      disableClose: true,
    });
    // Plancher a11y garanti par l'opener, indépendamment de provideKtDialogDefaults().
    expect(config).toMatchObject({ ariaModal: true, role: 'dialog', restoreFocus: true });
    // Plafond de largeur : appliqué en STYLE INLINE par l'overlay (seul canal qui bat les styles
    // structurels HORS layer injectés par le CDK), tout en restant thémable via le token.
    expect(config).toMatchObject({ maxWidth: 'var(--dialog-max-width)' });
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

  it('résout la cascade des options maison et la passe par le canal `container.providers`', () => {
    // Les `providers` de la config GÉNÉRALE n'atteignent que le portail de CONTENU : seuls ceux
    // portés par `container` arrivent dans l'injecteur du conteneur. C'est le canal utilisé ici.
    const open = vi.fn().mockReturnValue({ closed: { subscribe() {} } });
    TestBed.configureTestingModule({
      providers: [
        { provide: Dialog, useValue: { open } },
        provideKtDialog({ sheetCloseButton: true, sheetCloseLabel: 'Fermer' }),
      ],
    });

    const opener = TestBed.runInInjectionContext(() =>
      injectKtDialogOpener<FakeDialogComponent, void, string>(FakeDialogComponent),
    );
    // Option d'ouverture : bat le token ; les clés NON fournies gardent la valeur du token.
    opener(undefined, { presentation: 'sheet', sheetHandle: false });

    const config = open.mock.calls[0][1];
    const providers = config.container.providers(config);
    expect(config.container.type).toBe(KtDialogContainer);
    expect(providers).toEqual([
      {
        provide: KT_DIALOG_CONFIG,
        useValue: { sheetCloseButton: true, sheetCloseLabel: 'Fermer', sheetHandle: false },
      },
    ]);
    // Les clés maison ne fuient PAS dans la config CDK transmise à `dialog.open`.
    expect(config).not.toHaveProperty('sheetCloseButton');
    expect(config).not.toHaveProperty('sheetHandle');
    expect(config).not.toHaveProperty('sheetCloseLabel');
  });

  it('sans token ni option, la cascade retombe sur les défauts anglais', () => {
    const open = vi.fn().mockReturnValue({ closed: { subscribe() {} } });
    TestBed.configureTestingModule({ providers: [{ provide: Dialog, useValue: { open } }] });

    const opener = TestBed.runInInjectionContext(() =>
      injectKtDialogOpener<FakeDialogComponent, void, string>(FakeDialogComponent),
    );
    opener();

    const config = open.mock.calls[0][1];
    expect(config.container.providers(config)[0].useValue).toEqual(DEFAULT_KT_DIALOG_CONFIG);
  });

  it('une option d’ouverture à `undefined` ne masque pas la valeur du token', () => {
    const open = vi.fn().mockReturnValue({ closed: { subscribe() {} } });
    TestBed.configureTestingModule({
      providers: [{ provide: Dialog, useValue: { open } }, provideKtDialog({ sheetCloseButton: true })],
    });

    const opener = TestBed.runInInjectionContext(() =>
      injectKtDialogOpener<FakeDialogComponent, void, string>(FakeDialogComponent),
    );
    opener(undefined, { sheetCloseButton: undefined });

    const config = open.mock.calls[0][1];
    expect(config.container.providers(config)[0].useValue.sheetCloseButton).toBe(true);
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
    expect(resolveKtDialogPanelClass('centered')).toEqual(['kt-dialog', 'kt-dialog--centered']);
    expect(resolveKtDialogPanelClass('fullscreen')).toEqual(['kt-dialog', 'kt-dialog--fullscreen']);
    expect(resolveKtDialogPanelClass('sheet')).toEqual(['kt-dialog', 'kt-dialog--sheet']);
    expect(resolveKtDialogPanelClass('centered-fullscreen', false)).toEqual(['kt-dialog', 'kt-dialog--centered']);
    expect(resolveKtDialogPanelClass('centered-fullscreen', true)).toEqual(['kt-dialog', 'kt-dialog--fullscreen']);
    expect(resolveKtDialogPanelClass('centered-sheet', false)).toEqual(['kt-dialog', 'kt-dialog--centered']);
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
    const f = TestBed.createComponent(NamelessHost);
    f.detectChanges();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[ktDialogClose]'));
    f.destroy();
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

describe('KtDialogContainer — bouton de fermeture et poignée de la bottom-sheet', () => {
  @Component({ imports: [KtDialogTitle], template: `<h2 ktDialogTitle>Titre</h2>` })
  class SheetContent {}

  @Component({ template: `` })
  class SheetHost {
    readonly open = injectKtDialogOpener(SheetContent, { presentation: 'sheet' });
  }

  /** Ouvre une sheet avec les options maison données et rend le conteneur monté. */
  function openSheet(ktConfig?: Parameters<typeof provideKtDialog>[0]): HTMLElement {
    TestBed.configureTestingModule({
      providers: [provideKtDialogDefaults(), ...(ktConfig ? [provideKtDialog(ktConfig)] : [])],
    });
    const fixture = TestBed.createComponent(SheetHost);
    fixture.componentInstance.open();
    TestBed.inject(ApplicationRef).tick();
    return document.querySelector('.kt-dialog-container') as HTMLElement;
  }

  const closeButtonOf = (c: HTMLElement) => c.querySelector('.kt-dialog-container__sheet-close') as HTMLButtonElement;

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container, .cdk-overlay-container *').forEach((n) => n.remove());
  });

  it('ne rend AUCUN bouton de fermeture par défaut (une sheet à en-tête riche a déjà le sien)', () => {
    const container = openSheet();
    expect(closeButtonOf(container)).toBeNull();
    expect(container.querySelector('.kt-dialog-container__layout--closable')).toBeNull();
  });

  it('rend le bouton quand `sheetCloseButton` est actif, avec le libellé anglais par défaut', () => {
    const button = closeButtonOf(openSheet({ sheetCloseButton: true }));
    expect(button).toBeTruthy();
    expect(button.getAttribute('aria-label')).toBe('Close');
    // Type explicite : jamais de submit implicite dans un formulaire projeté.
    expect(button.getAttribute('type')).toBe('button');
    // Glyphe décoratif : masqué aux technologies d'assistance (le nom vient de l'aria-label).
    expect(button.querySelector('.kt-dialog-container__sheet-close-icon')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('marque la carte `--closable` : c’est elle qui réserve la place du titre en CSS', () => {
    const container = openSheet({ sheetCloseButton: true });
    expect(container.querySelector('.kt-dialog-container__layout--closable')).toBeTruthy();
  });

  it('le bouton précède le contenu projeté dans l’ordre du document (ordre de tabulation)', () => {
    const container = openSheet({ sheetCloseButton: true });
    const button = closeButtonOf(container);
    const title = container.querySelector('[ktDialogTitle]') as HTMLElement;
    // DOCUMENT_POSITION_FOLLOWING : le titre suit le bouton.
    expect(button.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('le libellé accessible suit la cascade complète : token < config de l’ouvreur < appel', () => {
    TestBed.configureTestingModule({
      providers: [provideKtDialogDefaults(), provideKtDialog({ sheetCloseButton: true, sheetCloseLabel: 'Fermer' })],
    });
    @Component({ template: `` })
    class Host {
      // Les 3 génériques sélectionnent la surcharge AVEC data, seule à accepter une config par appel.
      readonly open = injectKtDialogOpener<SheetContent, void, unknown>(SheetContent, {
        presentation: 'sheet',
        sheetCloseLabel: 'Refermer', // bat le token…
      });
    }
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.open(undefined, { sheetCloseLabel: 'Quitter' }); // …et l'appel bat tout.
    TestBed.inject(ApplicationRef).tick();

    const container = document.querySelector('.kt-dialog-container') as HTMLElement;
    expect(closeButtonOf(container).getAttribute('aria-label')).toBe('Quitter');
  });

  it('un clic sur le bouton ferme le dialog', () => {
    TestBed.configureTestingModule({
      providers: [provideKtDialogDefaults(), provideKtDialog({ sheetCloseButton: true })],
    });
    const fixture = TestBed.createComponent(SheetHost);
    const ref = fixture.componentInstance.open();
    TestBed.inject(ApplicationRef).tick();

    const closed = vi.fn();
    ref.closed.subscribe(closed);
    closeButtonOf(document.querySelector('.kt-dialog-container') as HTMLElement).click();
    TestBed.inject(ApplicationRef).tick();

    expect(closed).toHaveBeenCalledTimes(1);
  });

  it('n’est PAS rendu hors présentation sheet, et avertit (dev)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      providers: [provideKtDialogDefaults(), provideKtDialog({ sheetCloseButton: true })],
    });
    @Component({ template: `` })
    class CenteredHost {
      readonly open = injectKtDialogOpener(SheetContent); // présentation 'centered' par défaut
    }
    const fixture = TestBed.createComponent(CenteredHost);
    fixture.componentInstance.open();
    TestBed.inject(ApplicationRef).tick();

    const container = document.querySelector('.kt-dialog-container') as HTMLElement;
    expect(closeButtonOf(container)).toBeNull();
    expect(warn.mock.calls.flat().join(' ')).toContain('`sheetCloseButton` ne s’applique qu’à la présentation');
    warn.mockRestore();
  });

  it('n’avertit PAS pour un [ktDialogClose] dans la barre d’ACTIONS (aucune collision visuelle)', () => {
    // Une action de pied qui ferme au passage (« Annuler », « Copier le lien ») est légitime et ne
    // double pas la croix ancrée en haut : l'heuristique doit l'ignorer.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    @Component({
      imports: [KtDialogTitle, KtDialogClose, KtDialogActions],
      template: `<h2 ktDialogTitle>Titre</h2>
        <footer ktDialogActions><button ktDialogClose>Annuler</button></footer>`,
    })
    class ActionsOnlySheet {}
    TestBed.configureTestingModule({
      providers: [provideKtDialogDefaults(), provideKtDialog({ sheetCloseButton: true })],
    });
    @Component({ template: `` })
    class Host {
      readonly open = injectKtDialogOpener(ActionsOnlySheet, { presentation: 'sheet' });
    }
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.open();
    TestBed.inject(ApplicationRef).tick();

    expect(warn.mock.calls.flat().join(' ')).not.toContain('double bouton de fermeture');
    warn.mockRestore();
  });

  it('avertit (dev) quand une croix vit HORS de la barre d’actions (double croix)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    @Component({
      imports: [KtDialogTitle, KtDialogClose],
      template: `<h2 ktDialogTitle>Titre</h2>
        <button ktDialogClose>Fermer</button>`,
    })
    class ComposedSheet {}
    TestBed.configureTestingModule({
      providers: [provideKtDialogDefaults(), provideKtDialog({ sheetCloseButton: true })],
    });
    @Component({ template: `` })
    class Host {
      readonly open = injectKtDialogOpener(ComposedSheet, { presentation: 'sheet' });
    }
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.open();
    TestBed.inject(ApplicationRef).tick();

    expect(warn.mock.calls.flat().join(' ')).toContain('double bouton de fermeture');
    warn.mockRestore();
  });

  it('rend la poignée décorative par défaut (ADR-0005)', () => {
    expect(openSheet().querySelector('.kt-dialog-container__sheet-handle')).toBeTruthy();
  });

  it('retire la poignée via l’option typée `sheetHandle`', () => {
    expect(openSheet({ sheetHandle: false }).querySelector('.kt-dialog-container__sheet-handle')).toBeNull();
  });

  it('honore encore le panelClass déprécié `kt-dialog--no-handle`, en avertissant (dev)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    TestBed.configureTestingModule({ providers: [provideKtDialogDefaults()] });
    @Component({ template: `` })
    class LegacyHost {
      readonly open = injectKtDialogOpener(SheetContent, {
        presentation: 'sheet',
        panelClass: 'kt-dialog--no-handle',
      });
    }
    const fixture = TestBed.createComponent(LegacyHost);
    fixture.componentInstance.open();
    TestBed.inject(ApplicationRef).tick();

    const container = document.querySelector('.kt-dialog-container') as HTMLElement;
    expect(container.querySelector('.kt-dialog-container__sheet-handle')).toBeNull();
    expect(warn.mock.calls.flat().join(' ')).toContain('déprécié');
    warn.mockRestore();
  });
});

describe('KtDialogContainer — repli de focus initial', () => {
  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container, .cdk-overlay-container *').forEach((n) => n.remove());
  });

  it('focalise le conteneur quand AUCUN élément ne porte [ktDialogFocusInitial]', () => {
    // Sans ce repli, le CDK ne focalise rien (son sélecteur ne correspond à aucun élément) : le
    // focus resterait sur le déclencheur, HORS du dialog, et Tab promènerait dans la page derrière.
    @Component({ imports: [KtDialogTitle], template: `<h2 ktDialogTitle>Titre</h2>` })
    class NoMarker {}
    TestBed.configureTestingModule({ providers: [provideKtDialogDefaults()] });
    @Component({ template: `` })
    class Host {
      readonly open = injectKtDialogOpener(NoMarker);
    }
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.open();
    TestBed.inject(ApplicationRef).tick();

    const container = document.querySelector('.kt-dialog-container') as HTMLElement;
    expect(document.activeElement).toBe(container);
  });

  it('ne VOLE pas le focus quand [ktDialogFocusInitial] est présent', () => {
    @Component({
      imports: [KtDialogTitle, KtDialogFocusInitial],
      template: `<h2 ktDialogTitle>Titre</h2>
        <button ktDialogFocusInitial>Continuer</button>`,
    })
    class WithMarker {}
    TestBed.configureTestingModule({ providers: [provideKtDialogDefaults()] });
    @Component({ template: `` })
    class Host {
      readonly open = injectKtDialogOpener(WithMarker);
    }
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.open();
    TestBed.inject(ApplicationRef).tick();

    const marked = document.querySelector('[ktDialogFocusInitial]') as HTMLElement;
    expect(document.activeElement).toBe(marked);
  });
});

import { KtQuickDialog, KtAlertDialog, KtConfirmDialog } from './dialog-helpers';
import { firstValueFrom } from 'rxjs';

describe('TDZ Regression', () => {
  it('charge les composants dialog sans ReferenceError (TDZ) sur KtDialogImports', () => {
    // Le simple fait d'accéder aux classes prouve que l'évaluation du module
    // n'a pas planté en amont à cause d'une Temporal Dead Zone.
    expect(KtAlertDialog).toBeTruthy();
    expect(KtConfirmDialog).toBeTruthy();
  });
});

describe('KtQuickDialog', () => {
  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container, .cdk-overlay-container *').forEach((n) => n.remove());
  });

  it('alert() ouvre une alerte avec le titre et le message simple', () => {
    TestBed.configureTestingModule({ providers: [provideKtDialogDefaults()] });
    const service = TestBed.inject(KtQuickDialog);

    const ref = service.alert('Alerte Titre', 'Message important');
    TestBed.inject(ApplicationRef).tick();

    const container = document.querySelector('.kt-dialog-container') as HTMLElement;
    expect(container).toBeTruthy();
    expect(container.querySelector('[ktDialogTitle]')?.textContent?.trim()).toBe('Alerte Titre');
    expect(container.querySelector('[ktDialogDescription]')?.textContent?.trim()).toBe('Message important');

    ref.close();
  });

  it('alert() supporte le multi-lignes et le HTML sanitisé', () => {
    TestBed.configureTestingModule({ providers: [provideKtDialogDefaults()] });
    const service = TestBed.inject(KtQuickDialog);
    const ref = service.alert('Alerte Titre', ['Ligne 1 <strong>forte</strong>', 'Ligne 2']);

    TestBed.inject(ApplicationRef).tick();

    const container = document.querySelector('.kt-dialog-container') as HTMLElement;
    expect(container).toBeTruthy();
    const desc = container.querySelector('[ktDialogDescription]') as HTMLElement;
    const paragraphs = desc.querySelectorAll('p');
    expect(paragraphs.length).toBe(2);
    expect(paragraphs[0].innerHTML).toBe('Ligne 1 <strong>forte</strong>');
    expect(paragraphs[1].innerHTML).toBe('Ligne 2');

    ref.close();
  });

  it('confirm() résout true sur validation et false sur rejet', async () => {
    TestBed.configureTestingModule({ providers: [provideKtDialogDefaults()] });
    const service = TestBed.inject(KtQuickDialog);

    // Test de validation (Oui)
    const confirmPromise = firstValueFrom(service.confirm({ title: 'Titre', message: 'Message' }));
    TestBed.inject(ApplicationRef).tick();
    let buttons = document.querySelectorAll('button');
    expect(buttons.length).toBe(2);
    const yesButton1 = buttons[1];
    yesButton1.click();
    TestBed.inject(ApplicationRef).tick();
    expect(await confirmPromise).toBe(true);

    // Test de rejet (Non)
    const rejectPromise = firstValueFrom(service.confirm({ title: 'Titre', message: 'Message' }));
    TestBed.inject(ApplicationRef).tick();
    buttons = document.querySelectorAll('button');
    expect(buttons.length).toBe(2);

    const noButton2 = buttons[0];
    noButton2.click();
    TestBed.inject(ApplicationRef).tick();
    expect(await rejectPromise).toBe(false);
  });

  it('decide() supporte le mode ternaire et renvoie cancel sur annulation', async () => {
    TestBed.configureTestingModule({ providers: [provideKtDialogDefaults()] });
    const service = TestBed.inject(KtQuickDialog);

    const decidePromise = firstValueFrom(
      service.decide({
        title: 'Titre',
        message: 'Message',
        cancelLabel: 'Annuler',

        rejectLabel: 'Rejeter',
        confirmLabel: 'Confirmer',
      }),
    );
    TestBed.inject(ApplicationRef).tick();

    const buttons = document.querySelectorAll('button');
    expect(buttons.length).toBe(3); // Annuler, Rejeter, Confirmer

    // Le premier bouton est le bouton d'annulation (mode text et focus initial)
    const cancelButton = buttons[0] as HTMLButtonElement;
    expect(cancelButton.textContent?.trim()).toBe('Annuler');
    cancelButton.click();
    TestBed.inject(ApplicationRef).tick();

    expect(await decidePromise).toBe('cancel');
  });

  it('alert() applique la variante neutral par défaut', () => {
    TestBed.configureTestingModule({ providers: [provideKtDialogDefaults()] });
    const service = TestBed.inject(KtQuickDialog);

    const ref = service.alert('Alerte', 'Message', 'Fermer');
    TestBed.inject(ApplicationRef).tick();

    const container = document.querySelector('.kt-dialog-container') as HTMLElement;
    expect(container).toBeTruthy();

    const alertDialogEl = container.querySelector('kt-alert-dialog');
    expect(alertDialogEl).toBeTruthy();
    expect(alertDialogEl!.getAttribute('data-variant')).toBe('neutral');
    expect(alertDialogEl!.querySelector('.kt-alert-dialog__icon')).toBeNull();

    ref.close();
  });

  it('alert() supporte un objet d options avec libellé et variante', () => {
    TestBed.configureTestingModule({ providers: [provideKtDialogDefaults()] });
    const service = TestBed.inject(KtQuickDialog);

    const ref = service.alert('Succès', 'Opération réussie', { closeLabel: 'Terminer', variant: 'success' });
    TestBed.inject(ApplicationRef).tick();

    const container = document.querySelector('.kt-dialog-container') as HTMLElement;
    expect(container).toBeTruthy();

    const alertDialogEl = container.querySelector('kt-alert-dialog');
    expect(alertDialogEl).toBeTruthy();
    expect(alertDialogEl!.getAttribute('data-variant')).toBe('success');

    const icon = alertDialogEl!.querySelector('.kt-alert-dialog__icon');
    expect(icon).toBeTruthy();
    expect(icon!.getAttribute('aria-hidden')).toBe('true');

    const closeButton = alertDialogEl!.querySelector('footer button') as HTMLButtonElement;
    expect(closeButton.textContent?.trim()).toBe('Terminer');

    ref.close();
  });
});
