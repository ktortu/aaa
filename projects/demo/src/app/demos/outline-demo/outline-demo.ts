import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import { KtDateField, KtNumberField, KtSelect, KtSwitch, KtTextArea, KtTextField } from '@ktortu/aaa/forms';
import { CodeBlock } from '../../shared/code-block/code-block';
import { DocExample } from '../../shared/example/example';
import { DocSection } from '../../shared/doc-section/doc-section';
import { PropsTable } from '../../shared/props-table/props-table';
import { TokensTable } from '../../shared/tokens-table/tokens-table';
import {
  OUTLINE_FLOAT_SNIPPET,
  OUTLINE_GLOBAL_SNIPPET,
  OUTLINE_MIGRATION_SNIPPET,
  OUTLINE_PERFIELD_SNIPPET,
  OUTLINE_PROPS,
  OUTLINE_TOKENS,
  OUTLINE_TOKENS_SNIPPET,
} from './outline-demo.data';

/** Page transverse : l'apparence `outline` (label flottant façon Material) des champs. */
@Component({
  selector: 'kt-outline-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    KtTextField,
    KtNumberField,
    KtTextArea,
    KtDateField,
    KtSelect,
    KtSwitch,
    DocSection,
    DocExample,
    CodeBlock,
    PropsTable,
    TokensTable,
  ],
  templateUrl: './outline-demo.html',
  styleUrl: './outline-demo.css',
})
export class OutlineDemo {
  protected readonly props = OUTLINE_PROPS;
  protected readonly tokens = OUTLINE_TOKENS;
  protected readonly perFieldSnippet = OUTLINE_PERFIELD_SNIPPET;
  protected readonly globalSnippet = OUTLINE_GLOBAL_SNIPPET;
  protected readonly tokensSnippet = OUTLINE_TOKENS_SNIPPET;
  protected readonly floatSnippet = OUTLINE_FLOAT_SNIPPET;
  protected readonly migrationSnippet = OUTLINE_MIGRATION_SNIPPET;

  protected readonly countries = ['France', 'Belgique', 'Suisse', 'Canada', 'Luxembourg'];

  // Données d'exemple.
  protected readonly name = signal('Ada Lovelace');
  protected readonly empty = signal('');
  protected readonly bio = signal('');

  // Bascule interactive fill ↔ outline.
  protected readonly outlineMode = signal(true);
  protected readonly appr = computed<'fill' | 'outline'>(() => (this.outlineMode() ? 'outline' : 'fill'));

  // Bascule interactive auto ↔ always (label toujours flotté).
  protected readonly alwaysMode = signal(true);
  protected readonly floatMode = computed<'auto' | 'always'>(() => (this.alwaysMode() ? 'always' : 'auto'));

  protected readonly demoErrors = [{ kind: 'custom', message: 'Ce champ est requis.' }];
}
