import { Component, Type, computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TestKey } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { KtViewport } from '@ktortu/aaa/cdk';
import { KT_SELECT_CONFIG } from '../select/select-config';
import { KtMultiSelect } from './multi-select';
import { KtMultiSelectHarness } from './multi-select.harness';

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
 * Accès white-box aux membres protégés — RÉSERVÉ aux cas non atteignables par le DOM
 * (règle de cohabitation harness ↔ internals). Tout comportement observable passe par
 * `KtMultiSelectHarness` ; ne restent ici que : pilotage d'état pour les tests à fake timers,
 * contrat interne du listbox (purge/désélection/clé désactivée via `onListboxValueChange`), et
 * `selectAllFiltered` (sans surface DOM quand `selectionActions` n'est pas activé sur l'hôte).
 */
interface MultiSelectInternals {
  expanded: { (): boolean; set(v: boolean): void };
  onListboxValueChange(keys: readonly unknown[]): void;
  selectAllFiltered(): void;
}

function internals(fixture: ComponentFixture<unknown>): MultiSelectInternals {
  return fixture.debugElement.query(By.directive(KtMultiSelect)).componentInstance as unknown as MultiSelectInternals;
}

/** Charge le harness du multi-select (comportement observable par le DOM ; cf. règle de cohabitation). */
function multiHarness(fixture: ComponentFixture<unknown>): Promise<KtMultiSelectHarness> {
  return TestbedHarnessEnvironment.loader(fixture).getHarness(KtMultiSelectHarness);
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

function chipLabels(el: HTMLElement): string[] {
  return Array.from(el.querySelectorAll<HTMLElement>('.kt-chip__label')).map((s) => s.textContent?.trim() ?? '');
}

function chipRemoveButtons(el: HTMLElement): HTMLButtonElement[] {
  return Array.from(el.querySelectorAll<HTMLButtonElement>('.kt-chip__remove'));
}

function chipsStatusText(el: HTMLElement): string {
  return el.querySelector('.kt-chip-list__status')?.textContent?.trim() ?? '';
}

function typeFilter(fixture: ComponentFixture<unknown>, el: HTMLElement, text: string): void {
  const input = filterInput(el);
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  fixture.detectChanges();
}

// --- Primitifs (string[]) ---
@Component({
  imports: [KtMultiSelect],
  template: `
    <kt-multi-select
      [options]="fruits"
      label="Fruits"
      placeholder="Choisir"
      [(value)]="value"
      [(touched)]="touched"
      (selectionChange)="changes.set(changes() + 1)"
    />
  `,
})
class PrimitiveHost {
  fruits = ['Pomme', 'Banane', 'Cerise', 'Mangue', 'Fraise'];
  value = signal<string[]>([]);
  touched = signal(false);
  changes = signal(0);
}

// --- Objets, mode clé (value = user.id) ---
@Component({
  imports: [KtMultiSelect],
  template: `
    <kt-multi-select
      [options]="users"
      optionLabel="name"
      [optionValue]="userKey"
      [optionDisabled]="userDisabled"
      label="Users"
      [(value)]="value"
      (selectionChange)="last.set($event)"
    />
  `,
})
class UserKeyHost {
  users = USERS;
  userKey = (u: User): number => u.id;
  userDisabled = (u: User): boolean => !!u.disabled;
  value = signal<number[]>([]);
  last = signal<{ value: number[]; options: User[] } | null>(null);
}

// --- Objets, mode objet (value = User[], compareWith par identité par défaut) ---
@Component({
  imports: [KtMultiSelect],
  template: `<kt-multi-select [options]="users" optionLabel="name" label="Users" [(value)]="value" />`,
})
class UserObjHost {
  users = USERS;
  value = signal<User[]>([]);
}

// --- Filtrable ---
@Component({
  imports: [KtMultiSelect],
  template: `
    <kt-multi-select
      [options]="fruits"
      [filterable]="true"
      label="Fruits"
      [(value)]="value"
      [(touched)]="touched"
      (selectionChange)="changes.set(changes() + 1)"
    />
  `,
})
class FilterableHost {
  fruits = ['Pomme', 'Banane', 'Cerise', 'Pêche'];
  value = signal<string[]>([]);
  touched = signal(false);
  changes = signal(0);
}

// --- Actions de masse + clearable + chips repliés ---
@Component({
  imports: [KtMultiSelect],
  template: `
    <kt-multi-select
      [options]="fruits"
      [filterable]="true"
      [selectionActions]="true"
      clearable
      [maxVisibleChips]="2"
      label="Fruits"
      [(value)]="value"
    />
  `,
})
class BulkHost {
  fruits = ['Pomme', 'Banane', 'Cerise', 'Pêche'];
  value = signal<string[]>([]);
}

@Component({
  imports: [KtMultiSelect],
  template: `
    <kt-multi-select
      [options]="fruits"
      [filterable]="true"
      [maxVisibleOptions]="maxOptions"
      label="Fruits"
      [(value)]="value"
    />
  `,
})
class TruncatedHost {
  fruits = ['Pomme', 'Banane', 'Cerise', 'Pêche', 'Abricot'];
  maxOptions = 3;
  value = signal<string[]>([]);
}

// --- disabled / readonly ---
@Component({
  imports: [KtMultiSelect],
  template: `
    <kt-multi-select
      [options]="fruits"
      label="F"
      [disabled]="disabled()"
      [readonly]="readonly()"
      clearable
      [(value)]="value"
    />
  `,
})
class StateHost {
  fruits = ['A', 'B', 'C'];
  disabled = signal(false);
  readonly = signal(false);
  value = signal<string[]>(['A', 'B']);
}

// --- validationButtonLabel (sheet mobile) ---
@Component({
  imports: [KtMultiSelect],
  template: `
    <kt-multi-select
      [options]="fruits"
      label="Fruits"
      [validationButtonLabel]="buttonLabel()"
      [(value)]="value"
      [(touched)]="touched"
    />
  `,
})
class ValidationButtonHost {
  fruits = ['Pomme', 'Banane', 'Cerise'];
  buttonLabel = signal<string | undefined>('Valider la sélection');
  value = signal<string[]>(['Pomme']);
  touched = signal(false);
}

@Component({
  imports: [KtMultiSelect],
  providers: [
    {
      provide: KT_SELECT_CONFIG,
      useValue: { validationButtonLabel: 'Confirmer mon choix' },
    },
  ],
  template: ` <kt-multi-select [options]="fruits" label="Fruits" [(value)]="value" [(touched)]="touched" /> `,
})
class ValidationButtonConfigHost {
  fruits = ['Pomme', 'Banane', 'Cerise'];
  value = signal<string[]>([]);
  touched = signal(false);
}

@Component({
  imports: [KtMultiSelect],
  providers: [
    {
      provide: KT_SELECT_CONFIG,
      useValue: { validationButtonLabel: 'Config globale' },
    },
  ],
  template: `
    <kt-multi-select [options]="fruits" label="Fruits" validationButtonLabel="Surcharge locale" [(value)]="value" />
  `,
})
class ValidationButtonOverrideHost {
  fruits = ['Pomme', 'Banane', 'Cerise'];
  value = signal<string[]>([]);
}

describe('MultiSelect', () => {
  beforeEach(() => {
    // jsdom n'implémente pas scrollIntoView (utilisé par le listbox à la navigation).
    Element.prototype.scrollIntoView ??= () => undefined;
  });

  function open(fixture: ComponentFixture<unknown>, el: HTMLElement): MultiSelectInternals {
    const inst = internals(fixture);
    // Indispensable sous jsdom : closePopupOnBlurEffect (lib) referme aussitôt le popup
    // si ni le combobox ni le widget n'ont le focus (en réel, le clic focus le trigger).
    trigger(el).focus();
    inst.expanded.set(true);
    fixture.detectChanges();
    return inst;
  }

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

    it('rend un trigger combobox fermé avec placeholder, sans chips', () => {
      expect(trigger(el).getAttribute('role')).toBe('combobox');
      expect(trigger(el).getAttribute('aria-expanded')).toBe('false');
      expect(valueText(el)).toBe('Choisir');
      expect(el.querySelector('.kt-chip-list')).toBeFalsy();
    });

    it('expose aria-multiselectable sur le listbox', async () => {
      const ms = await multiHarness(fixture);
      await ms.open();
      expect(el.querySelector('[role="listbox"]')?.getAttribute('aria-multiselectable')).toBe('true');
    });

    it('toggle : ajoute puis retire des sélections en gardant l’ordre de sélection', async () => {
      const ms = await multiHarness(fixture);
      await ms.toggleOption({ text: 'Cerise' });
      expect(host.value()).toEqual(['Cerise']);
      await ms.toggleOption({ text: 'Banane' });
      expect(host.value()).toEqual(['Cerise', 'Banane']); // ordre de sélection, pas des options
      await ms.toggleOption({ text: 'Cerise' }); // retire
      expect(host.value()).toEqual(['Banane']);
      expect(host.touched()).toBe(true);
      expect(host.changes()).toBe(3);
    });

    it('énumère jusqu’à 3 libellés sur le trigger, puis bascule sur le résumé', () => {
      host.value.set(['Pomme', 'Banane', 'Cerise']);
      fixture.detectChanges();
      expect(valueText(el)).toBe('Pomme, Banane, Cerise');
      host.value.set(['Pomme', 'Banane', 'Cerise', 'Mangue']);
      fixture.detectChanges();
      expect(valueText(el)).toBe('4 items selected'); // défaut lib neutre EN
    });

    it('rend un chip révocable par sélection, libellé accessible inclus', async () => {
      host.value.set(['Banane', 'Fraise']);
      const ms = await multiHarness(fixture);
      expect(await ms.getChipTexts()).toEqual(['Banane', 'Fraise']);
      const removeBtns = chipRemoveButtons(el);
      expect(removeBtns[0].getAttribute('aria-label')).toBe('Remove Banane');
      expect(el.querySelector('[role="list"]')?.getAttribute('aria-label')).toBe('Selected items for Fruits');
    });

    it('retirer un chip met à jour la valeur et annonce le retrait', async () => {
      host.value.set(['Banane', 'Fraise']);
      const ms = await multiHarness(fixture);
      await ms.removeChip(0);
      expect(host.value()).toEqual(['Fraise']);
      expect(chipsStatusText(el)).toBe('Banane removed');
    });

    it('après retrait, le focus va au chip suivant ; au dernier retrait, au trigger', async () => {
      host.value.set(['Banane', 'Fraise']);
      fixture.detectChanges();
      chipRemoveButtons(el)[0].click();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(document.activeElement).toBe(chipRemoveButtons(el)[0]); // chip « Fraise »
      chipRemoveButtons(el)[0].click();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(host.value()).toEqual([]);
      expect(document.activeElement).toBe(trigger(el));
      // La live region survit au dernier chip (rendue hors du @if).
      expect(chipsStatusText(el)).toBe('Fraise removed');
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

    it('affiche les libellés des valeurs préchargées (ids → options)', () => {
      host.value.set([2, 1]);
      fixture.detectChanges();
      expect(valueText(el)).toBe('Alan, Ada');
      expect(chipLabels(el)).toEqual(['Alan', 'Ada']);
    });

    it('émet { value: ids, options } et écrit les clés dans la valeur', () => {
      const inst = open(fixture, el);
      inst.onListboxValueChange([2, 3]);
      fixture.detectChanges();
      expect(host.value()).toEqual([2, 3]);
      expect(host.last()).toEqual({ value: [2, 3], options: [USERS[1], USERS[2]] });
    });
  });

  describe('objets — mode objet (compareWith)', () => {
    let fixture: ComponentFixture<UserObjHost>;
    let host: UserObjHost;
    let el: HTMLElement;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [UserObjHost] });
      fixture = TestBed.createComponent(UserObjHost);
      host = fixture.componentInstance;
      el = fixture.nativeElement;
      fixture.detectChanges();
    });

    it('présélectionne via l’identité par défaut (égalité par id, pas par référence)', () => {
      // Objet équivalent par id mais référence différente (cas refetch).
      host.value.set([{ id: 3, name: 'Grace', role: 'Éditeur', disabled: true }]);
      fixture.detectChanges();
      expect(chipLabels(el)).toEqual(['Grace']);
      expect(valueText(el)).toBe('Grace');
    });

    it('écrit les objets entiers dans la valeur quand optionValue est omis', async () => {
      const ms = await multiHarness(fixture);
      await ms.toggleOption({ text: 'Ada' });
      await ms.toggleOption({ text: 'Alan' });
      expect(host.value()).toEqual([USERS[0], USERS[1]]);
    });

    it('désélection depuis le listbox d’une entrée présélectionnée par clone', () => {
      host.value.set([{ id: 1, name: 'Ada', role: 'Admin' }]);
      fixture.detectChanges();
      const inst = open(fixture, el);
      inst.onListboxValueChange([]);
      fixture.detectChanges();
      expect(host.value()).toEqual([]);
    });

    it('retirer un chip d’un clone passe par le comparateur', () => {
      host.value.set([{ id: 2, name: 'Alan', role: 'Éditeur' }]);
      fixture.detectChanges();
      chipRemoveButtons(el)[0].click();
      fixture.detectChanges();
      expect(host.value()).toEqual([]);
    });
  });

  describe('filtrable — fusion et annonces', () => {
    let fixture: ComponentFixture<FilterableHost>;
    let host: FilterableHost;
    let el: HTMLElement;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [FilterableHost] });
      fixture = TestBed.createComponent(FilterableHost);
      host = fixture.componentInstance;
      el = fixture.nativeElement;
      fixture.detectChanges();
    });

    it('conserve les sélections masquées par le filtre, sans événement parasite (purge interne)', () => {
      host.value.set(['Banane']);
      fixture.detectChanges();
      const inst = open(fixture, el);
      typeFilter(fixture, el, 'ceri'); // « Banane » masquée → la lib émettrait valueChange([])
      const changesBefore = host.changes();
      inst.onListboxValueChange([]);
      fixture.detectChanges();
      expect(host.value()).toEqual(['Banane']); // valeur intacte
      expect(host.changes()).toBe(changesBefore); // pas de selectionChange parasite
      expect(host.touched()).toBe(false); // pas de touched parasite
    });

    it('fusionne sélection visible et sélections hors filtre', async () => {
      host.value.set(['Banane']);
      fixture.detectChanges();
      const ms = await multiHarness(fixture);
      await ms.filter('ceri');
      await ms.toggleOption({ text: 'Cerise' }); // toggle sur l'option visible
      expect(host.value()).toEqual(['Banane', 'Cerise']);
    });

    it('annonce différée « N results, M selected » quand des sélections existent', async () => {
      host.value.set(['Banane', 'Pomme']);
      fixture.detectChanges();
      const ms = await multiHarness(fixture);
      await ms.filter('ceri');
      expect(await ms.getAnnouncement()).toBe(''); // pas d'annonce immédiate (anti-spam SR)
      expect(await ms.waitForAnnouncement()).toBe('1 result, 2 selected');
    });

    it('affiche le compteur visible (aria-hidden) quand une sélection existe', async () => {
      host.value.set(['Banane']);
      fixture.detectChanges();
      const ms = await multiHarness(fixture);
      await ms.open();
      const count = el.querySelector<HTMLElement>('.kt-select__count')!;
      expect(count.textContent?.trim()).toBe('1 selected');
      expect(count.getAttribute('aria-hidden')).toBe('true');
    });

    it('Tab ferme sans preventDefault et rend le focus au trigger (le Tab natif continue)', async () => {
      const ms = await multiHarness(fixture);
      await ms.open();
      // Vérifie que Tab n'est PAS preventDefault'd (un seul Tab pour avancer) → dispatch DOM direct
      // car `defaultPrevented` n'est pas une sémantique exposée par le harness.
      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
      const notPrevented = filterInput(el).dispatchEvent(event);
      fixture.detectChanges();
      expect(notPrevented).toBe(true);
      expect(await ms.isOpen()).toBe(false);
      expect(document.activeElement).toBe(trigger(el));
    });

    it('Escape ferme sans toucher à la valeur et rend le focus au trigger', async () => {
      host.value.set(['Banane']);
      fixture.detectChanges();
      const ms = await multiHarness(fixture);
      await ms.filter('ceri');
      await ms.pressInFilter(TestKey.ESCAPE);
      expect(await ms.isOpen()).toBe(false);
      expect(host.value()).toEqual(['Banane']);
      expect(document.activeElement).toBe(trigger(el));
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
        const ms = await multiHarness(fixtureTrunc);
        await ms.open();

        // 1. Devrait n'afficher que 3 options sur les 5 disponibles (car maxOptions = 3)
        expect(await ms.getOptionTexts()).toEqual(['Pomme', 'Banane', 'Cerise']);

        // 2. Devrait afficher la ligne informative de troncature
        const truncatedInfo = elTrunc.querySelector('.kt-select__truncated-info');
        expect(truncatedInfo).toBeTruthy();
        expect(truncatedInfo?.textContent?.trim()).toContain('Showing first 3 results of 5');

        // 3. Annonce sonore différée — attendue par le CONTENU via le harness (timers réels).
        await ms.filter('e'); // Pomme, Banane, Cerise, Pêche -> 4 résultats
        expect(await ms.waitForAnnouncement(/displayed out of/)).toBe(
          '3 results displayed out of 4. Refine your search to see more.',
        );
      });

      it("conserve les valeurs sélectionnées hors de la troncation lorsqu'on ferme le popup", async () => {
        // 'Abricot' et 'Pêche' sont les 4e et 5e éléments, donc hors des 3 affichés.
        fixtureTrunc.componentInstance.value.set(['Abricot', 'Pêche']);
        fixtureTrunc.detectChanges();
        const ms = await multiHarness(fixtureTrunc);

        await ms.open();
        expect(fixtureTrunc.componentInstance.value()).toEqual(['Abricot', 'Pêche']); // pas de purge à l'ouverture

        await ms.close();
        expect(fixtureTrunc.componentInstance.value()).toEqual(['Abricot', 'Pêche']); // ni à la fermeture
      });
    });
  });

  describe('actions de masse, clearable, chips repliés', () => {
    let fixture: ComponentFixture<BulkHost>;
    let host: BulkHost;
    let el: HTMLElement;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [BulkHost] });
      fixture = TestBed.createComponent(BulkHost);
      host = fixture.componentInstance;
      el = fixture.nativeElement;
      fixture.detectChanges();
    });

    function actionButtons(): HTMLButtonElement[] {
      return Array.from(el.querySelectorAll<HTMLButtonElement>('.kt-select__action'));
    }

    it('Tout sélectionner / Tout effacer agissent sur toutes les options sans filtre', async () => {
      const ms = await multiHarness(fixture);
      await ms.open();
      expect(actionButtons().map((b) => b.textContent?.trim())).toEqual(['Select all', 'Clear all']);
      actionButtons()[0].click();
      fixture.detectChanges();
      expect(host.value()).toEqual(host.fruits);
      actionButtons()[1].click();
      fixture.detectChanges();
      expect(host.value()).toEqual([]);
    });

    it('avec filtre actif, seules les options filtrées sont concernées', async () => {
      host.value.set(['Banane']);
      fixture.detectChanges();
      const ms = await multiHarness(fixture);
      await ms.filter('p'); // Pomme, Pêche
      actionButtons()[0].click();
      fixture.detectChanges();
      expect(host.value()).toEqual(['Banane', 'Pomme', 'Pêche']); // Banane (hors filtre) conservée
      actionButtons()[1].click();
      fixture.detectChanges();
      expect(host.value()).toEqual(['Banane']); // seules les visibles sont décochées
    });

    it('annonce immédiatement le total après une action de masse', async () => {
      const ms = await multiHarness(fixture);
      await ms.open();
      actionButtons()[0].click();
      fixture.detectChanges();
      expect(el.querySelector('.kt-select__filter-status')?.textContent?.trim()).toBe('4 selected');
    });

    it('clearable : bouton visible avec une sélection, vide tout et refocus le trigger', () => {
      expect(el.querySelector('.kt-select__clear')).toBeFalsy();
      host.value.set(['Pomme', 'Banane']);
      fixture.detectChanges();
      const clear = el.querySelector<HTMLButtonElement>('.kt-select__clear')!;
      expect(clear).toBeTruthy();
      clear.click();
      fixture.detectChanges();
      expect(host.value()).toEqual([]);
      expect(document.activeElement).toBe(trigger(el));
      expect(chipsStatusText(el)).toBe('0 selected');
    });

    it('replie les chips au-delà de maxVisibleChips et déplie au clic (+N more)', async () => {
      host.value.set(['Pomme', 'Banane', 'Cerise', 'Pêche']);
      fixture.detectChanges();
      expect(chipLabels(el)).toEqual(['Pomme', 'Banane']);
      const more = el.querySelector<HTMLButtonElement>('.kt-chip-list__more')!;
      expect(more.textContent?.trim()).toBe('+2 more');
      expect(more.getAttribute('aria-expanded')).toBe('false');
      more.click();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(chipLabels(el)).toEqual(['Pomme', 'Banane', 'Cerise', 'Pêche']);
      const less = el.querySelector<HTMLButtonElement>('.kt-chip-list__more')!;
      expect(less.textContent?.trim()).toBe('Show less');
      expect(less.getAttribute('aria-expanded')).toBe('true');
      // Focus sur le premier chip révélé (le 3e).
      expect(document.activeElement).toBe(chipRemoveButtons(el)[2]);
      less.click();
      fixture.detectChanges();
      expect(chipLabels(el)).toEqual(['Pomme', 'Banane']);
    });

    it('replie automatiquement quand la sélection repasse sous le seuil', () => {
      host.value.set(['Pomme', 'Banane', 'Cerise']);
      fixture.detectChanges();
      el.querySelector<HTMLButtonElement>('.kt-chip-list__more')!.click();
      fixture.detectChanges();
      host.value.set(['Pomme']);
      fixture.detectChanges();
      expect(el.querySelector('.kt-chip-list__more')).toBeFalsy();
      expect(chipLabels(el)).toEqual(['Pomme']);
    });
  });

  describe('états disabled / readonly', () => {
    let fixture: ComponentFixture<StateHost>;
    let host: StateHost;
    let el: HTMLElement;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [StateHost] });
      fixture = TestBed.createComponent(StateHost);
      host = fixture.componentInstance;
      el = fixture.nativeElement;
      fixture.detectChanges();
    });

    it('disabled : trigger et boutons de chips désactivés, clear masqué, retrait inopérant', () => {
      host.disabled.set(true);
      fixture.detectChanges();
      expect(trigger(el).disabled).toBe(true);
      expect(el.querySelector('.kt-select__clear')).toBeFalsy();
      const removeBtn = chipRemoveButtons(el)[0];
      expect(removeBtn.disabled).toBe(true);
      removeBtn.click();
      fixture.detectChanges();
      expect(host.value()).toEqual(['A', 'B']); // garde TS : aucun retrait
    });

    it('readonly : boutons de retrait absents, clear masqué, valeur consultable', () => {
      host.readonly.set(true);
      fixture.detectChanges();
      expect(chipLabels(el)).toEqual(['A', 'B']);
      expect(chipRemoveButtons(el)).toEqual([]);
      expect(el.querySelector('.kt-select__clear')).toBeFalsy();
    });
  });

  describe('config (SELECT_CONFIG)', () => {
    it('les nouvelles clés multi sont consommées (libellés FR)', () => {
      TestBed.configureTestingModule({
        imports: [PrimitiveHost],
        providers: [
          {
            provide: KT_SELECT_CONFIG,
            useValue: {
              removeItemLabel: (l: string) => `Retirer ${l}`,
              selectedItemsLabel: (f: string | undefined) => `Sélection : ${f}`,
              selectionSummaryText: (n: number) => `${n} éléments sélectionnés`,
              itemRemovedText: (l: string) => `${l} retiré`,
            },
          },
        ],
      });
      const fixture = TestBed.createComponent(PrimitiveHost);
      const host = fixture.componentInstance;
      const el = fixture.nativeElement as HTMLElement;
      host.value.set(['Pomme', 'Banane', 'Cerise', 'Mangue']);
      fixture.detectChanges();
      expect(valueText(el)).toBe('4 éléments sélectionnés');
      expect(el.querySelector('[role="list"]')?.getAttribute('aria-label')).toBe('Sélection : Fruits');
      const removeBtn = chipRemoveButtons(el)[0];
      expect(removeBtn.getAttribute('aria-label')).toBe('Retirer Pomme');
      removeBtn.click();
      fixture.detectChanges();
      expect(chipsStatusText(el)).toBe('Pomme retiré');
    });
  });

  describe('trous (audit) — a11y & correctness', () => {
    function open(f: ComponentFixture<unknown>): MultiSelectInternals {
      const inst = internals(f);
      trigger(f.nativeElement as HTMLElement).focus();
      inst.expanded.set(true);
      f.detectChanges();
      return inst;
    }

    it('pending : aria-busy + data-pending sur le trigger ; absents sinon', () => {
      @Component({
        imports: [KtMultiSelect],
        template: `<kt-multi-select [options]="fruits" label="F" [pending]="pending()" />`,
      })
      class PendingHost {
        fruits = ['A', 'B'];
        pending = signal(false);
      }
      TestBed.configureTestingModule({ imports: [PendingHost] });
      const f = TestBed.createComponent(PendingHost);
      f.detectChanges();
      const trig = trigger(f.nativeElement as HTMLElement);
      expect(trig.hasAttribute('aria-busy')).toBe(false);
      f.componentInstance.pending.set(true);
      f.detectChanges();
      expect(trig.getAttribute('aria-busy')).toBe('true');
      expect(trig.getAttribute('data-pending')).toBe('');
    });

    it('invalide + touché : data-invalid + message d’erreur + describedby', () => {
      @Component({
        imports: [KtMultiSelect],
        template: `<kt-multi-select
          [options]="fruits"
          label="F"
          hint="Indice"
          [invalid]="true"
          [errors]="errors"
          [(touched)]="touched"
        />`,
      })
      class InvalidHost {
        fruits = ['A', 'B'];
        errors = [{ kind: 'required', message: 'Requis' }];
        touched = signal(true);
      }
      TestBed.configureTestingModule({ imports: [InvalidHost] });
      const f = TestBed.createComponent(InvalidHost);
      f.detectChanges();
      const trig = trigger(f.nativeElement as HTMLElement);
      expect(trig.getAttribute('data-invalid')).toBe('');
      expect(trig.getAttribute('aria-describedby')).toContain(`${trig.id}-error`);
      expect((f.nativeElement as HTMLElement).querySelector('.kt-field__error')?.textContent).toContain('Requis');
    });

    it('data-filled posé sur le trigger dès qu’une sélection existe', () => {
      TestBed.configureTestingModule({ imports: [PrimitiveHost] });
      const f = TestBed.createComponent(PrimitiveHost);
      f.detectChanges();
      const trig = trigger(f.nativeElement as HTMLElement);
      expect(trig.hasAttribute('data-filled')).toBe(false);
      f.componentInstance.value.set(['Pomme']);
      f.detectChanges();
      expect(trig.getAttribute('data-filled')).toBe('');
    });

    it('option désactivée : aria-disabled="true" et clé non committée', () => {
      TestBed.configureTestingModule({ imports: [UserKeyHost] });
      const f = TestBed.createComponent(UserKeyHost);
      f.detectChanges();
      const inst = open(f);
      const grace = Array.from(
        (f.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('li.kt-select__option'),
      ).find((li) => li.textContent?.includes('Grace'))!;
      expect(grace.getAttribute('aria-disabled')).toBe('true');
      inst.selectAllFiltered();
      f.detectChanges();
      expect(f.componentInstance.value()).not.toContain(3); // Grace (id 3) jamais incluse
    });

    it('selectAllFiltered exclut les options désactivées', () => {
      TestBed.configureTestingModule({ imports: [UserKeyHost] });
      const f = TestBed.createComponent(UserKeyHost);
      f.detectChanges();
      open(f).selectAllFiltered();
      f.detectChanges();
      expect([...f.componentInstance.value()].sort()).toEqual([1, 2]); // 3 (Grace, disabled) exclue
    });

    it('état vide du listbox : li.kt-select__empty role="option" aria-disabled', async () => {
      TestBed.configureTestingModule({ imports: [FilterableHost] });
      const f = TestBed.createComponent(FilterableHost);
      f.detectChanges();
      const ms = await multiHarness(f);
      await ms.filter('zzz');
      const empty = (f.nativeElement as HTMLElement).querySelector('.kt-select__empty')!;
      expect(empty.getAttribute('role')).toBe('option');
      expect(empty.getAttribute('aria-disabled')).toBe('true');
      expect(empty.textContent?.trim()).toBe('No options');
    });

    it('selectionChange en mode OBJET : payload value ET options (objets entiers)', async () => {
      @Component({
        imports: [KtMultiSelect],
        template: `<kt-multi-select
          [options]="users"
          optionLabel="name"
          label="U"
          [(value)]="value"
          (selectionChange)="last.set($event)"
        />`,
      })
      class ObjChangeHost {
        users = USERS;
        value = signal<User[]>([]);
        last = signal<{ value: User[]; options: User[] } | null>(null);
      }
      TestBed.configureTestingModule({ imports: [ObjChangeHost] });
      const f = TestBed.createComponent(ObjChangeHost);
      f.detectChanges();
      const ms = await multiHarness(f);
      await ms.toggleOption({ text: 'Ada' });
      await ms.toggleOption({ text: 'Alan' });
      const payload = f.componentInstance.last()!;
      expect(payload.value).toEqual([USERS[0], USERS[1]]);
      expect(payload.options).toEqual([USERS[0], USERS[1]]);
    });
  });
});

describe('MultiSelect — relais clavier (combos non transmis par le combobox)', () => {
  // onTriggerKeydown comble les combos que le relay activedescendant ne transmet pas au listbox
  // (Shift+Espace = sélection de plage ; Ctrl/Cmd+Shift+Home/End = plage jusqu'aux bornes). Ces
  // chemins sont la raison d'être de ce code et n'étaient couverts par aucun test.
  let fixture: ComponentFixture<PrimitiveHost>;
  let el: HTMLElement;

  beforeEach(() => {
    Element.prototype.scrollIntoView ??= () => undefined;
    TestBed.configureTestingModule({ imports: [PrimitiveHost] });
    fixture = TestBed.createComponent(PrimitiveHost);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  /** Ouvre le popup desktop (closePopupOnBlur referme sinon sous jsdom) et renvoie le listbox. */
  function openDesktop(): HTMLElement {
    trigger(el).focus();
    internals(fixture).expanded.set(true);
    fixture.detectChanges();
    return el.querySelector<HTMLElement>('.kt-select__listbox')!;
  }

  function captureListboxKeydowns(listbox: HTMLElement): KeyboardEvent[] {
    const received: KeyboardEvent[] = [];
    listbox.addEventListener('keydown', (e) => received.push(e as KeyboardEvent));
    return received;
  }

  function keydownOnTrigger(init: KeyboardEventInit): KeyboardEvent {
    const ev = new KeyboardEvent('keydown', { cancelable: true, ...init });
    trigger(el).dispatchEvent(ev);
    return ev;
  }

  it('Shift+Espace ouvert : relayé au listbox + preventDefault', () => {
    const received = captureListboxKeydowns(openDesktop());
    const ev = keydownOnTrigger({ key: ' ', shiftKey: true });
    expect(ev.defaultPrevented).toBe(true);
    expect(received).toHaveLength(1);
    expect(received[0].key).toBe(' ');
    expect(received[0].shiftKey).toBe(true);
  });

  it('Ctrl+Shift+End ouvert : relayé au listbox (plage jusqu’à la borne)', () => {
    const received = captureListboxKeydowns(openDesktop());
    keydownOnTrigger({ key: 'End', shiftKey: true, ctrlKey: true });
    expect(received).toHaveLength(1);
    expect(received[0].key).toBe('End');
    expect(received[0].ctrlKey).toBe(true);
  });

  // Garde propre, isolée du relay natif du combobox : Shift+Espace est précisément le combo que le
  // combobox NE relaie PAS, donc le preventDefault observé n'est dû qu'à onTriggerKeydown. Fermé, la
  // garde !expanded l'empêche → pas de preventDefault (négatif fiable, sans contamination combobox).
  it('popup fermé : Shift+Espace inerte (garde !expanded, pas de preventDefault)', () => {
    const ev = keydownOnTrigger({ key: ' ', shiftKey: true });
    expect(ev.defaultPrevented).toBe(false);
  });
});

describe('KtMultiSelect — bouton de validation sheet mobile (validationButtonLabel)', () => {
  let isCompact: ReturnType<typeof signal<boolean>>;

  beforeEach(() => {
    Element.prototype.scrollIntoView ??= () => undefined;
    isCompact = signal(false);
  });

  function createComponent<T>(type: Type<T>, compact = false) {
    isCompact.set(compact);
    TestBed.configureTestingModule({
      imports: [type],
      providers: [
        {
          provide: KtViewport,
          useValue: {
            isCompact,
            isMobile: isCompact,
            isTablet: signal(false),
            isDesktop: computed(() => !isCompact()),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(type);
    fixture.detectChanges();
    return fixture;
  }

  it('desktop (non compact) : le bouton n’est pas rendu même si validationButtonLabel est défini', async () => {
    const fixture = createComponent(ValidationButtonHost, false);
    const h = await multiHarness(fixture);
    await h.open();
    expect(await h.hasValidationButton()).toBe(false);
  });

  it('mobile (compact) : le bouton est rendu avec le libellé fourni par input', async () => {
    const fixture = createComponent(ValidationButtonHost, true);
    const h = await multiHarness(fixture);
    await h.open();
    expect(await h.hasValidationButton()).toBe(true);
    expect(await h.getValidationButtonText()).toBe('Valider la sélection');
  });

  it('mobile (compact) : le bouton est absent si validationButtonLabel est undefined ou vide', async () => {
    const fixture = createComponent(ValidationButtonHost, true);
    fixture.componentInstance.buttonLabel.set(undefined);
    fixture.detectChanges();
    const h = await multiHarness(fixture);
    await h.open();
    expect(await h.hasValidationButton()).toBe(false);
  });

  it('mobile (compact) : le bouton résout la valeur fournie via KT_SELECT_CONFIG', async () => {
    const fixture = createComponent(ValidationButtonConfigHost, true);
    const h = await multiHarness(fixture);
    await h.open();
    expect(await h.hasValidationButton()).toBe(true);
    expect(await h.getValidationButtonText()).toBe('Confirmer mon choix');
  });

  it('mobile (compact) : l’input surcharge la valeur de KT_SELECT_CONFIG', async () => {
    const fixture = createComponent(ValidationButtonOverrideHost, true);
    const h = await multiHarness(fixture);
    await h.open();
    expect(await h.hasValidationButton()).toBe(true);
    expect(await h.getValidationButtonText()).toBe('Surcharge locale');
  });

  it('mobile (compact) : le clic sur le bouton ferme le popup, marque le champ touched et conserve la valeur', async () => {
    const fixture = createComponent(ValidationButtonHost, true);
    const h = await multiHarness(fixture);
    await h.open();
    expect(await h.isOpen()).toBe(true);
    expect(fixture.componentInstance.touched()).toBe(false);

    // Toggle another option
    await h.toggleOption({ text: 'Banane' });
    expect(fixture.componentInstance.value()).toEqual(['Pomme', 'Banane']);

    // Click validation button
    await h.clickValidationButton();
    expect(await h.isOpen()).toBe(false);
    expect(fixture.componentInstance.touched()).toBe(true);
    expect(fixture.componentInstance.value()).toEqual(['Pomme', 'Banane']);
  });
});
