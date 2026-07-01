import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { KtButton } from '@ktortu/aaa/button';
import { KtProgressBar } from '@ktortu/aaa/progress-bar';

import { CodeBlock } from '../../shared/code-block/code-block';
import { DocSection } from '../../shared/doc-section/doc-section';
import { DocExample } from '../../shared/example/example';
import { PropsTable } from '../../shared/props-table/props-table';
import { TokensTable } from '../../shared/tokens-table/tokens-table';
import {
  PROGRESS_BAR_PROPS,
  PROGRESS_BAR_TOKENS,
  PROGRESS_BAR_TS_SNIPPET,
  PROGRESS_BAR_HTML_SNIPPET,
} from './progress-bar-demo.data';

@Component({
  selector: 'kt-progress-bar-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KtProgressBar, KtButton, DocSection, DocExample, CodeBlock, PropsTable, TokensTable],
  templateUrl: './progress-bar-demo.html',
  styleUrl: './progress-bar-demo.css',
})
export class ProgressBarDemo {
  protected readonly props = PROGRESS_BAR_PROPS;
  protected readonly tokens = PROGRESS_BAR_TOKENS;
  protected readonly tsSnippet = PROGRESS_BAR_TS_SNIPPET;
  protected readonly htmlSnippet = PROGRESS_BAR_HTML_SNIPPET;

  protected readonly determinateValue = signal(35);

  protected onValueChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input) {
      this.determinateValue.set(Number(input.value));
    }
  }

  protected resetValue(): void {
    this.determinateValue.set(0);
  }
}
