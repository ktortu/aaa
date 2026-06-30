import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import {
  KtDateField,
  KtDateTimeField,
  KtInstantField,
  KtSuggestion,
  KtTemporalDatePipe,
  KtTimeField,
  KtYearMonthField,
  type TemporalNamespace,
} from '@ktortu/aaa/forms';
import { CodeBlock } from '../../shared/code-block/code-block';
import { DocExample } from '../../shared/example/example';
import { DocSection } from '../../shared/doc-section/doc-section';
import { PropsTable } from '../../shared/props-table/props-table';
import { TokensTable } from '../../shared/tokens-table/tokens-table';
import {
  TEMPORAL_COMMON_PROPS,
  TEMPORAL_FIELDS_PROPS,
  TEMPORAL_HTML_SNIPPET,
  TEMPORAL_TIME_PROPS,
  TEMPORAL_TOKENS,
  TEMPORAL_TS_SNIPPET,
  TEMPORAL_UTILS_PROPS,
} from './temporal-demo.data';

/** Page de documentation des champs temporels : date, heure, date-heure, année/mois, instant. */
@Component({
  selector: 'kt-temporal-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    KtDateField,
    KtTimeField,
    KtDateTimeField,
    KtYearMonthField,
    KtInstantField,
    KtTemporalDatePipe,
    DocSection,
    DocExample,
    CodeBlock,
    PropsTable,
    TokensTable,
  ],
  templateUrl: './temporal-demo.html',
  styleUrl: './temporal-demo.css',
})
export class TemporalDemo {
  protected readonly commonProps = TEMPORAL_COMMON_PROPS;
  protected readonly fieldsProps = TEMPORAL_FIELDS_PROPS;
  protected readonly timeProps = TEMPORAL_TIME_PROPS;
  protected readonly utilsProps = TEMPORAL_UTILS_PROPS;
  protected readonly tokens = TEMPORAL_TOKENS;
  protected readonly tsSnippet = TEMPORAL_TS_SNIPPET;
  protected readonly htmlSnippet = TEMPORAL_HTML_SNIPPET;

  // Données de démo (le global `Temporal` vient de `temporal-polyfill/global`, importé dans main.ts).
  protected readonly birthDate = signal<TemporalNamespace.PlainDate | null>(Temporal.PlainDate.from('1990-05-15'));
  protected readonly openingTime = signal<TemporalNamespace.PlainTime | null>(Temporal.PlainTime.from('09:30'));
  protected readonly preciseTime = signal<TemporalNamespace.PlainTime | null>(Temporal.PlainTime.from('09:30:45'));
  protected readonly eventStart = signal<TemporalNamespace.PlainDateTime | null>(
    Temporal.PlainDateTime.from('2026-09-18T14:00'),
  );
  protected readonly cardExpiry = signal<TemporalNamespace.PlainYearMonth | null>(
    Temporal.PlainYearMonth.from('2028-04'),
  );
  protected readonly recordedAt = signal<TemporalNamespace.Instant | null>(
    Temporal.Instant.from('2026-06-22T08:00:30Z'),
  );
  protected readonly today = signal<TemporalNamespace.PlainDate>(Temporal.PlainDate.from('2026-06-22'));

  /** Suggestions de démo (datalist) pour le champ année/mois. */
  protected readonly expiryHints: readonly KtSuggestion<TemporalNamespace.PlainYearMonth>[] = [
    { value: Temporal.PlainYearMonth.from('2026-12'), label: 'Décembre 2026' },
    { value: Temporal.PlainYearMonth.from('2027-06'), label: 'Juin 2027' },
    { value: Temporal.PlainYearMonth.from('2028-04'), label: 'Avril 2028' },
  ];

  /** Erreur de démo pour illustrer l'affichage du message (cf. `KtFieldError`). */
  protected readonly demoErrors = [{ kind: 'custom', message: 'Date dans le passé.' }];
}
