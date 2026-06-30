import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { KtMultiSelect } from '@ktortu/aaa/forms';
import { CodeBlock } from '../../shared/code-block/code-block';
import { DocExample } from '../../shared/example/example';
import { DocSection } from '../../shared/doc-section/doc-section';
import { PropsTable } from '../../shared/props-table/props-table';
import { TokensTable } from '../../shared/tokens-table/tokens-table';
import {
  MULTI_SELECT_COMMON_PROPS,
  MULTI_SELECT_HTML_SNIPPET,
  MULTI_SELECT_PROPS,
  MULTI_SELECT_TOKENS,
  MULTI_SELECT_TS_SNIPPET,
} from './multi-select-demo.data';

interface DemoSkill {
  readonly id: number;
  readonly name: string;
  readonly disabled?: boolean;
}

/** Page de documentation du composant `kt-multi-select` (sélection multiple à chips révocables). */
@Component({
  selector: 'kt-multi-select-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KtMultiSelect, DocSection, DocExample, CodeBlock, PropsTable, TokensTable],
  templateUrl: './multi-select-demo.html',
  styleUrl: './multi-select-demo.css',
})
export class MultiSelectDemo {
  protected readonly props = MULTI_SELECT_PROPS;
  protected readonly commonProps = MULTI_SELECT_COMMON_PROPS;
  protected readonly tokens = MULTI_SELECT_TOKENS;
  protected readonly tsSnippet = MULTI_SELECT_TS_SNIPPET;
  protected readonly htmlSnippet = MULTI_SELECT_HTML_SNIPPET;

  // --- Données de démo ---
  protected readonly tags = ['Angular', 'TypeScript', 'RxJS', 'Signals', 'CSS', 'A11y', 'CDK', 'Material'];
  protected readonly selectedTags = signal<string[]>(['Angular', 'Signals']);
  protected readonly selectedClearable = signal<string[]>(['CSS']);
  protected readonly selectedMany = signal<string[]>(['Angular', 'TypeScript', 'RxJS', 'CSS']);

  protected readonly skills: readonly DemoSkill[] = [
    { id: 1, name: 'Accessibilité' },
    { id: 2, name: 'Design system' },
    { id: 3, name: 'Tests', disabled: true },
    { id: 4, name: 'Animation' },
  ];
  protected readonly selectedSkillIds = signal<number[]>([2]);

  /** Erreurs de démo pour illustrer l'affichage du message. */
  protected readonly demoErrors = [{ kind: 'custom', message: 'Sélectionnez au moins une option.' }];
}
