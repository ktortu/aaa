import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { KtButton } from '@ktortu/aaa/button';
import { KtCardImports } from '@ktortu/aaa/card';
import { CodeBlock } from '../../shared/code-block/code-block';
import { DocSection } from '../../shared/doc-section/doc-section';
import { DocExample } from '../../shared/example/example';
import { PropsTable } from '../../shared/props-table/props-table';
import { TokensTable } from '../../shared/tokens-table/tokens-table';
import { CARD_DIRECTIVE_PROPS, CARD_HTML_SNIPPET, CARD_PROPS, CARD_TOKENS, CARD_TS_SNIPPET } from './card-demo.data';

/** Page de documentation de la famille card (`@ktortu/aaa/card`) : directive `[ktCard]` (surface)
    + marqueurs structurels + lien étiré `[ktCardLink]`. */
@Component({
  selector: 'kt-card-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KtCardImports, KtButton, RouterLink, DocSection, DocExample, CodeBlock, PropsTable, TokensTable],
  templateUrl: './card-demo.html',
  styleUrl: './card-demo.css',
})
export class CardDemo {
  protected readonly props = CARD_PROPS;
  protected readonly directiveProps = CARD_DIRECTIVE_PROPS;
  protected readonly tokens = CARD_TOKENS;
  protected readonly tsSnippet = CARD_TS_SNIPPET;
  protected readonly htmlSnippet = CARD_HTML_SNIPPET;
}
