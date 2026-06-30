import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { TokenGroup } from '../doc-types';

/** Tableau des tokens CSS d'un composant, groupés par palier. Cartes empilées sous ~640px. */
@Component({
  selector: 'kt-doc-tokens',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="doc-tokens">
      @for (group of groups(); track group.title) {
        <section class="doc-tokens__group">
          <h3 class="doc-tokens__title">{{ group.title }}</h3>
          <div class="doc-table">
            <table>
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Défaut</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                @for (token of group.tokens; track token.name) {
                  <tr>
                    <td data-label="Token">
                      <code>{{ token.name }}</code>
                    </td>
                    <td data-label="Défaut">
                      <code class="muted">{{ token.default }}</code>
                    </td>
                    <td data-label="Description">{{ token.description }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .doc-tokens__group {
      margin-bottom: 1.75rem;
    }
    .doc-tokens__title {
      margin: 0 0 0.6rem;
      font-size: 0.9375rem;
      font-weight: 650;
      color: var(--kt-on-surface);
    }
    .doc-table {
      border: 1px solid var(--kt-outline);
      border-radius: var(--kt-control-radius, 8px);
      overflow: hidden;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9375rem;
    }
    thead th {
      text-align: left;
      padding: 0.6rem 1rem;
      font-weight: 600;
      font-size: 0.8125rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--kt-muted);
      background: color-mix(in oklab, var(--kt-on-surface) 4%, var(--kt-surface));
      border-bottom: 1px solid var(--kt-outline);
    }
    tbody td {
      padding: 0.6rem 1rem;
      vertical-align: top;
      color: var(--kt-on-surface);
      border-bottom: 1px solid color-mix(in oklab, var(--kt-outline) 60%, transparent);
    }
    tbody tr:last-child td {
      border-bottom: none;
    }
    code {
      font:
        0.875rem/1.5 ui-monospace,
        monospace;
      color: var(--kt-primary);
    }
    code.muted {
      color: var(--kt-muted);
    }
    @media (max-width: 640px) {
      thead {
        display: none;
      }
      tbody td {
        display: flex;
        gap: 0.75rem;
        justify-content: space-between;
        padding: 0.45rem 0.9rem;
        border: none;
      }
      tbody td::before {
        content: attr(data-label);
        flex: 0 0 6rem;
        font-weight: 600;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--kt-muted);
      }
      tbody tr {
        display: block;
        padding: 0.5rem 0;
        border-bottom: 1px solid var(--kt-outline);
      }
      tbody tr:last-child {
        border-bottom: none;
      }
    }
  `,
})
export class TokensTable {
  /** Groupes de tokens à afficher. */
  readonly groups = input.required<readonly TokenGroup[]>();
}
