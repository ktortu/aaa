import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { KtSelect, KtSelectOptionDef, KtSelectTriggerDef } from '@ktortu/aaa/forms';
import { CodeBlock } from '../../shared/code-block/code-block';
import { DocExample } from '../../shared/example/example';
import { DocSection } from '../../shared/doc-section/doc-section';
import { PropsTable } from '../../shared/props-table/props-table';
import { TokensTable } from '../../shared/tokens-table/tokens-table';
import { SELECT_HTML_SNIPPET, SELECT_PROPS, SELECT_TOKENS, SELECT_TS_SNIPPET } from './select-demo.data';

interface DemoUser {
  readonly id: number;
  readonly name: string;
  readonly disabled?: boolean;
}

/** Page de documentation du composant `kt-select` (single « select-only combobox »). */
@Component({
  selector: 'kt-select-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    KtSelect,
    KtSelectOptionDef,
    KtSelectTriggerDef,
    DocSection,
    DocExample,
    CodeBlock,
    PropsTable,
    TokensTable,
  ],
  templateUrl: './select-demo.html',
  styleUrl: './select-demo.css',
})
export class SelectDemo {
  protected readonly props = SELECT_PROPS;
  protected readonly tokens = SELECT_TOKENS;
  protected readonly tsSnippet = SELECT_TS_SNIPPET;
  protected readonly htmlSnippet = SELECT_HTML_SNIPPET;

  // --- Données de démo ---
  protected readonly countries = ['France', 'Belgique', 'Suisse', 'Canada', 'Luxembourg'];
  protected readonly country = signal<string | null>(null);

  /** Effacement depuis le champ : présélectionné pour que la croix soit visible d'emblée. */
  protected readonly clearableCountry = signal<string | null>('France');

  protected readonly users: readonly DemoUser[] = [
    { id: 1, name: 'Ada Lovelace' },
    { id: 2, name: 'Alan Turing' },
    { id: 3, name: 'Grace Hopper', disabled: true },
    { id: 4, name: 'Katherine Johnson' },
  ];
  protected readonly userId = signal<number | null>(null);
  protected readonly userIdTpl = signal<number | null>(2);

  protected readonly cities = [
    'Paris',
    'Lyon',
    'Marseille',
    'Bordeaux',
    'Lille',
    'Nantes',
    'Toulouse',
    'Strasbourg',
    'Nice',
    'Rennes',
    'Montpellier',
    'Grenoble',
  ];
  protected readonly city = signal<string | null>(null);

  // --- Filtrage avancé ---
  /** Options accentuées : démontre le filtre insensible aux accents (NFD + suppression diacritiques). */
  protected readonly departments = [
    'Ain',
    'Aisne',
    'Allier',
    'Ardèche',
    'Ardennes',
    'Ariège',
    'Aube',
    'Aude',
    'Aveyron',
    'Calvados',
    'Cantal',
    'Charente',
    'Cher',
    'Corrèze',
    "Côte-d'Or",
    "Côtes-d'Armor",
    'Creuse',
    'Dordogne',
    'Doubs',
    'Drôme',
    'Eure',
    'Finistère',
    'Gard',
    'Gironde',
  ];
  protected readonly department = signal<string | null>(null);

  /** Grande liste : démontre la troncature `maxVisibleOptions` (limite l'affichage, annonce le total). */
  protected readonly manyOptions = Array.from({ length: 150 }, (_, i) => `Référence ${String(i + 1).padStart(3, '0')}`);
  protected readonly manyValue = signal<string | null>(null);

  /** Libellé très long : démontre l'ellipsis du déclencheur et le plafonnement du popup. */
  protected readonly longOptions = [
    'Court',
    'Un intitulé exceptionnellement long qui dépasse la largeur du déclencheur et doit être tronqué par une ellipsis',
  ];
  protected readonly longValue = signal<string | null>(this.longOptions[1]);

  /** Erreurs de démo pour illustrer l'affichage du message. */
  protected readonly demoErrors = [{ kind: 'custom', message: 'Veuillez choisir une option.' }];
}
