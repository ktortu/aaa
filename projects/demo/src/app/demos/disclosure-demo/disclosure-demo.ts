import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { KtButton } from '@ktortu/aaa/button';
import { KtDisclosureImports } from '@ktortu/aaa/disclosure';
import { CodeBlock } from '../../shared/code-block/code-block';
import { DocSection } from '../../shared/doc-section/doc-section';
import { DocExample } from '../../shared/example/example';
import { PropsTable } from '../../shared/props-table/props-table';
import { TokensTable } from '../../shared/tokens-table/tokens-table';
import {
  DISCLOSURE_DIRECTIVE_PROPS,
  DISCLOSURE_HTML_SNIPPET,
  DISCLOSURE_PROPS,
  DISCLOSURE_TOKENS,
  DISCLOSURE_TS_SNIPPET,
} from './disclosure-demo.data';

/** Page de documentation de la famille disclosure (`@ktortu/aaa/disclosure`) : divulgation
    d'INTERFACE (volet d'options, module). Pour une section de CONTENU, préférer `<details>`. */
@Component({
  selector: 'kt-disclosure-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KtDisclosureImports, KtButton, DocSection, DocExample, CodeBlock, PropsTable, TokensTable],
  templateUrl: './disclosure-demo.html',
  styleUrl: './disclosure-demo.css',
})
export class DisclosureDemo {
  protected readonly props = DISCLOSURE_PROPS;
  protected readonly directiveProps = DISCLOSURE_DIRECTIVE_PROPS;
  protected readonly tokens = DISCLOSURE_TOKENS;
  protected readonly tsSnippet = DISCLOSURE_TS_SNIPPET;
  protected readonly htmlSnippet = DISCLOSURE_HTML_SNIPPET;

  /** Exemple contrôlé : volet d'options pré-piloté depuis le composant. */
  protected readonly showOptions = signal(false);
}
