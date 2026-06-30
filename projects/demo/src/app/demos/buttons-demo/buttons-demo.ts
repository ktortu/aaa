import { ChangeDetectionStrategy, Component } from '@angular/core';

import { KtButton } from '@ktortu/aaa/button';
import { CodeBlock } from '../../shared/code-block/code-block';
import { DocExample } from '../../shared/example/example';
import { DocSection } from '../../shared/doc-section/doc-section';
import { PropsTable } from '../../shared/props-table/props-table';
import { TokensTable } from '../../shared/tokens-table/tokens-table';
import { BUTTON_HTML_SNIPPET, BUTTON_PROPS, BUTTON_TOKENS, BUTTON_TS_SNIPPET } from './buttons-demo.data';

/** Page de documentation de la directive `[ktButton]`. */
@Component({
  selector: 'kt-buttons-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KtButton, DocSection, DocExample, CodeBlock, PropsTable, TokensTable],
  templateUrl: './buttons-demo.html',
  styleUrl: './buttons-demo.css',
})
export class ButtonsDemo {
  protected readonly props = BUTTON_PROPS;
  protected readonly tokens = BUTTON_TOKENS;
  protected readonly tsSnippet = BUTTON_TS_SNIPPET;
  protected readonly htmlSnippet = BUTTON_HTML_SNIPPET;
}
