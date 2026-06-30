import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KtIdGenerator } from './id-generator';

describe('KtIdGenerator', () => {
  it('produit une séquence déterministe depuis un injecteur frais (serveur ⇄ client)', () => {
    // Garde anti-régression hydratation : un rendu serveur puis une hydratation client partent
    // chacun d'un injecteur racine NEUF (providedIn: 'root') et rejouent l'arbre dans le MÊME
    // ordre. Pour un même ordre d'appels, les deux doivent produire EXACTEMENT les mêmes
    // identifiants — sinon `aria-labelledby`/`for`/`id` divergeraient à l'hydratation.
    const render = () => {
      const gen = new KtIdGenerator();
      return [gen.generateId('checkbox'), gen.generateId('checkbox'), gen.generateId('field')];
    };
    expect(render()).toEqual(render());
  });

  it('isole les compteurs par préfixe (chacun démarre à 0)', () => {
    const gen = new KtIdGenerator();
    expect(gen.generateId('a')).toBe(0);
    expect(gen.generateId('b')).toBe(0);
    expect(gen.generateId('a')).toBe(1);
  });

  it('le compteur global (sans préfixe) s’incrémente à partir de 0', () => {
    const gen = new KtIdGenerator();
    expect(gen.generateId()).toBe(0);
    expect(gen.generateId()).toBe(1);
    expect(gen.generateId()).toBe(2);
  });

  it('rend des id stables entre deux bootstraps (mime SSR puis hydratation)', () => {
    @Component({ template: `<span [id]="id">x</span>` })
    class IdHost {
      readonly id = `kt-${inject(KtIdGenerator).generateId('demo')}`;
    }

    const idOf = () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ imports: [IdHost] });
      const fixture = TestBed.createComponent(IdHost);
      fixture.detectChanges();
      return (fixture.nativeElement.querySelector('span') as HTMLElement).id;
    };

    const serverRender = idOf();
    const clientHydration = idOf();
    expect(clientHydration).toBe(serverRender);
    expect(serverRender).toMatch(/^kt-\d+$/);
  });
});
