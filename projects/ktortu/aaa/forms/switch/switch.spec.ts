import { Component, Type, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ValidationError } from '@angular/forms/signals';
import { KtFieldErrorMatcher } from '../field/field-config';
import { KtSwitch } from './switch';

@Component({
  imports: [KtSwitch],
  template: `
    <kt-switch
      [(value)]="value"
      [label]="label()"
      [hint]="hint()"
      [errors]="errors()"
      [invalid]="invalid()"
      [disabled]="disabled()"
      [required]="required()"
      [errorMatcher]="errorMatcher()"
      [pending]="pending()"
      [ariaLabel]="ariaLabel()"
      [showAllErrors]="showAllErrors()"
    />
  `,
})
class SwitchHost {
  value = signal(false);
  label = signal<string | undefined>('Activer notifications');
  hint = signal<string | undefined>('Recommandé');
  errors = signal<readonly ValidationError[]>([]);
  invalid = signal(false);
  disabled = signal(false);
  required = signal(false);
  errorMatcher = signal<KtFieldErrorMatcher | undefined>(undefined);
  pending = signal(false);
  ariaLabel = signal<string | undefined>(undefined);
  showAllErrors = signal(false);
}

describe('Switch', () => {
  let fixture: ComponentFixture<SwitchHost>;
  let host: SwitchHost;
  let el: HTMLElement;

  function setup(): void {
    TestBed.configureTestingModule({ imports: [SwitchHost] });
    fixture = TestBed.createComponent(SwitchHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  }

  function button(): HTMLButtonElement {
    return el.querySelector('button[role="switch"]')!;
  }

  function labelElement(): HTMLLabelElement | null {
    return el.querySelector('label.kt-switch-label');
  }

  function errorContainer(): HTMLElement | null {
    return el.querySelector('.kt-switch-error-message');
  }

  function hintElement(): HTMLElement | null {
    return el.querySelector('.kt-switch-hint');
  }

  beforeEach(() => setup());

  it('renders a switch button and a label with ARIA markup', () => {
    expect(button()).toBeTruthy();
    expect(button().getAttribute('role')).toBe('switch');
    expect(button().getAttribute('aria-checked')).toBe('false');
    expect(labelElement()?.textContent).toContain('Activer notifications');
    expect(button().getAttribute('aria-labelledby')).toBe(labelElement()?.id);
  });

  it('reflects the bound value into aria-checked', () => {
    host.value.set(true);
    fixture.detectChanges();
    expect(button().getAttribute('aria-checked')).toBe('true');
  });

  it('toggles the bound value on click', () => {
    button().click();
    fixture.detectChanges();
    expect(host.value()).toBe(true);
    expect(button().getAttribute('aria-checked')).toBe('true');
    expect(internals().touched()).toBe(true);
  });

  it('toggles the bound value on label click', () => {
    labelElement()!.click();
    fixture.detectChanges();
    expect(host.value()).toBe(true);
    expect(internals().touched()).toBe(true);
  });

  it('toggles on Spacebar keypress and prevents default scroll behavior', () => {
    const event = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
    vi.spyOn(event, 'preventDefault');

    button().dispatchEvent(event);
    fixture.detectChanges();

    expect(host.value()).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('does not toggle when disabled', () => {
    host.disabled.set(true);
    fixture.detectChanges();
    expect(button().disabled).toBe(true);

    button().click();
    fixture.detectChanges();
    expect(host.value()).toBe(false);

    labelElement()!.click();
    fixture.detectChanges();
    expect(host.value()).toBe(false);
  });

  it('renders a required marker when required input is true', () => {
    host.required.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.kt-switch-label__required')).toBeTruthy();
  });

  it('focuses the switch button via focus() (Signal Forms focusBoundControl)', () => {
    internals().focus();
    expect(document.activeElement).toBe(button());
  });

  it('reflects the pending state via aria-busy and data-pending', () => {
    host.pending.set(true);
    fixture.detectChanges();
    expect(button().getAttribute('aria-busy')).toBe('true');
    expect(el.querySelector('.kt-switch-field')?.getAttribute('data-pending')).toBe('');
  });

  it('renders a hint when provided', () => {
    expect(hintElement()?.textContent).toContain('Recommandé');
  });

  it('does not mark invalid or show errors before the control is touched', () => {
    host.invalid.set(true);
    host.errors.set([{ kind: 'required', message: 'Veuillez cocher cette case' }]);
    fixture.detectChanges();

    expect(button().getAttribute('aria-invalid')).not.toBe('true');
    expect(errorContainer()).toBeNull();
    expect(hintElement()).toBeTruthy();
  });

  it('marks invalid and shows errors after interaction (touched)', () => {
    host.invalid.set(true);
    host.errors.set([{ kind: 'required', message: 'Veuillez cocher cette case' }]);

    // Simule une interaction en cliquant
    button().click();
    fixture.detectChanges();

    expect(button().getAttribute('aria-invalid')).toBe('true');
    expect(errorContainer()?.textContent).toContain('Veuillez cocher cette case');
    expect(hintElement()).toBeNull(); // Cache le hint en cas d'erreur
  });

  it('shows errors immediately with a custom errorMatcher', () => {
    host.errorMatcher.set((s) => s.invalid);
    host.invalid.set(true);
    host.errors.set([{ kind: 'required', message: 'Veuillez cocher cette case' }]);
    fixture.detectChanges();

    expect(button().getAttribute('aria-invalid')).toBe('true');
    expect(errorContainer()?.textContent).toContain('Veuillez cocher cette case');
  });

  it('câble aria-describedby vers le hint puis bascule vers l’erreur', () => {
    const id = button().id;
    expect(button().getAttribute('aria-describedby')).toBe(`${id}-hint`);

    host.errorMatcher.set((s) => s.invalid);
    host.invalid.set(true);
    host.errors.set([{ kind: 'required', message: 'Requis' }]);
    fixture.detectChanges();
    const describedBy = button().getAttribute('aria-describedby') ?? '';
    expect(describedBy).toContain(`${id}-error`);
    expect(describedBy).not.toContain(`${id}-hint`);
  });

  it('pose aria-required="true" si required, sinon l’attribut est absent', () => {
    expect(button().hasAttribute('aria-required')).toBe(false);
    host.required.set(true);
    fixture.detectChanges();
    expect(button().getAttribute('aria-required')).toBe('true');
  });

  it('repli sur aria-label quand ariaLabel fourni (aria-labelledby retiré ; label présent mais vide)', () => {
    host.label.set(undefined);
    host.ariaLabel.set('Activer les notifications');
    fixture.detectChanges();
    expect(button().getAttribute('aria-label')).toBe('Activer les notifications');
    expect(button().hasAttribute('aria-labelledby')).toBe(false);
    // Le <label> reste dans le DOM pour accueillir un contenu projeté, mais sans texte (masqué via :empty).
    expect(labelElement()).toBeTruthy();
    expect(labelElement()?.textContent?.trim()).toBe('');
  });

  it('suppression message:"" — invalide sans texte, et errorId hors describedby', () => {
    host.errorMatcher.set((s) => s.invalid);
    host.invalid.set(true);
    host.errors.set([{ kind: 'required', message: '' }]);
    fixture.detectChanges();
    expect(button().getAttribute('aria-invalid')).toBe('true');
    expect(el.querySelector('.kt-switch-field')!.classList.contains('kt-switch-field--invalid')).toBe(true);
    expect(errorContainer()).toBeNull();
    expect(button().getAttribute('aria-describedby') ?? '').not.toContain('-error');
  });

  it('résout le message par défaut quand le validateur n’en fournit pas', () => {
    host.errorMatcher.set((s) => s.invalid);
    host.invalid.set(true);
    host.errors.set([{ kind: 'required' }]);
    fixture.detectChanges();
    expect(errorContainer()?.textContent).toContain('This field is required.');
  });

  it('showAllErrors : une seule erreur par défaut, toutes avec le flag', () => {
    host.errorMatcher.set((s) => s.invalid);
    host.invalid.set(true);
    host.errors.set([
      { kind: 'required', message: 'Requis' },
      { kind: 'custom', message: 'Autre' },
    ]);
    fixture.detectChanges();
    expect(el.querySelectorAll('.kt-switch-error-message').length).toBe(1);
    host.showAllErrors.set(true);
    fixture.detectChanges();
    expect(el.querySelectorAll('.kt-switch-error-message').length).toBe(2);
  });

  it('blur marque touched et révèle l’erreur sans clic', () => {
    host.invalid.set(true);
    host.errors.set([{ kind: 'required', message: 'Requis' }]);
    fixture.detectChanges();
    expect(button().getAttribute('aria-invalid')).not.toBe('true');

    button().dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(button().getAttribute('aria-invalid')).toBe('true');
    expect(errorContainer()?.textContent).toContain('Requis');
  });

  it('Spacebar ne bascule PAS quand disabled', () => {
    host.disabled.set(true);
    fixture.detectChanges();
    button().dispatchEvent(new KeyboardEvent('keydown', { key: ' ', cancelable: true }));
    fixture.detectChanges();
    expect(host.value()).toBe(false);
  });

  describe('contenu projeté (ng-content)', () => {
    @Component({
      imports: [KtSwitch],
      template: `<kt-switch [(value)]="v"><img alt="" width="16" height="16" /><span>Notifications</span></kt-switch>`,
    })
    class ProjectedHost {
      v = signal(false);
    }

    @Component({
      imports: [KtSwitch],
      template: `<kt-switch label="Ignoré"><span>Projeté</span></kt-switch>`,
    })
    class ProjectedOverLabelHost {}

    function make<T>(type: Type<T>): ComponentFixture<T> {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ imports: [type] });
      const f = TestBed.createComponent(type);
      f.detectChanges();
      return f;
    }

    it('projette un contenu riche (image + texte) et nomme le switch par ce contenu', () => {
      const f = make(ProjectedHost);
      const label = f.nativeElement.querySelector('label.kt-switch-label') as HTMLLabelElement;
      const btn = f.nativeElement.querySelector('button[role="switch"]') as HTMLButtonElement;

      expect(label.querySelector('img')).toBeTruthy();
      expect(label.textContent).toContain('Notifications');
      // Sans ariaLabel : le nom accessible vient du label (contenu projeté) via aria-labelledby.
      expect(btn.getAttribute('aria-labelledby')).toBe(label.id);
      expect(btn.hasAttribute('aria-label')).toBe(false);
      f.destroy();
    });

    it('le contenu projeté prime sur le label texte', () => {
      const f = make(ProjectedOverLabelHost);
      const label = f.nativeElement.querySelector('label.kt-switch-label') as HTMLLabelElement;

      expect(label.textContent).toContain('Projeté');
      expect(label.textContent).not.toContain('Ignoré');
      f.destroy();
    });
  });

  it("n'expose l'id que sur le bouton interne lors d'un passage en attribut statique", () => {
    @Component({
      imports: [KtSwitch],
      template: `<kt-switch id="switch-notif" label="Notifications" />`,
    })
    class StaticIdSwitchHost {}

    const staticFixture = TestBed.createComponent(StaticIdSwitchHost);
    staticFixture.detectChanges();
    const staticEl = staticFixture.nativeElement as HTMLElement;
    const switchHostEl = staticEl.querySelector('kt-switch')!;
    const btnEl = staticEl.querySelector('button[role="switch"]')!;
    const labelEl = staticEl.querySelector('label')!;

    expect(switchHostEl.hasAttribute('id')).toBe(false);
    expect(btnEl.getAttribute('id')).toBe('switch-notif');
    expect(staticEl.querySelectorAll('#switch-notif').length).toBe(1);
    expect(labelEl.getAttribute('for')).toBe('switch-notif');
  });

  // Accès aux coulisses pour valider les signaux internes
  function internals(): KtSwitch {
    return fixture.debugElement.query((de) => de.componentInstance instanceof KtSwitch).componentInstance as KtSwitch;
  }
});
