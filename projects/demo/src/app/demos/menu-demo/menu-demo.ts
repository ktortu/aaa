import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Menu, MenuItem, MenuTrigger } from '@angular/aria/menu';

import { KtButton } from '@ktortu/aaa/button';
import { KtMenuImports } from '@ktortu/aaa/menu';
import { CodeBlock } from '../../shared/code-block/code-block';
import { DocExample } from '../../shared/example/example';
import { DocSection } from '../../shared/doc-section/doc-section';
import { PropsTable } from '../../shared/props-table/props-table';
import { TokensTable } from '../../shared/tokens-table/tokens-table';
import {
  MENU_DIRECTIVE_PROPS,
  MENU_HTML_SNIPPET,
  MENU_TOGGLE_PROPS,
  MENU_TOKENS,
  MENU_TS_SNIPPET,
} from './menu-demo.data';

type SortKey = 'name' | 'date' | 'size';

/** Page de documentation de la famille menu (`@ktortu/aaa/menu`) : marqueurs de thème (`[ktMenu]`,
    `[ktMenuItem]`, `[ktMenuTrigger]`, `[ktMenuSeparator]`) + items à état (checkbox / radio). Le
    comportement accessible vient d'`@angular/aria/menu` (`[ngMenu]`, `[ngMenuItem]`, `[ngMenuTrigger]`). */
@Component({
  selector: 'kt-menu-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Menu,
    MenuItem,
    MenuTrigger,
    KtMenuImports,
    KtButton,
    DocSection,
    DocExample,
    CodeBlock,
    PropsTable,
    TokensTable,
  ],
  templateUrl: './menu-demo.html',
  styleUrl: './menu-demo.css',
})
export class MenuDemo {
  protected readonly directiveProps = MENU_DIRECTIVE_PROPS;
  protected readonly toggleProps = MENU_TOGGLE_PROPS;
  protected readonly tokens = MENU_TOKENS;
  protected readonly tsSnippet = MENU_TS_SNIPPET;
  protected readonly htmlSnippet = MENU_HTML_SNIPPET;

  /** Dernière action sélectionnée (preuve du flux `(itemSelected)`). */
  protected readonly lastAction = signal<string | null>(null);

  /** États de cases à cocher (preuve du flux `[(checked)]`). */
  protected readonly wrap = signal(false);
  protected readonly minimap = signal(true);

  /** Valeur du groupe radio (preuve du flux `[(value)]`). */
  protected readonly sortBy = signal<SortKey>('name');

  protected onAction(value: string): void {
    this.lastAction.set(value);
  }
}
