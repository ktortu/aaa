import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { KtCheckbox, KtCheckboxGroup, KtRadio, KtRadioGroup, KtSwitch } from '@ktortu/aaa/forms';
import { CodeBlock } from '../../shared/code-block/code-block';
import { DocExample } from '../../shared/example/example';
import { DocSection } from '../../shared/doc-section/doc-section';
import { PropsTable } from '../../shared/props-table/props-table';
import { TokensTable } from '../../shared/tokens-table/tokens-table';
import {
  CHOICE_CHECKBOX_GROUP_PROPS,
  CHOICE_CHECKBOX_PROPS,
  CHOICE_COMMON_PROPS,
  CHOICE_HTML_SNIPPET,
  CHOICE_RADIO_GROUP_PROPS,
  CHOICE_RADIO_PROPS,
  CHOICE_SWITCH_PROPS,
  CHOICE_TOKENS,
  CHOICE_TS_SNIPPET,
} from './choice-demo.data';

/** Page de documentation des contrôles de choix : `kt-switch`, `kt-checkbox` (+ groupe),
    `kt-radio` (+ groupe). */
@Component({
  selector: 'kt-choice-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    KtSwitch,
    KtCheckbox,
    KtCheckboxGroup,
    KtRadio,
    KtRadioGroup,
    DocSection,
    DocExample,
    CodeBlock,
    PropsTable,
    TokensTable,
  ],
  templateUrl: './choice-demo.html',
  styleUrl: './choice-demo.css',
})
export class ChoiceDemo {
  protected readonly commonProps = CHOICE_COMMON_PROPS;
  protected readonly switchProps = CHOICE_SWITCH_PROPS;
  protected readonly checkboxProps = CHOICE_CHECKBOX_PROPS;
  protected readonly checkboxGroupProps = CHOICE_CHECKBOX_GROUP_PROPS;
  protected readonly radioProps = CHOICE_RADIO_PROPS;
  protected readonly radioGroupProps = CHOICE_RADIO_GROUP_PROPS;
  protected readonly tokens = CHOICE_TOKENS;
  protected readonly tsSnippet = CHOICE_TS_SNIPPET;
  protected readonly htmlSnippet = CHOICE_HTML_SNIPPET;

  // Données de démo (valeurs liées en two-way).
  protected readonly notifications = signal(true);
  protected readonly accepted = signal(false);
  protected readonly interests = signal<string[]>(['sport']);
  protected readonly civility = signal<string | null>('mme');
  protected readonly size = signal<string | null>('m');

  /** Erreurs de démo pour illustrer l'affichage du message (cf. `KtFieldError`). */
  protected readonly demoErrors = [{ kind: 'custom', message: 'Ce choix est requis.' }];
}
