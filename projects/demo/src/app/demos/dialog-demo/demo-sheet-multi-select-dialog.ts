import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { KtButton } from '@ktortu/aaa/button';
import { KtDialogImports, defineKtDialog } from '@ktortu/aaa/dialog';
import { KtMultiSelect } from '@ktortu/aaa/forms';

const sheetMultiSelectDialog = defineKtDialog<void, string[]>();

@Component({
  selector: 'kt-demo-sheet-multi-select-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KtButton, KtDialogImports, KtMultiSelect],
  template: `
    <header ktDialogHeader>
      <h2 ktDialogTitle>Sélection d'éléments</h2>
    </header>
    <div ktDialogContent>
      <kt-multi-select
        label="Sélectionner des éléments"
        [options]="availableOptions"
        [(value)]="selected"
        placeholder="Choisir des options..."
      />

      <div class="selected-list" style="margin-block-start: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
        <h3 style="font-size: 1rem; font-weight: 600;">Éléments sélectionnés ({{ selected().length }}) :</h3>
        @for (item of selected(); track item) {
          <div
            class="selected-row"
            style="padding: 0.75rem; background: var(--kt-surface-container, #f0f0f0); border-radius: 6px;"
          >
            Ligne sélectionnée : <strong>{{ item }}</strong>
          </div>
        }
      </div>
    </div>
    <footer ktDialogActions>
      <button ktButton mode="text" ktDialogClose>Annuler</button>
      <button ktButton (click)="validate()" id="btn-valider">Valider ({{ selected().length }})</button>
    </footer>
  `,
})
export class DemoSheetMultiSelectDialog {
  private readonly ref = sheetMultiSelectDialog.injectRef();
  protected readonly availableOptions = Array.from({ length: 30 }, (_, i) => `Option ${i + 1}`);
  protected readonly selected = model<string[]>([]);

  protected validate(): void {
    this.ref.close(this.selected());
  }
}

export const injectSheetMultiSelectDialog = () =>
  sheetMultiSelectDialog.injectOpener(DemoSheetMultiSelectDialog, { presentation: 'sheet' });
