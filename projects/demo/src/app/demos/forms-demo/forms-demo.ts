import { ChangeDetectionStrategy, Component } from '@angular/core';

import { KtNumberField, KtPasswordField, KtTextArea, KtTextField } from '@ktortu/aaa/forms';
import { CodeBlock } from '../../shared/code-block/code-block';
import { DocExample } from '../../shared/example/example';
import { DocSection } from '../../shared/doc-section/doc-section';
import { PropsTable } from '../../shared/props-table/props-table';
import { TokensTable } from '../../shared/tokens-table/tokens-table';
import {
  FORMS_COMMON_PROPS,
  FORMS_HTML_SNIPPET,
  FORMS_NUMBER_PROPS,
  FORMS_TEXT_PROPS,
  FORMS_TEXTAREA_PROPS,
  FORMS_TOKENS,
  FORMS_TS_SNIPPET,
} from './forms-demo.data';

/** Page de documentation des champs simples : `kt-text-field`, `kt-text-area`, `kt-number-field`. */
@Component({
  selector: 'kt-forms-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    KtTextField,
    KtPasswordField,
    KtTextArea,
    KtNumberField,
    DocSection,
    DocExample,
    CodeBlock,
    PropsTable,
    TokensTable,
  ],
  templateUrl: './forms-demo.html',
  styleUrl: './forms-demo.css',
})
export class FormsDemo {
  protected readonly commonProps = FORMS_COMMON_PROPS;
  protected readonly textProps = FORMS_TEXT_PROPS;
  protected readonly textareaProps = FORMS_TEXTAREA_PROPS;
  protected readonly numberProps = FORMS_NUMBER_PROPS;
  protected readonly tokens = FORMS_TOKENS;
  protected readonly tsSnippet = FORMS_TS_SNIPPET;
  protected readonly htmlSnippet = FORMS_HTML_SNIPPET;

  /** Erreur de démo pour illustrer l'affichage du message (cf. `KtFieldError`). */
  protected readonly demoErrors = [{ kind: 'custom', message: 'Adresse e-mail invalide.' }];

  /** Suggestions de démo (datalist) pour le champ texte. */
  protected readonly fruits = ['Pomme', 'Banane', 'Cerise', 'Datte'];
}
