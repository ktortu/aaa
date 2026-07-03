import { Component, signal, TemplateRef, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { KtField, KtFieldError } from './field';
import { KtFieldControl } from './field-control';
import { KtFieldAppearance, KtFloatLabel, provideKtField } from './field-config';
import { KtFieldHarness } from './field.harness';

@Component({
  imports: [KtField, KtFieldControl],
  template: `
    <kt-field
      [label]="label()"
      [hint]="hint()"
      [errors]="errors()"
      [invalid]="invalid()"
      [required]="required()"
      [fieldId]="fieldId()"
      [hideHintWhenInvalid]="hideHintWhenInvalid()"
      [showAllErrors]="showAllErrors()"
      [hideLabel]="hideLabel()"
      [hideErrors]="hideErrors()"
      [helpText]="helpText()"
      [helpLabel]="helpLabel()"
      [customDescribedBy]="customDescribedBy()"
      [appearance]="appearance()"
      [floatLabel]="floatLabel()"
      (helpClick)="onHelpClick($event)"
    >
      <input ktFieldControl />
      <ng-template #tplHelp>
        <span>Information d'aide</span>
      </ng-template>
    </kt-field>
  `,
})
class FieldHost {
  label = signal<string | undefined>('Nom');
  hint = signal<string | undefined>(undefined);
  errors = signal<readonly KtFieldError[]>([]);
  invalid = signal(false);
  required = signal(false);
  fieldId = signal<string | undefined>(undefined);
  hideHintWhenInvalid = signal(false);
  showAllErrors = signal(false);
  hideLabel = signal(false);
  hideErrors = signal(false);
  helpText = signal<string | TemplateRef<unknown> | undefined>(undefined);
  helpLabel = signal<string>('Aide');
  customDescribedBy = signal<string | undefined>(undefined);
  appearance = signal<KtFieldAppearance | undefined>(undefined);
  floatLabel = signal<KtFloatLabel | undefined>(undefined);
  tplHelp = viewChild.required<TemplateRef<unknown>>('tplHelp');

  lastHelpEvent: MouseEvent | null = null;
  onHelpClick(event: MouseEvent): void {
    this.lastHelpEvent = event;
  }
}

describe('Field', () => {
  let fixture: ComponentFixture<FieldHost>;
  let host: FieldHost;
  let el: HTMLElement;

  function setup(): void {
    TestBed.configureTestingModule({ imports: [FieldHost] });
    fixture = TestBed.createComponent(FieldHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  }

  function input(): HTMLInputElement {
    return el.querySelector('input')!;
  }

  /** Charge le harness du champ (comportement observable par le DOM ; cf. règle de cohabitation). */
  function fieldHarness(): Promise<KtFieldHarness> {
    return TestbedHarnessEnvironment.loader(fixture).getHarness(KtFieldHarness);
  }

  beforeEach(() => setup());

  it('associates the label with the control via for/id', () => {
    const id = input().getAttribute('id');
    expect(id).toBeTruthy();
    expect(el.querySelector('label')!.getAttribute('for')).toBe(id);
  });

  it('uses a custom fieldId as the deterministic id base', () => {
    host.fieldId.set('email-field');
    fixture.detectChanges();
    expect(input().getAttribute('id')).toBe('email-field');
    expect(el.querySelector('label')!.getAttribute('for')).toBe('email-field');
  });

  it('does not set aria-describedby without hint or error', () => {
    expect(input().hasAttribute('aria-describedby')).toBe(false);
  });

  it('wires aria-describedby to the hint', () => {
    host.hint.set('Indice');
    fixture.detectChanges();
    const id = input().getAttribute('id')!;
    expect(el.querySelector('.kt-field__hint')!.getAttribute('id')).toBe(`${id}-hint`);
    expect(input().getAttribute('aria-describedby')).toContain(`${id}-hint`);
  });

  it('reflects required on the control and shows the marker', async () => {
    host.required.set(true);
    const field = await fieldHarness();
    expect(await field.isRequired()).toBe(true);
    expect(input().getAttribute('aria-required')).toBe('true');
  });

  it('shows errors and wires aria-invalid + describedby when invalid', async () => {
    host.invalid.set(true);
    host.errors.set([{ kind: 'required', message: 'Requis' }]);
    const field = await fieldHarness();
    expect(await field.getErrorMessages()).toEqual(['Requis']);
    const id = input().getAttribute('id')!;
    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(input().getAttribute('aria-describedby')).toContain(`${id}-error`);
    expect(el.querySelector('.kt-field__error')!.getAttribute('aria-live')).toBe('polite');
  });

  it('marks aria-invalid even without messages, but adds no error describedby', () => {
    host.invalid.set(true);
    fixture.detectChanges();
    const id = input().getAttribute('id')!;
    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(input().getAttribute('aria-describedby') ?? '').not.toContain(`${id}-error`);
  });

  it('shows only the first error by default', async () => {
    host.invalid.set(true);
    host.errors.set([
      { kind: 'required', message: 'Requis' },
      { kind: 'minlength', message: 'Trop court' },
    ]);
    const field = await fieldHarness();
    expect(await field.getErrorMessages()).toEqual(['Requis']);
  });

  it('shows all errors when showAllErrors is set', async () => {
    host.showAllErrors.set(true);
    host.invalid.set(true);
    host.errors.set([
      { kind: 'required', message: 'Requis' },
      { kind: 'minlength', message: 'Trop court' },
    ]);
    const field = await fieldHarness();
    expect(await field.getErrorMessages()).toEqual(['Requis', 'Trop court']);
  });

  it('hides the hint on error when hideHintWhenInvalid is set, and drops it from describedby', () => {
    host.hint.set('Indice');
    host.hideHintWhenInvalid.set(true);
    host.invalid.set(true);
    host.errors.set([{ kind: 'required', message: 'Requis' }]);
    fixture.detectChanges();
    const id = input().getAttribute('id')!;
    expect(el.querySelector('.kt-field__hint')).toBeNull();
    expect(input().getAttribute('aria-describedby') ?? '').not.toContain(`${id}-hint`);
  });

  it('renders a help button when helpText is set', () => {
    expect(el.querySelector('.kt-field__help')).toBeNull();
    host.helpText.set("Consignes d'aide");
    fixture.detectChanges();
    const helpBtn = el.querySelector('.kt-field__help')!;
    expect(helpBtn).toBeTruthy();
    expect(helpBtn.getAttribute('aria-label')).toBe('Aide');
  });

  it('uses custom helpLabel on the help button', () => {
    host.helpText.set("Consignes d'aide");
    host.helpLabel.set('Information complémentaire');
    fixture.detectChanges();
    const helpBtn = el.querySelector('.kt-field__help')!;
    expect(helpBtn.getAttribute('aria-label')).toBe('Information complémentaire');
  });

  it('wires help text to an always-present description node (no dangling reference)', () => {
    host.helpText.set("Consignes d'aide");
    fixture.detectChanges();
    const helpId = `${input().id}-help`;
    expect(input().getAttribute('aria-describedby') ?? '').toContain(helpId);
    // La cible existe RÉELLEMENT dans le DOM (pas de référence pendante) et porte le texte d'aide,
    // même si la bulle visuelle du tooltip n'est pas affichée.
    const desc = el.querySelector(`#${helpId}`);
    expect(desc).toBeTruthy();
    expect(desc!.textContent).toContain("Consignes d'aide");
  });

  it('appends customDescribedBy to aria-describedby', () => {
    host.customDescribedBy.set('aide-externe');
    fixture.detectChanges();
    const describedBy = input().getAttribute('aria-describedby') ?? '';
    expect(describedBy).toContain('aide-externe');

    host.helpText.set("Consignes d'aide");
    fixture.detectChanges();
    const describedByWithBoth = input().getAttribute('aria-describedby') ?? '';
    expect(describedByWithBoth).toContain('aide-externe');
    expect(describedByWithBoth).toContain(`${input().id}-help`);
  });

  it('supports TemplateRef as helpText', () => {
    host.helpText.set(host.tplHelp());
    fixture.detectChanges();
    const helpBtn = el.querySelector('.kt-field__help')!;
    expect(helpBtn).toBeTruthy();
    const helpId = `${input().id}-help`;
    expect(input().getAttribute('aria-describedby') ?? '').toContain(helpId);
    // Le TemplateRef est rendu dans la copie cachée et reste référençable par les AT.
    const desc = el.querySelector(`#${helpId}`);
    expect(desc).toBeTruthy();
    expect(desc!.textContent).toContain("Information d'aide");
  });

  it('emits helpClick when the help button is clicked', () => {
    host.helpText.set("Consignes d'aide");
    fixture.detectChanges();
    const helpBtn = el.querySelector('.kt-field__help') as HTMLButtonElement;
    expect(host.lastHelpEvent).toBeNull();
    helpBtn.click();
    expect(host.lastHelpEvent).toBeTruthy();
  });

  it('appearance: data-appearance="fill" par défaut, "outline" si fourni', () => {
    const field = el.querySelector('kt-field')!;
    expect(field.getAttribute('data-appearance')).toBe('fill');
    host.appearance.set('outline');
    fixture.detectChanges();
    expect(field.getAttribute('data-appearance')).toBe('outline');
  });

  it('floatLabel: data-float-label="auto" par défaut, "always" si fourni', () => {
    const field = el.querySelector('kt-field')!;
    expect(field.getAttribute('data-float-label')).toBe('auto');
    host.floatLabel.set('always');
    fixture.detectChanges();
    expect(field.getAttribute('data-float-label')).toBe('always');
  });

  it('par défaut, aria-required et aria-invalid sont ABSENTS (pas "false")', () => {
    expect(input().hasAttribute('aria-required')).toBe(false);
    expect(input().hasAttribute('aria-invalid')).toBe(false);
  });

  it('région live d’erreur toujours présente (aria-live="polite") même sans erreur', () => {
    const error = el.querySelector('.kt-field__error')!;
    expect(error).toBeTruthy();
    expect(error.getAttribute('aria-live')).toBe('polite');
    expect(error.querySelector('.kt-field__error-message')).toBeNull();
  });

  it('marqueur requis et icône d’aide sont aria-hidden="true"', () => {
    host.required.set(true);
    host.helpText.set("Consignes d'aide");
    fixture.detectChanges();
    expect(el.querySelector('.kt-field__required')!.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('.kt-field__help-icon')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('bouton d’aide: type="button" et aucun aria-describedby', () => {
    host.helpText.set("Consignes d'aide");
    fixture.detectChanges();
    const helpBtn = el.querySelector('.kt-field__help')!;
    expect(helpBtn.getAttribute('type')).toBe('button');
    expect(helpBtn.hasAttribute('aria-describedby')).toBe(false);
  });

  it('aria-describedby compose dans l’ordre hint, error, tooltip, custom', () => {
    host.hint.set('Indice');
    host.invalid.set(true);
    host.errors.set([{ kind: 'required', message: 'Requis' }]);
    host.helpText.set("Consignes d'aide");
    host.customDescribedBy.set('externe');
    fixture.detectChanges();
    const id = input().getAttribute('id')!;
    const parts = (input().getAttribute('aria-describedby') ?? '').split(' ');
    expect(parts[0]).toBe(`${id}-hint`);
    expect(parts[1]).toBe(`${id}-error`);
    expect(parts[2]).toBe(`${id}-help`);
    expect(parts[3]).toBe('externe');
  });

  it('clic sur l’aide: preventDefault + stopPropagation avant d’émettre', () => {
    host.helpText.set("Consignes d'aide");
    fixture.detectChanges();
    const helpBtn = el.querySelector('.kt-field__help')!;
    let bubbled = false;
    el.addEventListener('click', () => (bubbled = true));
    const ev = new MouseEvent('click', { cancelable: true, bubbles: true });
    helpBtn.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    expect(bubbled).toBe(false);
    expect(host.lastHelpEvent).toBe(ev);
  });

  it('aide au contenu blanc : bouton rendu mais aucune description référencée', () => {
    host.helpText.set('   '); // truthy → bouton rendu, mais blanc → rien à annoncer
    fixture.detectChanges();
    expect(el.querySelector('.kt-field__help')).toBeTruthy();
    // Ni copie cachée, ni référence aria-describedby vers l'aide.
    expect(el.querySelector('.kt-field__help-description')).toBeNull();
    expect(input().getAttribute('aria-describedby') ?? '').not.toContain(`${input().id}-help`);
  });

  it('sans label, aucun <label> n’est rendu', () => {
    host.label.set(undefined);
    fixture.detectChanges();
    expect(el.querySelector('label')).toBeNull();
  });

  it('applies visually hidden class to the label when hideLabel is true', () => {
    host.hideLabel.set(true);
    fixture.detectChanges();
    const labelEl = el.querySelector('.kt-field__label')!;
    expect(labelEl.classList.contains('kt-field__label--visually-hidden')).toBe(true);
  });

  it('applies visually hidden class to the error block when hideErrors is true', () => {
    host.hideErrors.set(true);
    host.invalid.set(true);
    host.errors.set([{ kind: 'required', message: 'Requis' }]);
    fixture.detectChanges();
    const errorEl = el.querySelector('.kt-field__error')!;
    expect(errorEl.classList.contains('kt-field__error--visually-hidden')).toBe(true);
  });
});

@Component({
  imports: [KtField, KtFieldControl],
  template: `<kt-field helpText="Aide"><input ktFieldControl /></kt-field>`,
})
class FieldDefaultsHost {}

describe('Field — défauts internes & cascade KT_FIELD_CONFIG', () => {
  function helpLabelOf(fixture: ComponentFixture<unknown>): string | null {
    return (fixture.nativeElement as HTMLElement).querySelector('.kt-field__help')!.getAttribute('aria-label');
  }

  it('helpLabel par défaut = "Help" (anglais neutre) sans input ni config', () => {
    TestBed.configureTestingModule({ imports: [FieldDefaultsHost] });
    const fixture = TestBed.createComponent(FieldDefaultsHost);
    fixture.detectChanges();
    expect(helpLabelOf(fixture)).toBe('Help');
  });

  it('la branche config (provideKtField) pilote appearance/floatLabel/helpLabel', () => {
    TestBed.configureTestingModule({
      imports: [FieldDefaultsHost],
      providers: [provideKtField({ appearance: 'outline', floatLabel: 'always', helpLabel: 'Aide-config' })],
    });
    const fixture = TestBed.createComponent(FieldDefaultsHost);
    fixture.detectChanges();
    const field = (fixture.nativeElement as HTMLElement).querySelector('kt-field')!;
    expect(field.getAttribute('data-appearance')).toBe('outline');
    expect(field.getAttribute('data-float-label')).toBe('always');
    expect(helpLabelOf(fixture)).toBe('Aide-config');
  });
});

@Component({
  imports: [KtFieldControl],
  template: `<input ktFieldControl />`,
})
class BareControlHost {}

describe('Field — ktFieldControl sans parent KtField', () => {
  it('n’expose ni id ni aria-describedby/invalid/required', () => {
    TestBed.configureTestingModule({ imports: [BareControlHost] });
    const fixture = TestBed.createComponent(BareControlHost);
    fixture.detectChanges();
    const inp = (fixture.nativeElement as HTMLElement).querySelector('input')!;
    expect(inp.hasAttribute('id')).toBe(false);
    expect(inp.hasAttribute('aria-describedby')).toBe(false);
    expect(inp.hasAttribute('aria-invalid')).toBe(false);
    expect(inp.hasAttribute('aria-required')).toBe(false);
  });
});
