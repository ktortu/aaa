import {
  Component,
  input,
  computed,
  booleanAttribute,
  inject,
  ElementRef,
  signal,
  AfterViewInit,
} from '@angular/core';
import { KtIdGenerator } from '@ktortu/aaa/cdk';

@Component({
  selector: 'kt-progress-bar',
  standalone: true,
  template: `
    <div
      [id]="labelId"
      class="kt-progress-bar-label"
      [class.kt-sr-only]="!labelVisible()"
    >
      @if (label()) {
        {{ label() }}
      } @else {
        <ng-content />
      }
    </div>
    <div class="kt-progress-bar-track">
      <div
        class="kt-progress-bar-indicator"
        [style.transform]="transformStyle()"
        [class.kt-reduced-motion]="reducedMotion()"
      ></div>
    </div>
  `,
  styleUrl: './progress-bar.css',
  host: {
    'role': 'progressbar',
    'data-testid': 'kt-progress-bar',
    '[attr.aria-valuemin]': '0',
    '[attr.aria-valuemax]': '100',
    '[attr.aria-valuenow]': 'mode() === "determinate" ? value() : null',
    '[attr.aria-labelledby]': 'hasLabel() ? labelId : null',
    '[attr.aria-label]': '!hasLabel() ? "Chargement" : null',
    '[attr.data-mode]': 'mode()',
  },
})
export class KtProgressBar implements AfterViewInit {
  private readonly idGen = inject(KtIdGenerator);
  private readonly elementRef = inject(ElementRef);
  
  protected readonly labelId = `kt-progress-bar-label-${this.idGen.generateId('progress-bar')}`;
  private readonly hasProjectedContent = signal(false);

  /** Mode de fonctionnement de la barre de progression. @default 'indeterminate' */
  readonly mode = input<'determinate' | 'indeterminate'>('indeterminate');

  /** Valeur de la progression (entre 0 et 100). Ignorée en mode 'indeterminate'. @default 0 */
  readonly value = input<number, unknown>(0, {
    transform: (v: unknown) => Math.max(0, Math.min(100, Number(v) || 0)),
  });

  /** Label textuel optionnel passé par attribut. */
  readonly label = input<string>();

  /** Détermine si le label textuel doit être visible à l'écran. @default true */
  readonly labelVisible = input<boolean, unknown>(true, { transform: booleanAttribute });

  /** Permet de figer l'animation indéterminée (utile pour les tests). @default false */
  readonly reducedMotion = input<boolean, unknown>(false, { transform: booleanAttribute });

  /** Indique si le composant dispose d'un label défini (soit via input, soit par projection). */
  protected readonly hasLabel = computed(() => !!this.label() || this.hasProjectedContent());

  protected readonly transformStyle = computed(() => {
    if (this.mode() === 'indeterminate') return null;
    return `scaleX(${this.value() / 100})`;
  });

  ngAfterViewInit(): void {
    // Vérification asynchrone pour voir s'il y a du contenu projeté dans l'élément hôte
    const hostText = this.elementRef.nativeElement.textContent?.trim() || '';
    if (hostText.length > 0) {
      this.hasProjectedContent.set(true);
    }
  }
}
