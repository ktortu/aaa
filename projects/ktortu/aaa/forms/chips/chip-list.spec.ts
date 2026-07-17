import { Component, ElementRef, TemplateRef, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KtChipList } from './chip-list';
import { KtChipItemDef, type KtChipItemContext } from './chip-item-def';
import { KT_CHIPS_CONFIG } from './chips-config';

function chipLabels(el: HTMLElement): string[] {
  return Array.from(el.querySelectorAll<HTMLElement>('.kt-chip__label')).map((s) => s.textContent?.trim() ?? '');
}

function removeButtons(el: HTMLElement): HTMLButtonElement[] {
  return Array.from(el.querySelectorAll<HTMLButtonElement>('.kt-chip__remove'));
}

function statusText(el: HTMLElement): string {
  return el.querySelector('.kt-chip-list__status')?.textContent?.trim() ?? '';
}

@Component({
  imports: [KtChipList],
  template: `
    <kt-chip-list
      #list
      [items]="items()"
      listLabel="Fruits choisis"
      [maxVisible]="maxVisible()"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [removable]="removable()"
      [emptyFocusTarget]="fallback()?.nativeElement"
      (removed)="onRemoved($event)"
    />
    <button #fb type="button">repli</button>
  `,
})
class Host {
  items = signal<string[]>(['Pomme', 'Banane', 'Cerise']);
  maxVisible = signal<number | undefined>(undefined);
  disabled = signal(false);
  readonly = signal(false);
  removable = signal(true);
  lastRemoved = signal<{ item: string; index: number } | null>(null);
  fallback = viewChild<ElementRef<HTMLButtonElement>>('fb');
  list = viewChild.required<KtChipList<string>>('list');

  onRemoved(event: { item: string; index: number }): void {
    this.lastRemoved.set(event);
    this.items.update((items) => items.filter((i) => i !== event.item));
  }
}

@Component({
  imports: [KtChipList, KtChipItemDef],
  template: `
    <kt-chip-list [items]="users()" itemLabel="name" itemKey="id" (removed)="onRemoved($event)">
      <ng-template [ktChipItem]="users()" let-user let-remove="remove">
        <button type="button" class="custom-chip" (click)="remove()">{{ user.name }}</button>
      </ng-template>
    </kt-chip-list>
  `,
})
class CustomTemplateHost {
  users = signal([
    { id: 1, name: 'Ada' },
    { id: 2, name: 'Linus' },
  ]);
  removedName = signal('');

  onRemoved(event: { item: { id: number; name: string }; index: number }): void {
    this.removedName.set(event.item.name);
    this.users.update((all) => all.filter((u) => u.id !== event.item.id));
  }
}

describe('ChipList', () => {
  function setup(): { fixture: ComponentFixture<Host>; host: Host; el: HTMLElement } {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return { fixture, host: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
  }

  it('rend un role=list étiqueté avec un chip révocable par item', () => {
    const { el } = setup();
    const list = el.querySelector('[role="list"]')!;
    expect(list.getAttribute('aria-label')).toBe('Fruits choisis');
    expect(el.querySelectorAll('kt-chip[role="listitem"]').length).toBe(3);
    expect(chipLabels(el)).toEqual(['Pomme', 'Banane', 'Cerise']);
    expect(removeButtons(el)[0].getAttribute('aria-label')).toBe('Remove Pomme'); // défaut EN
  });

  it('liste vide : pas de role=list, mais live region toujours rendue + data-empty', () => {
    const { fixture, host, el } = setup();
    host.items.set([]);
    fixture.detectChanges();
    expect(el.querySelector('[role="list"]')).toBeFalsy();
    expect(el.querySelector('.kt-chip-list__status')).toBeTruthy();
    expect(el.querySelector('kt-chip-list')?.hasAttribute('data-empty')).toBe(true);
  });

  it('retrait : émet removed, annonce, focus le chip suivant puis le repli quand vide', async () => {
    const { fixture, host, el } = setup();
    removeButtons(el)[0].click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.lastRemoved()).toEqual({ item: 'Pomme', index: 0 });
    expect(statusText(el)).toBe('Pomme removed');
    expect(document.activeElement).toBe(removeButtons(el)[0]); // chip « Banane »

    removeButtons(el)[0].click();
    fixture.detectChanges();
    await fixture.whenStable();
    removeButtons(el)[0].click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.items()).toEqual([]);
    expect(document.activeElement).toBe(host.fallback()?.nativeElement); // plus aucun chip
  });

  it('announce() est public et la live region s’efface après ~2 s', () => {
    vi.useFakeTimers();
    const { fixture, host, el } = setup();
    host.list().announce('3 retirés');
    fixture.detectChanges();
    expect(statusText(el)).toBe('3 retirés');
    vi.advanceTimersByTime(2100);
    fixture.detectChanges();
    expect(statusText(el)).toBe('');
  });

  it('maxVisible : replie, déplie avec focus sur le premier chip révélé, re-replie auto', async () => {
    const { fixture, host, el } = setup();
    host.maxVisible.set(2);
    fixture.detectChanges();
    expect(chipLabels(el)).toEqual(['Pomme', 'Banane']);
    const more = el.querySelector<HTMLButtonElement>('.kt-chip-list__more')!;
    expect(more.textContent?.trim()).toBe('+1 more');
    expect(more.getAttribute('aria-expanded')).toBe('false');

    more.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(chipLabels(el)).toEqual(['Pomme', 'Banane', 'Cerise']);
    expect(el.querySelector('.kt-chip-list__more')?.textContent?.trim()).toBe('Show less');
    expect(document.activeElement).toBe(removeButtons(el)[2]); // 1er chip révélé

    host.items.set(['Pomme']); // repasse sous le seuil → repli automatique (effect)
    fixture.detectChanges();
    expect(el.querySelector('.kt-chip-list__more')).toBeFalsy();
  });

  it('readonly : aucun bouton « retirer » ; disabled : boutons inactifs et retrait bloqué', () => {
    const { fixture, host, el } = setup();
    host.readonly.set(true);
    fixture.detectChanges();
    expect(removeButtons(el)).toEqual([]);

    host.readonly.set(false);
    host.disabled.set(true);
    fixture.detectChanges();
    const btn = removeButtons(el)[0];
    expect(btn.disabled).toBe(true);
    btn.click();
    fixture.detectChanges();
    expect(host.items().length).toBe(3); // garde TS : aucun retrait
  });

  it('template custom projeté (ktChipItem) : rendu custom + remove() fonctionnel', () => {
    TestBed.configureTestingModule({ imports: [CustomTemplateHost] });
    const fixture = TestBed.createComponent(CustomTemplateHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const customs = el.querySelectorAll<HTMLButtonElement>('.custom-chip');
    expect(Array.from(customs).map((c) => c.textContent?.trim())).toEqual(['Ada', 'Linus']);
    expect(el.querySelectorAll('kt-chip').length).toBe(0); // rendu par défaut remplacé
    expect(el.querySelectorAll('[role="listitem"]').length).toBe(2);
    customs[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.removedName()).toBe('Linus');
  });

  it('CHIPS_CONFIG fournit les défauts, les inputs priment', () => {
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        {
          provide: KT_CHIPS_CONFIG,
          useValue: {
            removeItemLabel: (l: string) => `Retirer ${l}`,
            itemRemovedText: (l: string) => `${l} retiré`,
            moreLabel: (n: number) => `+${n} de plus`,
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    host.maxVisible.set(1);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(removeButtons(el)[0].getAttribute('aria-label')).toBe('Retirer Pomme');
    expect(el.querySelector('.kt-chip-list__more')?.textContent?.trim()).toBe('+2 de plus');
    expect(el.querySelector('[role="list"]')?.getAttribute('aria-label')).toBe('Fruits choisis'); // input > config
    removeButtons(el)[0].click();
    fixture.detectChanges();
    expect(statusText(el)).toBe('Pomme retiré');
  });

  it('navigation clavier : flèches droite/gauche/haut/bas, Home et End déplacent le focus', () => {
    const { fixture, el } = setup();
    const btns = removeButtons(el);

    // Focus le premier bouton de suppression
    btns[0].focus();
    expect(document.activeElement).toBe(btns[0]);

    // Flèche droite -> focus bouton suivant
    btns[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(btns[1]);

    // Flèche bas -> focus bouton suivant
    btns[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(btns[2]);

    // Flèche gauche -> focus bouton précédent
    btns[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(btns[1]);

    // Flèche haut -> focus bouton précédent
    btns[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(btns[0]);

    // End -> focus dernier bouton
    btns[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(btns[2]);

    // Home -> focus premier bouton
    btns[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(btns[0]);
  });

  it('roving tabindex : un seul stop de tabulation (tabindex=0), déplacé par les flèches', async () => {
    const { fixture, el } = setup();
    await fixture.whenStable();
    fixture.detectChanges();
    const btns = removeButtons(el);

    // Par défaut, seul le premier bouton est tabbable (point d'entrée clavier unique).
    expect(btns.map((b) => b.tabIndex)).toEqual([0, -1, -1]);

    // Une flèche déplace le point de tabulation (l'ancien repasse à -1).
    btns[0].focus();
    btns[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(btns.map((b) => b.tabIndex)).toEqual([-1, 0, -1]);
  });

  it('template custom : la suppression conserve le focus de manière robuste via requêtage DOM', async () => {
    TestBed.configureTestingModule({ imports: [CustomTemplateHost] });
    const fixture = TestBed.createComponent(CustomTemplateHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const customs = el.querySelectorAll<HTMLButtonElement>('.custom-chip');
    customs[0].focus();
    expect(document.activeElement).toBe(customs[0]);

    // Simule la suppression de Ada (index 0)
    customs[0].click();
    fixture.detectChanges();
    await fixture.whenStable();

    // L'élément restant (Linus) doit recevoir le focus
    const remaining = el.querySelectorAll<HTMLButtonElement>('.custom-chip');
    expect(remaining.length).toBe(1);
    expect(document.activeElement).toBe(remaining[0]);
  });

  it('removable=false retire tous les boutons « retirer » (branche distincte de readonly)', () => {
    const { fixture, host, el } = setup();
    host.removable.set(false);
    fixture.detectChanges();
    expect(removeButtons(el)).toEqual([]);
    expect(host.readonly()).toBe(false); // bien distinct de readonly
  });

  it('le bouton de repli passe à aria-expanded="true" une fois déplié', async () => {
    const { fixture, host, el } = setup();
    host.maxVisible.set(2);
    fixture.detectChanges();
    const more = el.querySelector<HTMLButtonElement>('.kt-chip-list__more')!;
    expect(more.getAttribute('aria-expanded')).toBe('false');

    more.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(el.querySelector('.kt-chip-list__more')!.getAttribute('aria-expanded')).toBe('true');
  });

  it('navigation clavier : franchit du dernier chip visible vers le bouton « +N more »', () => {
    const { fixture, host, el } = setup();
    host.maxVisible.set(2);
    fixture.detectChanges();
    const btns = removeButtons(el);
    const more = el.querySelector<HTMLButtonElement>('.kt-chip-list__more')!;

    btns[1].focus(); // dernier chip visible (Banane)
    btns[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(more);

    more.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(btns[1]);
  });

  it('retrait du DERNIER chip : le focus retombe sur le chip précédent (clamp)', async () => {
    const { fixture, host, el } = setup();
    const last = removeButtons(el)[2]; // Cerise
    last.focus();
    last.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.items()).toEqual(['Pomme', 'Banane']);
    expect(document.activeElement).toBe(removeButtons(el)[1]); // Banane, désormais dernier
  });

  it('dernier chip retiré SANS emptyFocusTarget : aucun vol de focus ni exception', async () => {
    @Component({
      imports: [KtChipList],
      template: `<kt-chip-list [items]="items()" (removed)="items.set([])" />`,
    })
    class NoFallbackHost {
      items = signal<string[]>(['Seul']);
    }
    TestBed.configureTestingModule({ imports: [NoFallbackHost] });
    const fixture = TestBed.createComponent(NoFallbackHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    await expect(
      (async () => {
        removeButtons(el)[0].click();
        fixture.detectChanges();
        await fixture.whenStable();
      })(),
    ).resolves.not.toThrow();
    expect(document.activeElement === document.body || document.activeElement === null).toBe(true);
  });

  it('itemLabel et itemKey fournis comme FONCTIONS (accessor)', () => {
    @Component({
      imports: [KtChipList],
      template: `<kt-chip-list [items]="users()" [itemLabel]="labelOf" [itemKey]="keyOf" />`,
    })
    class FnAccessorHost {
      users = signal([
        { id: 1, name: 'Ada' },
        { id: 2, name: 'Linus' },
      ]);
      labelOf = (u: { id: number; name: string }): string => u.name;
      keyOf = (u: { id: number; name: string }): number => u.id;
    }
    TestBed.configureTestingModule({ imports: [FnAccessorHost] });
    const fixture = TestBed.createComponent(FnAccessorHost);
    fixture.detectChanges();
    expect(chipLabels(fixture.nativeElement)).toEqual(['Ada', 'Linus']);
  });

  it('inputs textuels directs (removeItemLabel/itemRemovedText/moreLabel) priment sans config', () => {
    @Component({
      imports: [KtChipList],
      template: `
        <kt-chip-list
          [items]="items()"
          [maxVisible]="1"
          [removeItemLabel]="removeLbl"
          [itemRemovedText]="removedTxt"
          [moreLabel]="moreLbl"
          (removed)="items.update((i) => i.slice(1))"
        />
      `,
    })
    class DirectTextHost {
      items = signal(['Un', 'Deux', 'Trois']);
      removeLbl = (l: string): string => `Ôter ${l}`;
      removedTxt = (l: string): string => `${l} ôté`;
      moreLbl = (n: number): string => `${n} cachés`;
    }
    TestBed.configureTestingModule({ imports: [DirectTextHost] });
    const fixture = TestBed.createComponent(DirectTextHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(removeButtons(el)[0].getAttribute('aria-label')).toBe('Ôter Un');
    expect(el.querySelector('.kt-chip-list__more')?.textContent?.trim()).toBe('2 cachés');
  });

  // --- Garde WebKit : contournement du bug de compositing des View Transitions sur iOS/Safari ---
  // En jsdom, `startViewTransition` est absente : on la SIMULE présente pour exercer la garde de
  // moteur (le vrai iOS Safari n'est rejoué ni par le webkit de Playwright ni par le mobile-Chromium).
  function stubViewTransitionEngine(vendor: string, svt: unknown): () => void {
    Object.defineProperty(document, 'startViewTransition', { value: svt, configurable: true, writable: true });
    Object.defineProperty(navigator, 'vendor', { value: vendor, configurable: true });
    return () => {
      Reflect.deleteProperty(document, 'startViewTransition');
      Reflect.deleteProperty(navigator, 'vendor');
    };
  }

  it('WebKit : View Transition court-circuitée — retrait direct, jamais nommé (bug compositing iOS)', async () => {
    const svt = vi.fn();
    const restore = stubViewTransitionEngine('Apple Computer, Inc.', svt);
    try {
      const { fixture, host, el } = setup();
      removeButtons(el)[0].click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(svt).not.toHaveBeenCalled(); // API présente mais sautée sur WebKit
      expect(host.list().transitioning()).toBe(false); // jamais de nommage → pas de croix orphelines
      expect(host.items()).toEqual(['Banane', 'Cerise']); // état final correct
      expect(chipLabels(el)).toEqual(['Banane', 'Cerise']); // DOM cohérent (pilules bien retirées)
    } finally {
      restore();
    }
  });

  it('WebKit : déplier/replier aussi court-circuité (même wrapper que le retrait)', async () => {
    const svt = vi.fn();
    const restore = stubViewTransitionEngine('Apple Computer, Inc.', svt);
    try {
      const { fixture, host, el } = setup();
      host.maxVisible.set(2);
      fixture.detectChanges();
      const more = el.querySelector<HTMLButtonElement>('.kt-chip-list__more')!;

      more.click(); // déplie
      fixture.detectChanges();
      await fixture.whenStable();

      expect(svt).not.toHaveBeenCalled();
      expect(host.list().transitioning()).toBe(false);
      expect(chipLabels(el)).toEqual(['Pomme', 'Banane', 'Cerise']); // dépli correct, sans animation
    } finally {
      restore();
    }
  });

  it('moteur non-WebKit : la View Transition est empruntée quand startViewTransition existe', async () => {
    const svt = vi.fn((update: () => unknown) => {
      const done = Promise.resolve(update()).then(() => undefined);
      return { ready: done, finished: done, updateCallbackDone: done, skipTransition: (): void => undefined };
    });
    const restore = stubViewTransitionEngine('Google Inc.', svt); // Blink
    try {
      const { fixture, host, el } = setup();
      removeButtons(el)[0].click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(svt).toHaveBeenCalledTimes(1); // VT bien empruntée hors WebKit
      expect(host.items()).toEqual(['Banane', 'Cerise']); // état final correct dans les deux chemins
    } finally {
      restore();
    }
  });

  it('[chipTemplate] forwardé rend le contenu custom ; un ktChipItem projeté est prioritaire', () => {
    // chipTemplate seul
    @Component({
      imports: [KtChipList],
      template: `
        <kt-chip-list [items]="items()" [chipTemplate]="fwd()" />
        <ng-template #fwdTpl let-item
          ><span class="forwarded">{{ item }}</span></ng-template
        >
      `,
    })
    class ForwardedHost {
      items = signal(['A', 'B']);
      fwd = viewChild.required<TemplateRef<KtChipItemContext<string>>>('fwdTpl');
    }
    TestBed.configureTestingModule({ imports: [ForwardedHost] });
    let fixture: ComponentFixture<unknown> = TestBed.createComponent(ForwardedHost);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.forwarded').length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('kt-chip').length).toBe(0);

    // projeté + forwardé : le projeté gagne
    @Component({
      imports: [KtChipList, KtChipItemDef],
      template: `
        <kt-chip-list [items]="items()" [chipTemplate]="fwd()">
          <ng-template [ktChipItem]="items()" let-item
            ><span class="projected">{{ item }}</span></ng-template
          >
        </kt-chip-list>
        <ng-template #fwdTpl let-item
          ><span class="forwarded">{{ item }}</span></ng-template
        >
      `,
    })
    class BothHost {
      items = signal(['A', 'B']);
      fwd = viewChild.required<TemplateRef<KtChipItemContext<string>>>('fwdTpl');
    }
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [BothHost] });
    fixture = TestBed.createComponent(BothHost);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.projected').length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('.forwarded').length).toBe(0);
  });
});
