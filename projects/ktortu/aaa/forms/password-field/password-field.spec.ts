import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KtPasswordField, KtPasswordAutocomplete } from './password-field';

@Component({
  imports: [KtPasswordField],
  template: `
    <kt-password-field
      [(value)]="value"
      [label]="label()"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [autocomplete]="autocomplete()"
    />
  `,
})
class PasswordFieldHost {
  value = signal('');
  label = signal<string | undefined>('Mot de passe');
  disabled = signal(false);
  readonly = signal(false);
  autocomplete = signal<KtPasswordAutocomplete | undefined>(undefined);
}

describe('PasswordField', () => {
  let fixture: ComponentFixture<PasswordFieldHost>;
  let host: PasswordFieldHost;
  let el: HTMLElement;

  function setup(): void {
    TestBed.configureTestingModule({ imports: [PasswordFieldHost] });
    fixture = TestBed.createComponent(PasswordFieldHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  }

  function input(): HTMLInputElement {
    return el.querySelector('input')!;
  }

  function toggleButton(): HTMLButtonElement {
    return el.querySelector('.kt-field-box__toggle')!;
  }

  beforeEach(() => setup());

  it('renders an input of type password by default', () => {
    expect(input()).toBeTruthy();
    expect(input().getAttribute('type')).toBe('password');
    expect(el.querySelector('label')?.textContent).toContain('Mot de passe');
  });

  it('renders a visibility toggle button with correct initial aria attributes', () => {
    const btn = toggleButton();
    expect(btn).toBeTruthy();
    expect(btn.getAttribute('type')).toBe('button');
    expect(btn.getAttribute('aria-label')).toBe('Afficher le mot de passe');
    expect(btn.getAttribute('aria-controls')).toBe(input().id);
    expect(btn.querySelector('.kt-field-box__icon')?.textContent?.trim()).toBe('visibility');
  });

  it('toggles visibility type on mousedown and updates button attributes', () => {
    const btn = toggleButton();

    // Simuler le mousedown
    const mousedownEvent = new MouseEvent('mousedown', { cancelable: true });
    btn.dispatchEvent(mousedownEvent);
    fixture.detectChanges();

    // Doit passer à text
    expect(input().getAttribute('type')).toBe('text');
    expect(btn.getAttribute('aria-label')).toBe('Masquer le mot de passe');
    expect(btn.querySelector('.kt-field-box__icon')?.textContent?.trim()).toBe('visibility_off');
    expect(mousedownEvent.defaultPrevented).toBe(true);

    // Deuxième mousedown pour repasser à password
    const mousedownEvent2 = new MouseEvent('mousedown', { cancelable: true });
    btn.dispatchEvent(mousedownEvent2);
    fixture.detectChanges();

    expect(input().getAttribute('type')).toBe('password');
    expect(btn.getAttribute('aria-label')).toBe('Afficher le mot de passe');
    expect(btn.querySelector('.kt-field-box__icon')?.textContent?.trim()).toBe('visibility');
  });

  it('preserves focus on the input element when clicking the toggle button', () => {
    input().focus();
    expect(document.activeElement).toBe(input());

    const btn = toggleButton();
    const mousedownEvent = new MouseEvent('mousedown', { cancelable: true });
    btn.dispatchEvent(mousedownEvent);
    fixture.detectChanges();

    // Le focus doit rester sur l'input grâce au preventDefault()
    expect(document.activeElement).toBe(input());
  });

  it('defaults autocomplete to current-password', () => {
    expect(input().getAttribute('autocomplete')).toBe('current-password');
  });

  it('supports other autocomplete configurations', () => {
    host.autocomplete.set('new-password');
    fixture.detectChanges();
    expect(input().getAttribute('autocomplete')).toBe('new-password');

    host.autocomplete.set('off');
    fixture.detectChanges();
    expect(input().getAttribute('autocomplete')).toBe('off');
  });

  it('disables the toggle button when component is disabled or readonly', () => {
    const btn = toggleButton();
    expect(btn.disabled).toBe(false);

    host.disabled.set(true);
    fixture.detectChanges();
    expect(btn.disabled).toBe(true);

    host.disabled.set(false);
    host.readonly.set(true);
    fixture.detectChanges();
    expect(btn.disabled).toBe(true);
  });
});
