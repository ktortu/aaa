import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { Tab, TabContent, TabList, TabPanel, Tabs } from '@angular/aria/tabs';

import { KtButton } from '@ktortu/aaa/button';
import { KtTabScroller, KtTabScrollerPager } from '@ktortu/aaa/tabs';
import { CodeBlock } from '../../shared/code-block/code-block';
import { DocSection } from '../../shared/doc-section/doc-section';
import { DocExample } from '../../shared/example/example';
import { PropsTable } from '../../shared/props-table/props-table';
import { TokensTable } from '../../shared/tokens-table/tokens-table';
import {
  TABLIST_PROPS,
  TABPANEL_PROPS,
  TABS_HTML_SNIPPET,
  TABS_TOKENS,
  TABS_TS_SNIPPET,
  TAB_PROPS,
} from './tabs-demo.data';

/** Page de documentation des Tabs : directives `@angular/aria/tabs` (headless) + style `@ktortu/aaa`
    + pagination `ktTabScroller` / `<kt-tab-scroller>`. Sélection par signaux, contenu lazy `ngTabContent`. */
@Component({
  selector: 'kt-tabs-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Tabs,
    TabList,
    Tab,
    TabPanel,
    TabContent,
    KtTabScroller,
    KtTabScrollerPager,
    KtButton,
    DocSection,
    DocExample,
    CodeBlock,
    PropsTable,
    TokensTable,
  ],
  templateUrl: './tabs-demo.html',
  styleUrl: './tabs-demo.css',
  // Les libellés des chevrons clé-en-main viennent du français global (`provideKtDefaultFR` dans
  // app.config.ts) ; aucun provider local nécessaire. Surchargeables par instance via les inputs.
})
export class TabsDemo {
  /** Exemple 1 — sélection de base. */
  protected readonly basicTab = signal('overview');
  /** Exemple 2 — débordement horizontal, couche clé-en-main. */
  protected readonly overflowTab = signal('m12');
  /** Exemple 2 bis — débordement horizontal, couche headless (boutons custom). */
  protected readonly headlessTab = signal('m12');
  /** Exemple 3 — débordement vertical. */
  protected readonly verticalTab = signal('s10');
  /** Exemple 4 — sélection autour d’un onglet désactivé. */
  protected readonly disabledTab = signal('a');
  /** Exemple 5 — sélection avec modes commutés. */
  protected readonly knobsTab = signal('one');

  /** Knobs ARIA commutés par signal (exemple 5). */
  protected readonly selectionMode = signal<'follow' | 'explicit'>('follow');
  protected readonly focusMode = signal<'roving' | 'activedescendant'>('roving');

  /** Jeux d’onglets pour les démos de débordement. */
  protected readonly overflowTabs = Array.from({ length: 12 }, (_, i) => `m${i + 1}`);
  protected readonly verticalTabs = Array.from({ length: 10 }, (_, i) => `s${i + 1}`);

  /** Index de l’onglet sélectionné dans l’exemple headless (compteur « n / total »). */
  protected readonly headlessIndex = computed(() => Math.max(0, this.overflowTabs.indexOf(this.headlessTab() ?? '')));

  protected readonly tablistProps = TABLIST_PROPS;
  protected readonly tabProps = TAB_PROPS;
  protected readonly panelProps = TABPANEL_PROPS;
  protected readonly tokens = TABS_TOKENS;
  protected readonly tsSnippet = TABS_TS_SNIPPET;
  protected readonly htmlSnippet = TABS_HTML_SNIPPET;

  protected toggleSelectionMode(): void {
    this.selectionMode.update((m) => (m === 'follow' ? 'explicit' : 'follow'));
  }

  protected toggleFocusMode(): void {
    this.focusMode.update((m) => (m === 'roving' ? 'activedescendant' : 'roving'));
  }
}
