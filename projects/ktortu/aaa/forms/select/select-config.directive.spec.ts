import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { KT_SELECT_CONFIG, KtSelectConfigOptions } from './select-config';
import { KtSelectConfig } from './select-config.directive';

@Component({
  imports: [KtSelectConfig],
  template: `<div [ktSelectConfig]="local()"></div>`,
})
class Host {
  local = signal<Partial<KtSelectConfigOptions>>({});
}

describe('KtSelectConfig (directive de config par sous-arbre)', () => {
  /** Monte le host (avec un éventuel KT_SELECT_CONFIG parent) et renvoie la VUE vue par un descendant
      (le Proxy fourni par la directive via useFactory). */
  function setup(parent?: Partial<KtSelectConfigOptions>): {
    host: Host;
    provided: Partial<KtSelectConfigOptions>;
    detect: () => void;
  } {
    TestBed.configureTestingModule({
      imports: [Host],
      providers: parent ? [{ provide: KT_SELECT_CONFIG, useValue: parent }] : [],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const debugEl = fixture.debugElement.query(By.directive(KtSelectConfig));
    return {
      host: fixture.componentInstance,
      provided: debugEl.injector.get(KT_SELECT_CONFIG),
      detect: () => fixture.detectChanges(),
    };
  }

  it('expose la valeur bindée sur la directive (vue Partial via Proxy)', () => {
    const { host, provided, detect } = setup();
    host.local.set({ placeholder: 'Choisir…', emptyText: 'Aucun résultat' });
    detect();
    expect(provided.placeholder).toBe('Choisir…');
    expect(provided.emptyText).toBe('Aucun résultat');
  });

  it('hérite du contexte parent (skipSelf) pour les clés non bindées', () => {
    const { host, provided, detect } = setup({ placeholder: 'Parent', emptyText: 'Parent vide' });
    host.local.set({ placeholder: 'Local' }); // ne surcharge QUE placeholder
    detect();
    expect(provided.placeholder).toBe('Local'); // la valeur bindée prime
    expect(provided.emptyText).toBe('Parent vide'); // le reste continue d'hériter
  });

  it('renvoie undefined pour une clé ni bindée ni héritée', () => {
    const { provided } = setup();
    expect(provided.placeholder).toBeUndefined();
  });
});
