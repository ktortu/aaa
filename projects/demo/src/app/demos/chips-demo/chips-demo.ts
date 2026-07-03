import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { KtButton } from '@ktortu/aaa/button';
import { KtChip, KtChipList, KtChipItemDef, KtChipListbox } from '@ktortu/aaa/forms';
import { CodeBlock } from '../../shared/code-block/code-block';
import { DocExample } from '../../shared/example/example';
import { DocSection } from '../../shared/doc-section/doc-section';
import { PropsTable } from '../../shared/props-table/props-table';
import { TokensTable } from '../../shared/tokens-table/tokens-table';
import {
  CHIPS_CHIP_PROPS,
  CHIPS_HTML_SNIPPET,
  CHIPS_I18N_SNIPPET,
  CHIPS_LIST_PROPS,
  CHIPS_TEMPLATE_PROPS,
  CHIPS_TOKENS,
  CHIPS_TS_SNIPPET,
} from './chips-demo.data';

interface Framework {
  id: number;
  name: string;
}

/** Page de documentation des chips : `kt-chip` (pilule), `kt-chip-list` (liste révocable
    contrôlée), rendu custom via `ng-template[ktChipItem]`. */
@Component({
  selector: 'kt-chips-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    KtButton,
    KtChip,
    KtChipList,
    KtChipItemDef,
    KtChipListbox,
    DocSection,
    DocExample,
    CodeBlock,
    PropsTable,
    TokensTable,
  ],
  templateUrl: './chips-demo.html',
  styleUrl: './chips-demo.css',
})
export class ChipsDemo {
  protected readonly chipProps = CHIPS_CHIP_PROPS;
  protected readonly listProps = CHIPS_LIST_PROPS;
  protected readonly templateProps = CHIPS_TEMPLATE_PROPS;
  protected readonly tokens = CHIPS_TOKENS;
  protected readonly tsSnippet = CHIPS_TS_SNIPPET;
  protected readonly htmlSnippet = CHIPS_HTML_SNIPPET;
  protected readonly i18nSnippet = CHIPS_I18N_SNIPPET;

  // --- Données de démo (pattern contrôlé : le retrait filtre le signal) ---
  /** Chip révocable autonome (réaffichable). */
  protected readonly draftVisible = signal(true);
  /** Liste simple révocable. */
  protected readonly tags = signal(['Angular', 'TypeScript', 'RxJS', 'Signals']);
  /** Liste longue pour illustrer le repli `maxVisible`. */
  protected readonly manyTags = signal(['Angular', 'TypeScript', 'RxJS', 'Signals', 'Zoneless', 'SSR', 'CDK', 'Aria']);
  /** Liste d'objets pour le rendu custom (`ktChipItem`). */
  protected readonly frameworks = signal<Framework[]>([
    { id: 1, name: 'Angular' },
    { id: 2, name: 'React' },
    { id: 3, name: 'Vue' },
    { id: 4, name: 'Svelte' },
    { id: 5, name: 'Solid' },
  ]);
  /** Liste figée pour les états disabled / readonly. */
  protected readonly states = signal(['Lecture seule', 'Désactivé']);

  // --- Sélection de puces (KtChipListbox) ---
  /** Catégorie sélectionnée (sélection simple). */
  protected readonly selectedCategory = signal<string | null>('tech');
  /** Technologies sélectionnées (sélection multiple). */
  protected readonly selectedTechs = signal<string[]>(['angular', 'rxjs']);
  /** Filtre rapide (sélection simple masquée visuellement). */
  protected readonly selectedQuickFilter = signal<string | null>('active');

  protected removeTag(event: { item: string; index: number }): void {
    this.tags.update((list) => list.filter((_, i) => i !== event.index));
  }

  protected removeMany(event: { item: string; index: number }): void {
    this.manyTags.update((list) => list.filter((_, i) => i !== event.index));
  }

  protected removeFramework(event: { item: Framework; index: number }): void {
    this.frameworks.update((list) => list.filter((_, i) => i !== event.index));
  }

  /** Réinitialise toutes les listes d'exemple (les retraits sont réels). */
  protected resetAll(): void {
    this.draftVisible.set(true);
    this.tags.set(['Angular', 'TypeScript', 'RxJS', 'Signals']);
    this.manyTags.set(['Angular', 'TypeScript', 'RxJS', 'Signals', 'Zoneless', 'SSR', 'CDK', 'Aria']);
    this.frameworks.set([
      { id: 1, name: 'Angular' },
      { id: 2, name: 'React' },
      { id: 3, name: 'Vue' },
      { id: 4, name: 'Svelte' },
      { id: 5, name: 'Solid' },
      { id: 6, name: 'Qwik' },
    ]);
    this.selectedCategory.set('tech');
    this.selectedTechs.set(['angular', 'rxjs']);
    this.selectedQuickFilter.set('active');
  }
}
