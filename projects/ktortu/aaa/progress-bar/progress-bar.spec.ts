import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { KtProgressBar } from './progress-bar';

@Component({
  imports: [KtProgressBar],
  template: `
    <kt-progress-bar
      [mode]="mode()"
      [value]="value()"
      [label]="label()"
      [labelVisible]="labelVisible()"
      [reducedMotion]="reducedMotion()"
    />
  `,
})
class TestHost {
  mode = signal<'determinate' | 'indeterminate'>('indeterminate');
  value = signal<number>(0);
  label = signal<string | undefined>(undefined);
  labelVisible = signal<boolean>(true);
  reducedMotion = signal<boolean>(false);
}

@Component({
  imports: [KtProgressBar],
  template: `
    <kt-progress-bar>Chargement projeté</kt-progress-bar>
  `,
})
class TestHostWithProjection {}

describe('KtProgressBar', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost, TestHostWithProjection, KtProgressBar],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être initialisé avec le mode indéterminé par défaut', () => {
    const barEl = fixture.debugElement.query(By.css('kt-progress-bar'));
    expect(barEl).toBeTruthy();
    expect(barEl.nativeElement.getAttribute('data-mode')).toBe('indeterminate');
    expect(barEl.nativeElement.getAttribute('role')).toBe('progressbar');
  });

  it('devrait appliquer le aria-label par défaut de fallback si aucun label n\'est fourni', () => {
    const barEl = fixture.debugElement.query(By.css('kt-progress-bar'));
    expect(barEl.nativeElement.getAttribute('aria-label')).toBe('Chargement');
    expect(barEl.nativeElement.getAttribute('aria-labelledby')).toBeNull();
  });

  it('devrait associer le label via aria-labelledby si l\'input label est fourni', () => {
    host.label.set('Chargement en cours...');
    fixture.detectChanges();

    const barEl = fixture.debugElement.query(By.css('kt-progress-bar'));
    const labelEl = fixture.debugElement.query(By.css('.kt-progress-bar-label'));

    const labelId = labelEl.nativeElement.getAttribute('id');
    expect(labelId).toBeTruthy();
    expect(barEl.nativeElement.getAttribute('aria-labelledby')).toBe(labelId);
    expect(barEl.nativeElement.getAttribute('aria-label')).toBeNull();
    expect(labelEl.nativeElement.textContent.trim()).toBe('Chargement en cours...');
  });

  it('devrait masquer le label visuellement si labelVisible est faux', () => {
    host.label.set('Chargement masqué');
    host.labelVisible.set(false);
    fixture.detectChanges();

    const labelEl = fixture.debugElement.query(By.css('.kt-progress-bar-label'));
    expect(labelEl.nativeElement.classList.contains('kt-sr-only')).toBe(true);
  });

  it('devrait gérer la projection de contenu pour le label et l\'associer à aria-labelledby', () => {
    const projFixture = TestBed.createComponent(TestHostWithProjection);
    projFixture.detectChanges();

    const barEl = projFixture.debugElement.query(By.css('kt-progress-bar'));
    const labelEl = projFixture.debugElement.query(By.css('.kt-progress-bar-label'));

    const labelId = labelEl.nativeElement.getAttribute('id');
    expect(labelId).toBeTruthy();
    expect(barEl.nativeElement.getAttribute('aria-labelledby')).toBe(labelId);
    expect(barEl.nativeElement.getAttribute('aria-label')).toBeNull();
    expect(labelEl.nativeElement.textContent.trim()).toBe('Chargement projeté');
  });

  it('devrait appliquer la transformation scaleX appropriée en mode déterminé', () => {
    host.mode.set('determinate');
    host.value.set(45);
    fixture.detectChanges();

    const indicatorEl = fixture.debugElement.query(By.css('.kt-progress-bar-indicator'));
    expect(indicatorEl.nativeElement.style.transform).toBe('scaleX(0.45)');
    
    const barEl = fixture.debugElement.query(By.css('kt-progress-bar'));
    expect(barEl.nativeElement.getAttribute('aria-valuenow')).toBe('45');
  });

  it('devrait borner la valeur entre 0 et 100', () => {
    host.mode.set('determinate');
    host.value.set(150); // plus grand que 100
    fixture.detectChanges();

    let barEl = fixture.debugElement.query(By.css('kt-progress-bar'));
    expect(barEl.nativeElement.getAttribute('aria-valuenow')).toBe('100');

    host.value.set(-50); // plus petit que 0
    fixture.detectChanges();

    barEl = fixture.debugElement.query(By.css('kt-progress-bar'));
    expect(barEl.nativeElement.getAttribute('aria-valuenow')).toBe('0');
  });

  it('devrait appliquer la classe kt-reduced-motion si reducedMotion est activé', () => {
    host.reducedMotion.set(true);
    fixture.detectChanges();

    const indicatorEl = fixture.debugElement.query(By.css('.kt-progress-bar-indicator'));
    expect(indicatorEl.nativeElement.classList.contains('kt-reduced-motion')).toBe(true);
  });
});
