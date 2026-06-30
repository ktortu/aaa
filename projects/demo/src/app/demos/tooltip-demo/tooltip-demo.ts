import { ChangeDetectionStrategy, Component } from '@angular/core';

import { KtButton } from '@ktortu/aaa/button';
import { KtTooltip } from '@ktortu/aaa/tooltip';
import { CodeBlock } from '../../shared/code-block/code-block';
import { DocExample } from '../../shared/example/example';
import { DocSection } from '../../shared/doc-section/doc-section';
import { PropsTable } from '../../shared/props-table/props-table';
import { TokensTable } from '../../shared/tokens-table/tokens-table';
import { TOOLTIP_HTML_SNIPPET, TOOLTIP_PROPS, TOOLTIP_TOKENS, TOOLTIP_TS_SNIPPET } from './tooltip-demo.data';

/** Page de documentation de la directive `[ktTooltip]`. */
@Component({
  selector: 'kt-tooltip-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KtTooltip, KtButton, DocSection, DocExample, CodeBlock, PropsTable, TokensTable],
  templateUrl: './tooltip-demo.html',
  styleUrl: './tooltip-demo.css',
})
export class TooltipDemo {
  protected readonly props = TOOLTIP_PROPS;
  protected readonly tokens = TOOLTIP_TOKENS;
  protected readonly tsSnippet = TOOLTIP_TS_SNIPPET;
  protected readonly htmlSnippet = TOOLTIP_HTML_SNIPPET;
}
