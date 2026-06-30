import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KtChip } from './chip';

@Component({
  imports: [KtChip],
  template: `
    <kt-chip
      #chip
      [removable]="removable()"
      [disabled]="disabled()"
      removeLabel="Remove Banana"
      (remove)="removed.set(removed() + 1)"
      >Banana</kt-chip
    >
  `,
})
class Host {
  removable = signal(false);
  disabled = signal(false);
  removed = signal(0);
  chip = viewChild.required<KtChip>('chip');
}

describe('Chip', () => {
  function setup() {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return { fixture, host: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
  }

  it('rend le label projeté dans une pilule, sans bouton par défaut (tag statique)', () => {
    const { el } = setup();
    const chip = el.querySelector('kt-chip')!;
    expect(chip.classList.contains('kt-chip')).toBe(true);
    expect(chip.querySelector('.kt-chip__label')?.textContent?.trim()).toBe('Banana');
    expect(chip.querySelector('.kt-chip__remove')).toBeFalsy();
  });

  it('removable : bouton « retirer » avec libellé accessible, le clic émet remove', () => {
    const { fixture, host, el } = setup();
    host.removable.set(true);
    fixture.detectChanges();
    const btn = el.querySelector<HTMLButtonElement>('.kt-chip__remove')!;
    expect(btn.getAttribute('aria-label')).toBe('Remove Banana');
    btn.click();
    expect(host.removed()).toBe(1);
  });

  it('disabled : le bouton est rendu mais inactif', () => {
    const { fixture, host, el } = setup();
    host.removable.set(true);
    host.disabled.set(true);
    fixture.detectChanges();
    const btn = el.querySelector<HTMLButtonElement>('.kt-chip__remove')!;
    expect(btn.disabled).toBe(true);
  });

  it('focusRemove() focalise le bouton « retirer »', () => {
    const { fixture, host, el } = setup();
    host.removable.set(true);
    fixture.detectChanges();
    host.chip().focusRemove();
    expect(document.activeElement).toBe(el.querySelector('.kt-chip__remove'));
  });

  it('removeLabel par défaut = "Remove" quand le consommateur n’en fournit pas', () => {
    @Component({ imports: [KtChip], template: `<kt-chip removable>Banana</kt-chip>` })
    class DefaultLabelHost {}
    TestBed.configureTestingModule({ imports: [DefaultLabelHost] });
    const fixture = TestBed.createComponent(DefaultLabelHost);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.kt-chip__remove')!;
    expect(btn.getAttribute('aria-label')).toBe('Remove');
  });

  it('l’icône « close » visible est aria-hidden (nom accessible = aria-label seul)', () => {
    const { fixture, host, el } = setup();
    host.removable.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.kt-chip__close-icon')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('clic sur le bouton retirer d’un chip désactivé : aucune émission de remove', () => {
    const { fixture, host, el } = setup();
    host.removable.set(true);
    host.disabled.set(true);
    fixture.detectChanges();
    el.querySelector<HTMLButtonElement>('.kt-chip__remove')!.click();
    expect(host.removed()).toBe(0);
  });

  it('chip hors liste (sans ChipTransitionScope) : view-transition-name résolu à null', () => {
    const { el } = setup();
    const chip = el.querySelector('kt-chip') as HTMLElement;
    expect(chip.style.getPropertyValue('view-transition-name')).toBe('');
  });
});
