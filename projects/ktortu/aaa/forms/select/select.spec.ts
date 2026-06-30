import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TestKey } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { KT_SELECT_CONFIG } from './select-config';
import { KtSelect } from './select';
import { KtSelectHarness } from './select.harness';

interface User {
  id: number;
  name: string;
  role: string;
  disabled?: boolean;
}

const USERS: readonly User[] = [
  { id: 1, name: 'Ada', role: 'Admin' },
  { id: 2, name: 'Alan', role: 'Éditeur' },
  { id: 3, name: 'Grace', role: 'Éditeur', disabled: true },
];

/**
 * Accès white-box aux membres protégés du composant — RÉSERVÉ aux cas non atteignables par le DOM
 * (règle de cohabitation harness ↔ internals). Tout comportement observable au DOM passe par
 * `KtSelectHarness` ; ne restent ici que : pilotage d'état pour les tests à fake timers (annonce
 * différée), contrat interne du listbox (purge/désélection sur filtre), résolution de config sans
 * surface DOM (`resolvedEmptyText`/`resolvedFilterLabel`), et les API programmatiques Signal Forms
 * (`focus`/`reset`).
 */
interface SelectInternals {
  expanded: { (): boolean; set(v: boolean): void };
  onListboxValueChange(keys: readonly unknown[]): void;
  resolvedEmptyText(): string;
  resolvedFilterLabel(): string;
  focus(options?: FocusOptions): void;
  reset(): void;
}

function internals(fixture: ComponentFixture<unknown>): SelectInternals {
  return fixture.debugElement.query(By.directive(KtSelect)).componentInstance as unknown as SelectInternals;
}

/** Charge le harness du select (comportement observable par le DOM ; cf. règle de cohabitation). */
function selectHarness(fixture: ComponentFixture<unknown>): Promise<KtSelectHarness> {
  return TestbedHarnessEnvironment.loader(fixture).getHarness(KtSelectHarness);
}

function trigger(el: HTMLElement): HTMLButtonElement {
  return el.querySelector('.kt-select__trigger')!;
}

function valueText(el: HTMLElement): string {
  return el.querySelector('.kt-select__value')?.textContent?.trim() ?? '';
}

function filterInput(el: HTMLElement): HTMLInputElement {
  return el.querySelector('.kt-select__filter-input')!;
}

function typeFilter(fixture: ComponentFixture<unknown>, el: HTMLElement, text: string): void {
  const input = filterInput(el);
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  fixture.detectChanges();
}

// --- Primitifs (string[]) ---
@Component({
  imports: [KtSelect],
  template: `<kt-select
    [options]="fruits"
    label="Fruit"
    placeholder="Choisir"
    [(value)]="value"
    [pending]="pending()"
  />`,
})
class PrimitiveHost {
  fruits = ['Pomme', 'Banane', 'Cerise'];
  value = signal<string | null>(null);
  pending = signal(false);
}

// --- Objets, mode clé (value = user.id) ---
@Component({
  imports: [KtSelect],
  template: `
    <kt-select
      [options]="users"
      optionLabel="name"
      [optionValue]="userKey"
      [optionDisabled]="userDisabled"
      label="User"
      [(value)]="value"
      (selectionChange)="last.set($event)"
    />
  `,
})
class UserKeyHost {
  users = USERS;
  userKey = (u: User): number => u.id;
  userDisabled = (u: User): boolean => !!u.disabled;
  value = signal<number | null>(null);
  last = signal<{ value: number | null; option: User | null } | null>(null);
}

// --- Objets, mode objet (value = User) ---
@Component({
  imports: [KtSelect],
  template: `<kt-select [options]="users" optionLabel="name" label="User" [(value)]="value" />`,
})
class UserObjHost {
  users = USERS;
  value = signal<User | null>(null);
}

// --- Filtrable (champ de recherche dans le popup) ---
@Component({
  imports: [KtSelect],
  template: `
    <kt-select
      [options]="fruits"
      [filterable]="true"
      label="Fruit"
      filterLabel="Filtrer"
      filterPlaceholder="Rechercher"
      [(value)]="value"
    />
  `,
})
class FilterableHost {
  fruits = ['Pomme', 'Banane', 'Cerise', 'Pêche'];
  value = signal<string | null>(null);
}

// --- Filtrable avec prédicat custom (filtre sur le rôle, pas le libellé) ---
@Component({
  imports: [KtSelect],
  template: ` <kt-select [options]="users" optionLabel="name" [filterable]="true" [filterFn]="byRole" label="User" /> `,
})
class FilterFnHost {
  users = USERS;
  byRole = (u: User, q: string): boolean => u.role.toLowerCase().includes(q.toLowerCase());
}

@Component({
  imports: [KtSelect],
  template: `
    <kt-select
      [options]="fruits"
      [filterable]="true"
      [maxVisibleOptions]="maxOptions"
      label="Fruit"
      [(value)]="value"
    />
  `,
})
class TruncatedHost {
  fruits = ['Pomme', 'Banane', 'Cerise', 'Pêche', 'Abricot'];
  maxOptions = 3;
  value = signal<string | null>(null);
}

describe('Select', () => {
  describe('primitifs', () => {
    let fixture: ComponentFixture<PrimitiveHost>;
    let host: PrimitiveHost;
    let el: HTMLElement;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [PrimitiveHost] });
      fixture = TestBed.createComponent(PrimitiveHost);
      host = fixture.componentInstance;
      el = fixture.nativeElement;
      fixture.detectChanges();
    });

    it('rend un trigger combobox avec un label', () => {
      expect(trigger(el)).toBeTruthy();
      expect(trigger(el).getAttribute('role')).toBe('combobox');
      expect(el.querySelector('label')?.textContent).toContain('Fruit');
    });

    it('affiche le placeholder quand aucune valeur', () => {
      expect(valueText(el)).toBe('Choisir');
    });

    it('affiche le libellé de la valeur courante (string = elle-même)', async () => {
      host.value.set('Banane');
      const select = await selectHarness(fixture);
      expect(await select.getValueText()).toBe('Banane');
    });

    it('mappe la sélection vers la valeur (clé = la chaîne)', async () => {
      const select = await selectHarness(fixture);
      await select.clickOption({ text: 'Cerise' });
      expect(host.value()).toBe('Cerise');
    });

    it('expose aria-expanded, fermé par défaut', async () => {
      const select = await selectHarness(fixture);
      expect(await select.isOpen()).toBe(false);
    });

    it('focus le trigger via focus() (Signal Forms focusBoundControl)', () => {
      internals(fixture).focus();
      expect(document.activeElement).toBe(trigger(el));
    });

    it('reflète le pending via aria-busy et data-pending sur le trigger', async () => {
      host.pending.set(true);
      const select = await selectHarness(fixture);
      expect(await select.isPending()).toBe(true);
      // data-pending : hook de style, lu en brut (pas une sémantique exposée par le harness).
      expect(trigger(el).getAttribute('data-pending')).toBe('');
    });
  });

  describe('objets — mode clé', () => {
    let fixture: ComponentFixture<UserKeyHost>;
    let host: UserKeyHost;
    let el: HTMLElement;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [UserKeyHost] });
      fixture = TestBed.createComponent(UserKeyHost);
      host = fixture.componentInstance;
      el = fixture.nativeElement;
      fixture.detectChanges();
    });

    it('affiche le libellé de la valeur préchargée (id → option)', () => {
      host.value.set(2);
      fixture.detectChanges();
      expect(valueText(el)).toBe('Alan');
    });

    it('émet { value: id, option } et écrit la clé dans la valeur', async () => {
      const select = await selectHarness(fixture);
      await select.clickOption({ text: 'Alan' });
      expect(host.value()).toBe(2);
      expect(host.last()).toEqual({ value: 2, option: USERS[1] });
    });

    it('ferme le popup après sélection (closeOnSelect par défaut)', async () => {
      const select = await selectHarness(fixture);
      await select.clickOption({ text: 'Ada' });
      expect(await select.isOpen()).toBe(false);
    });
  });

  describe('objets — mode objet', () => {
    let fixture: ComponentFixture<UserObjHost>;
    let host: UserObjHost;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [UserObjHost] });
      fixture = TestBed.createComponent(UserObjHost);
      host = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('présélectionne via compareWith par défaut (égalité par id, pas par référence)', async () => {
      // Objet équivalent par id mais référence différente (cas refetch).
      host.value.set({ id: 3, name: 'Grace', role: 'Éditeur', disabled: true });
      const select = await selectHarness(fixture);
      expect(await select.getValueText()).toBe('Grace');
    });

    it('écrit l’objet entier dans la valeur quand optionValue est omis', async () => {
      const select = await selectHarness(fixture);
      await select.clickOption({ text: 'Ada' });
      expect(host.value()).toEqual(USERS[0]);
    });
  });

  describe('états & config', () => {
    it('désactive le trigger quand disabled', async () => {
      @Component({
        imports: [KtSelect],
        template: `<kt-select [options]="fruits" label="F" [disabled]="true" />`,
      })
      class DisabledHost {
        fruits = ['A', 'B'];
      }
      TestBed.configureTestingModule({ imports: [DisabledHost] });
      const f = TestBed.createComponent(DisabledHost);
      const select = await TestbedHarnessEnvironment.loader(f).getHarness(KtSelectHarness);
      expect(await select.isDisabled()).toBe(true);
    });

    it('SELECT_CONFIG fournit le texte « liste vide » par défaut', () => {
      TestBed.configureTestingModule({
        imports: [PrimitiveHost],
        providers: [{ provide: KT_SELECT_CONFIG, useValue: { emptyText: 'Rien à afficher' } }],
      });
      const f = TestBed.createComponent(PrimitiveHost);
      f.detectChanges();
      expect(internals(f).resolvedEmptyText()).toBe('Rien à afficher');
    });

    it('closeOnSelect=false : Échap après un clic option ferme et rend le focus au trigger', () => {
      // Après un clic souris sur une option, le focus DOM est sur le listbox : ni le listbox
      // ni le combobox ne gèrent Échap là — c'est le handler hôte hérité de BaseSelect.
      TestBed.configureTestingModule({
        imports: [PrimitiveHost],
        providers: [{ provide: KT_SELECT_CONFIG, useValue: { closeOnSelect: false } }],
      });
      const f = TestBed.createComponent(PrimitiveHost);
      f.detectChanges();
      const native = f.nativeElement as HTMLElement;
      trigger(native).focus();
      const inst = internals(f);
      inst.expanded.set(true);
      f.detectChanges();
      inst.onListboxValueChange(['Banane']);
      f.detectChanges();
      expect(inst.expanded()).toBe(true); // le popup reste ouvert (closeOnSelect=false)

      const listbox = native.querySelector('[role="listbox"]')!;
      listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      f.detectChanges();
      expect(inst.expanded()).toBe(false);
      expect(document.activeElement).toBe(trigger(native));
    });

    it('clic en dehors (pointerdown document) ferme le popup ouvert', () => {
      TestBed.configureTestingModule({ imports: [PrimitiveHost] });
      const f = TestBed.createComponent(PrimitiveHost);
      f.detectChanges();
      const native = f.nativeElement as HTMLElement;
      trigger(native).focus();
      const inst = internals(f);
      inst.expanded.set(true);
      f.detectChanges();

      // pointerdown sur un élément HORS du composant → fermeture (handler document hérité de BaseSelect).
      const outside = document.createElement('button');
      document.body.appendChild(outside);
      outside.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
      f.detectChanges();

      expect(inst.expanded()).toBe(false);
      outside.remove();
    });

    it('non filtrable : fait défiler l’option active à la navigation (ref listboxEl présente)', async () => {
      Element.prototype.scrollIntoView ??= () => undefined;
      const spy = vi.spyOn(Element.prototype, 'scrollIntoView');
      TestBed.configureTestingModule({ imports: [PrimitiveHost] });
      const f = TestBed.createComponent(PrimitiveHost);
      f.detectChanges();
      const native = f.nativeElement as HTMLElement;
      const select = await selectHarness(f);
      await select.open();
      spy.mockClear();

      // Navigation : keydown directement sur le listbox (comme le relay du combobox le ferait).
      native
        .querySelector('[role="listbox"]')!
        .dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }));
      f.detectChanges();
      await new Promise((resolve) => requestAnimationFrame(resolve));
      f.detectChanges();

      expect(spy).toHaveBeenCalledWith({ block: 'nearest' });
    });
  });

  describe('filtrable', () => {
    let fixture: ComponentFixture<FilterableHost>;
    let host: FilterableHost;
    let el: HTMLElement;

    beforeEach(() => {
      // jsdom n'implémente pas scrollIntoView (utilisé par le listbox à la navigation).
      Element.prototype.scrollIntoView ??= () => undefined;
      TestBed.configureTestingModule({ imports: [FilterableHost] });
      fixture = TestBed.createComponent(FilterableHost);
      host = fixture.componentInstance;
      el = fixture.nativeElement;
      fixture.detectChanges();
    });

    function open(): SelectInternals {
      const inst = internals(fixture);
      // Indispensable sous jsdom : closePopupOnBlurEffect (lib) referme aussitôt le popup
      // si ni le combobox ni le widget n'ont le focus (en réel, le clic focus le trigger).
      trigger(el).focus();
      inst.expanded.set(true);
      fixture.detectChanges();
      return inst;
    }

    it('non filtrable : aucun champ de filtre, aria-haspopup="listbox" (non-régression)', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ imports: [PrimitiveHost] });
      const f = TestBed.createComponent(PrimitiveHost);
      f.detectChanges();
      const native = f.nativeElement as HTMLElement;
      const select = await selectHarness(f);
      await select.open();
      expect(filterInput(native)).toBeFalsy();
      expect(trigger(native).getAttribute('aria-haspopup')).toBe('listbox');
      expect(native.querySelector('[role="dialog"]')).toBeFalsy();
    });

    it('reset() referme le panneau et vide le filtre (Signal Forms reset)', async () => {
      const select = await selectHarness(fixture);
      await select.filter('po');
      expect(await select.isOpen()).toBe(true);
      expect(await select.getFilterText()).toBe('po');

      // reset() est l'API programmatique Signal Forms (pas un geste DOM) → white-box assumé.
      internals(fixture).reset();
      fixture.detectChanges();
      expect(await select.isOpen()).toBe(false);
      expect(await select.getFilterText()).toBe('');
    });

    it('rend le champ de filtre avec son ARIA (label, controls, panneau dialog)', async () => {
      const select = await selectHarness(fixture);
      await select.open();
      const input = filterInput(el);
      const listbox = el.querySelector<HTMLElement>('[role="listbox"]')!;
      const panel = el.querySelector<HTMLElement>('[role="dialog"]')!;
      expect(input).toBeTruthy();
      expect(input.getAttribute('aria-label')).toBe('Filtrer');
      expect(input.placeholder).toBe('Rechercher');
      expect(input.getAttribute('aria-controls')).toBe(listbox.id);
      expect(listbox.id).not.toBe('');
      expect(panel.id).toContain('kt-select-panel-');
      expect(panel.getAttribute('aria-label')).toBe('Fruit');
      expect(trigger(el).getAttribute('aria-haspopup')).toBe('dialog');
    });

    it('filtre les options en tapant (insensible à la casse et aux accents)', async () => {
      const select = await selectHarness(fixture);
      await select.filter('CERI');
      expect(await select.getOptionTexts()).toEqual(['Cerise']);
      await select.filter('peche');
      expect(await select.getOptionTexts()).toEqual(['Pêche']);
      await select.clearFilter();
      expect(await select.getOptionTexts()).toEqual(host.fruits);
    });

    it('applique le prédicat custom filterFn', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ imports: [FilterFnHost] });
      const f = TestBed.createComponent(FilterFnHost);
      f.detectChanges();
      const select = await selectHarness(f);
      await select.filter('admin');
      expect(await select.getOptionTexts()).toEqual(['Ada']);
    });

    it('affiche la ligne « liste vide » quand aucun résultat', async () => {
      const select = await selectHarness(fixture);
      await select.filter('zzz');
      expect(await select.getOptionTexts()).toEqual([]);
      expect(el.querySelector('.kt-select__empty')?.textContent?.trim()).toBe('No options');
    });

    it('annonce le nombre de résultats en différé (live region role=status)', async () => {
      const select = await selectHarness(fixture);
      await select.filter('ceri');
      expect(await select.getAnnouncement()).toBe(''); // pas d'annonce immédiate (anti-spam SR)
      expect(await select.waitForAnnouncement()).toBe('1 result');
      await select.filter('e'); // Pomme, Banane, Cerise, Pêche (ê normalisé) → 4
      expect(await select.waitForAnnouncement('4 results')).toBe('4 results');
    });

    it('SELECT_CONFIG fournit les textes du filtre (annonce i18n comprise)', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [FilterableHost],
        providers: [
          {
            provide: KT_SELECT_CONFIG,
            useValue: {
              filterResultsText: (n: number) => (n <= 1 ? `${n} résultat` : `${n} résultats`),
            },
          },
        ],
      });
      const f = TestBed.createComponent(FilterableHost);
      f.detectChanges();
      // L'input du composant garde la priorité sur la config (white-box : getter sans surface DOM).
      expect(internals(f).resolvedFilterLabel()).toBe('Filtrer');
      const select = await selectHarness(f);
      await select.filter('e');
      expect(await select.waitForAnnouncement('4 résultats')).toBe('4 résultats');
    });

    it('ignore la purge interne du listbox quand le filtre masque la sélection (garde F4)', () => {
      host.value.set('Banane');
      fixture.detectChanges();
      const inst = open();
      typeFilter(fixture, el, 'ceri'); // « Banane » est masquée → la lib émettrait valueChange([])
      inst.onListboxValueChange([]);
      fixture.detectChanges();
      expect(host.value()).toBe('Banane'); // valeur intacte
      expect(inst.expanded()).toBe(true); // popup toujours ouvert
    });

    it('sans filtre actif, une valeur vide du listbox reste un vrai désélectionnement', () => {
      host.value.set('Banane');
      fixture.detectChanges();
      const inst = open();
      inst.onListboxValueChange([]);
      fixture.detectChanges();
      expect(host.value()).toBeNull();
    });

    it('ArrowDown navigue dans la liste depuis le champ ; Home reste dans le champ', async () => {
      const select = await selectHarness(fixture);
      await select.open();
      expect(await select.getActiveOptionText()).toBe('Pomme'); // 1re option active à l'ouverture
      await select.pressInFilter(TestKey.DOWN_ARROW);
      expect(await select.getActiveOptionText()).toBe('Banane');
      await select.pressInFilter(TestKey.HOME); // déplacerait le caret, pas l'option active
      expect(await select.getActiveOptionText()).toBe('Banane');
    });

    it('fait défiler la liste pour afficher l’option active lors de la navigation', async () => {
      const spy = vi.spyOn(Element.prototype, 'scrollIntoView');
      const select = await selectHarness(fixture);
      await select.open();
      spy.mockClear(); // on ignore l'appel à l'ouverture

      await select.pressInFilter(TestKey.DOWN_ARROW);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledWith({ block: 'nearest' });
    });

    it('Enter sélectionne l’option active, ferme et rend le focus au trigger', async () => {
      const select = await selectHarness(fixture);
      await select.open();
      await select.pressInFilter(TestKey.DOWN_ARROW); // Pomme → Banane
      await select.pressInFilter(TestKey.ENTER);
      expect(host.value()).toBe('Banane');
      expect(await select.isOpen()).toBe(false);
      expect(document.activeElement).toBe(trigger(el));
    });

    it('Tab ferme le popup et rend le focus au trigger (le listbox est tabbable)', async () => {
      const select = await selectHarness(fixture);
      await select.open();
      await select.pressInFilter(TestKey.TAB);
      expect(await select.isOpen()).toBe(false);
      expect(host.value()).toBeNull(); // Tab ne sélectionne pas
      expect(document.activeElement).toBe(trigger(el));
    });

    it('Escape ferme sans toucher à la valeur et rend le focus au trigger', async () => {
      host.value.set('Banane');
      fixture.detectChanges();
      const select = await selectHarness(fixture);
      await select.filter('ceri');
      await select.pressInFilter(TestKey.ESCAPE);
      expect(await select.isOpen()).toBe(false);
      expect(host.value()).toBe('Banane');
      expect(document.activeElement).toBe(trigger(el));
    });

    it('réinitialise le filtre à la fermeture (liste complète à la réouverture)', async () => {
      const select = await selectHarness(fixture);
      await select.filter('ceri');
      expect(await select.getOptionTexts()).toEqual(['Cerise']);
      await select.close();
      expect(await select.getFilterText()).toBe('');
      await select.open();
      expect(await select.getFilterText()).toBe('');
      expect(await select.getOptionTexts()).toEqual(host.fruits);
    });

    describe('troncation des options', () => {
      let fixtureTrunc: ComponentFixture<TruncatedHost>;
      let elTrunc: HTMLElement;

      beforeEach(() => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({ imports: [TruncatedHost] });
        fixtureTrunc = TestBed.createComponent(TruncatedHost);
        fixtureTrunc.detectChanges();
        elTrunc = fixtureTrunc.nativeElement;
      });

      it("limite le nombre d'options affichées dans le DOM et affiche l'indicateur visuel et sonore", async () => {
        const select = await selectHarness(fixtureTrunc);
        await select.open();

        // 1. Devrait n'afficher que 3 options sur les 5 disponibles (car maxOptions = 3)
        expect(await select.getOptionTexts()).toEqual(['Pomme', 'Banane', 'Cerise']);

        // 2. Devrait afficher la ligne informative de troncature
        const truncatedInfo = elTrunc.querySelector('.kt-select__truncated-info');
        expect(truncatedInfo).toBeTruthy();
        expect(truncatedInfo?.textContent?.trim()).toContain('Showing first 3 results of 5');

        // 3. Annonce sonore différée — attendue par le CONTENU via le harness (timers réels).
        await select.filter('e'); // Pomme, Banane, Cerise, Pêche -> 4 résultats
        expect(await select.waitForAnnouncement(/displayed out of/)).toBe(
          '3 results displayed out of 4. Refine your search to see more.',
        );
      });

      it("conserve la valeur sélectionnée hors de la troncation lorsqu'on ferme le popup", async () => {
        // 'Abricot' est le 5e élément, donc hors des 3 affichés.
        fixtureTrunc.componentInstance.value.set('Abricot');
        fixtureTrunc.detectChanges();
        const select = await selectHarness(fixtureTrunc);

        await select.open();
        expect(fixtureTrunc.componentInstance.value()).toBe('Abricot'); // pas de purge à l'ouverture

        await select.close();
        expect(fixtureTrunc.componentInstance.value()).toBe('Abricot'); // ni à la fermeture
      });
    });
  });

  describe('trous (audit) — a11y & correctness', () => {
    async function open(f: ComponentFixture<unknown>): Promise<KtSelectHarness> {
      const select = await selectHarness(f);
      await select.open();
      return select;
    }

    it('option désactivée (optionDisabled) exposée aria-disabled="true"', async () => {
      TestBed.configureTestingModule({ imports: [UserKeyHost] });
      const f = TestBed.createComponent(UserKeyHost);
      const select = await selectHarness(f);
      const grace = await select.getOption({ text: /Grace/ });
      expect(await grace.isDisabled()).toBe(true);
    });

    it('readonly : le listbox porte aria-readonly="true"', async () => {
      @Component({
        imports: [KtSelect],
        template: `<kt-select [options]="fruits" label="F" [readonly]="true" />`,
      })
      class ReadonlyHost {
        fruits = ['A', 'B'];
      }
      TestBed.configureTestingModule({ imports: [ReadonlyHost] });
      const f = TestBed.createComponent(ReadonlyHost);
      f.detectChanges();
      await open(f);
      expect((f.nativeElement as HTMLElement).querySelector('[role="listbox"]')!.getAttribute('aria-readonly')).toBe(
        'true',
      );
    });

    it('invalide + touché : data-invalid sur le trigger + aria-describedby vers l’erreur', async () => {
      @Component({
        imports: [KtSelect],
        template: `<kt-select [options]="fruits" label="F" hint="Indice" [invalid]="true" [errors]="errors" />`,
      })
      class InvalidHost {
        fruits = ['A', 'B'];
        errors = [{ kind: 'required', message: 'Requis' }];
      }
      TestBed.configureTestingModule({ imports: [InvalidHost] });
      const f = TestBed.createComponent(InvalidHost);
      f.detectChanges();
      // `touched` n'est pas un input public : white-box légitime (pas atteignable proprement par le DOM).
      (internals(f) as unknown as { touched: { set(v: boolean): void } }).touched.set(true);
      const select = await selectHarness(f);
      expect(await select.isInvalid()).toBe(true);
      const trig = trigger(f.nativeElement);
      const id = trig.id;
      expect(trig.getAttribute('aria-describedby')).toContain(`${id}-error`);
      expect((f.nativeElement as HTMLElement).querySelector('.kt-field__error')?.textContent).toContain('Requis');
    });

    it('mode objet, valeur absente des options : le trigger affiche labelOf(v) (pas le placeholder)', () => {
      @Component({
        imports: [KtSelect],
        template: `<kt-select [options]="users" optionLabel="name" placeholder="Choisir" [(value)]="value" />`,
      })
      class AbsentHost {
        users = USERS;
        value = signal<User | null>({ id: 99, name: 'Inconnu', role: 'X' });
      }
      TestBed.configureTestingModule({ imports: [AbsentHost] });
      const f = TestBed.createComponent(AbsentHost);
      f.detectChanges();
      expect(valueText(f.nativeElement)).toBe('Inconnu');
    });

    it('override par input du texte de troncature (prioritaire sur la config)', async () => {
      @Component({
        imports: [KtSelect],
        template: `<kt-select
          [options]="fruits"
          [filterable]="true"
          [maxVisibleOptions]="2"
          [truncatedResultsText]="trunc"
          label="F"
        />`,
      })
      class TruncOverrideHost {
        fruits = ['A', 'B', 'C', 'D'];
        trunc = (max: number, total: number): string => `Affiche ${max}/${total}`;
      }
      TestBed.configureTestingModule({ imports: [TruncOverrideHost] });
      const f = TestBed.createComponent(TruncOverrideHost);
      f.detectChanges();
      await open(f);
      expect((f.nativeElement as HTMLElement).querySelector('.kt-select__truncated-info')?.textContent?.trim()).toBe(
        'Affiche 2/4',
      );
    });

    it('filtrable : le trigger porte aria-controls vers le panneau dialog (panelId)', async () => {
      TestBed.configureTestingModule({ imports: [FilterableHost] });
      const f = TestBed.createComponent(FilterableHost);
      f.detectChanges();
      await open(f);
      const panel = (f.nativeElement as HTMLElement).querySelector<HTMLElement>('[role="dialog"]')!;
      expect(trigger(f.nativeElement).getAttribute('aria-controls')).toBe(panel.id);
    });
  });
});
