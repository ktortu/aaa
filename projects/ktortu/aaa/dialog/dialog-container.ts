import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  isDevMode,
  signal,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CdkDialogContainer, DialogRef } from '@angular/cdk/dialog';
import { PortalModule } from '@angular/cdk/portal';

@Component({
  selector: 'kt-dialog-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PortalModule],
  host: {
    class: 'cdk-dialog-container kt-dialog-container',
    tabindex: '-1',
    '[attr.id]': '_config.id || null',
    '[attr.role]': '_config.role',
    '[attr.aria-modal]': '_config.ariaModal',
    '[attr.aria-labelledby]': '_config.ariaLabel ? null : ariaLabelledBy',
    '[attr.aria-label]': '_config.ariaLabel',
    '[attr.aria-describedby]': '_config.ariaDescribedBy || null',
    '[class.kt-dialog-container--sheet]': 'isSheet()',
    '[class.kt-dialog-container--closing]': 'isClosing()',
  },
  template: `
    <div class="kt-dialog-container__layout">
      <ng-template cdkPortalOutlet></ng-template>
    </div>
  `,
})
export class KtDialogContainer extends CdkDialogContainer {
  private readonly dialogRef = inject(DialogRef);
  private readonly elementRef = inject(ElementRef);
  private readonly host = this.elementRef.nativeElement as HTMLElement;
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly isClosing = signal(false);

  /** Premier id de la file `aria-labelledby` exposée par `CdkDialogContainer`. Le membre
      `_ariaLabelledByQueue` est interne au CDK (préfixe `_`) : on l'encapsule ICI, gardé, pour que
      le binding de template ne lise jamais l'interne directement. Si une montée du CDK retire ou
      renomme ce membre, on dégrade proprement vers `null` au lieu de casser le rendu du conteneur. */
  protected get ariaLabelledBy(): string | null {
    const queue = (this as unknown as { _ariaLabelledByQueue?: readonly string[] })._ariaLabelledByQueue;
    return queue?.[0] ?? null;
  }

  constructor() {
    super();
    // CDK Dialog n'expose AUCUN hook « avant fermeture ». Pour jouer l'animation de SORTIE sur
    // TOUTE fermeture, on intercepte la méthode publique `close` de la réf : c'est le point de
    // passage unique. Échap et clic backdrop sont gérés NATIVEMENT par le CDK, qui appelle lui aussi
    // `dialogRef.close()` → ils transitent donc par cette interception (inutile de les réimplémenter).
    const originalClose = this.dialogRef.close.bind(this.dialogRef);
    this.dialogRef.close = (result?: unknown) => {
      this.animateAndClose(result, originalClose);
    };

    // L'ouvreur pré-réserve des ids titre/description ; les directives [ktDialogTitle]/[ktDialogDescription]
    // les adoptent. En leur absence, ces ids pointent dans le vide. Au rendu (navigateur) :
    //  - aria-describedby orphelin → on RETIRE l'attribut (pas de description fournie) ;
    //  - aucun nom accessible (ni titre ni aria-label) → warn dev (WCAG 4.1.2).
    afterNextRender(() => {
      const doc = this.host.ownerDocument;

      const describedBy = this.host.getAttribute('aria-describedby');
      if (describedBy && !doc.getElementById(describedBy)) {
        this.host.removeAttribute('aria-describedby');
      }

      if (!isDevMode()) return;
      const labelledBy = this.host.getAttribute('aria-labelledby');
      const hasName = !!this.host.getAttribute('aria-label') || (!!labelledBy && !!doc.getElementById(labelledBy));
      if (!hasName) {
        console.warn(
          '[ktDialog] dialog sans nom accessible : ajoutez un [ktDialogTitle] (ou `aria-label` via la config d’ouverture) — WCAG 4.1.2.',
        );
      }
    });
  }

  protected isSheet(): boolean {
    return this._config.panelClass?.includes('kt-dialog--sheet') ?? false;
  }

  private animateAndClose(result: unknown, originalCloseFn: (r?: unknown) => void): void {
    if (this.isClosing()) return;
    this.isClosing.set(true);

    if (!isPlatformBrowser(this.platformId)) {
      originalCloseFn(result);
      return;
    }

    // Récupérer la durée de transition configurée en CSS (ex: "150ms" ou "0.2s")
    const styles = window.getComputedStyle(this.host);
    const durationStr = styles.transitionDuration || '0s';
    const durationMs = parseFloat(durationStr) * (durationStr.includes('ms') ? 1 : 1000);

    if (durationMs === 0) {
      originalCloseFn(result);
      return;
    }

    // Écouter la fin de la transition (opacity pour le dialog classique, translate pour la sheet)
    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target === this.host && (event.propertyName === 'translate' || event.propertyName === 'opacity')) {
        this.host.removeEventListener('transitionend', onTransitionEnd);
        originalCloseFn(result);
      }
    };
    this.host.addEventListener('transitionend', onTransitionEnd);

    // Sécurité (au cas où la transition n'aboutirait pas)
    setTimeout(() => {
      this.host.removeEventListener('transitionend', onTransitionEnd);
      originalCloseFn(result);
    }, durationMs + 50);
  }
}
