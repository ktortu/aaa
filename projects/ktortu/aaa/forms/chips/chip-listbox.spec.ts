import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KtChip } from './chip';
import { KtChipListbox } from './chip-listbox';

@Component({
  imports: [KtChipListbox, KtChip],
  template: `
    <kt-chip-listbox
      [(value)]="value"
      [multiple]="multiple()"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [label]="label()"
    >
      <kt-chip value="tech">Tech</kt-chip>
      <kt-chip value="design">Design</kt-chip>
      <kt-chip value="data">Data</kt-chip>
    </kt-chip-listbox>
  `,
})
class ListboxHost {
  value = signal<string | string[] | null>('tech');
  multiple = signal(false);
  disabled = signal(false);
  readonly = signal(false);
  label = signal<string | undefined>('Filtres');
}

describe('ChipListbox', () => {
  function getOptions(el: HTMLElement): HTMLElement[] {
    return Array.from(el.querySelectorAll('.kt-chip'));
  }

  function setup() {
    TestBed.configureTestingModule({ imports: [ListboxHost] });
    const fixture = TestBed.createComponent(ListboxHost);
    const host = fixture.componentInstance;
    const el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    return { fixture, host, el };
  }

  it('rend un rôle listbox sur le conteneur et option sur chaque puce', () => {
    const { el } = setup();
    const listbox = el.querySelector('[role="listbox"]')!;
    expect(listbox).toBeTruthy();

    const options = getOptions(el);
    expect(options.length).toBe(3);
    expect(options[0].getAttribute('aria-selected')).toBe('true');
    expect(options[1].getAttribute('aria-selected')).toBe('false');
  });

  it('applique la classe de sélection kt-chip--selected sur le chip sélectionné', () => {
    const { el } = setup();
    const options = getOptions(el);
    expect(options[0].classList.contains('kt-chip--selected')).toBe(true);
    expect(options[1].classList.contains('kt-chip--selected')).toBe(false);
  });

  it('gère la sélection simple : cliquer sur une autre puce décoche la précédente', async () => {
    const { fixture, host, el } = setup();
    const options = getOptions(el);

    options[1].click();
    fixture.detectChanges();
    // Attendre la stabilisation complète de la fixture (en zoneless, flusher les microtâches et les effets)
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.value()).toBe('design');
    expect(options[0].getAttribute('aria-selected')).toBe('false');
    expect(options[0].classList.contains('kt-chip--selected')).toBe(false);
    expect(options[1].getAttribute('aria-selected')).toBe('true');
    expect(options[1].classList.contains('kt-chip--selected')).toBe(true);
  });

  it('gère la sélection multiple si multiple est vrai', async () => {
    const { fixture, host, el } = setup();
    host.multiple.set(true);
    host.value.set(['tech']);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const options = getOptions(el);
    expect(options[0].getAttribute('aria-selected')).toBe('true');
    expect(options[1].getAttribute('aria-selected')).toBe('false');

    options[1].click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.value()).toEqual(['tech', 'design']);
    expect(options[0].getAttribute('aria-selected')).toBe('true');
    expect(options[1].getAttribute('aria-selected')).toBe('true');
  });

  it('ignore les clics si disabled ou readonly est vrai', async () => {
    const { fixture, host, el } = setup();
    host.disabled.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const options = getOptions(el);
    options[1].click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.value()).toBe('tech');
    expect(options[1].getAttribute('aria-selected')).toBe('false');
  });
});
