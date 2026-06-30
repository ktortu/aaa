import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { PropRow } from '../doc-types';

/** Tableau des propriétés publiques d'un composant. Passe en cartes empilées sous ~640px. */
@Component({
  selector: 'kt-doc-props',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="doc-table">
      <table>
        <thead>
          <tr>
            <th>Propriété</th>
            <th>Type</th>
            <th>Défaut</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track row.name) {
            <tr>
              <td data-label="Propriété">
                <code>{{ row.name }}</code>
              </td>
              <td data-label="Type">
                <code class="muted">{{ row.type }}</code>
              </td>
              <td data-label="Défaut">
                <code class="muted">{{ row.default || '—' }}</code>
              </td>
              <td data-label="Description">{{ row.description }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: `
    :host {
      display: block;
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
      padding: 0.7rem 1rem;
      font-weight: 600;
      font-size: 0.8125rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--kt-muted);
      background: color-mix(in oklab, var(--kt-on-surface) 4%, var(--kt-surface));
      border-bottom: 1px solid var(--kt-outline);
    }
    tbody td {
      padding: 0.75rem 1rem;
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
        padding: 0.5rem 0.9rem;
        border: none;
      }
      tbody td::before {
        content: attr(data-label);
        flex: 0 0 7rem;
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
export class PropsTable {
  /** Lignes du tableau. */
  readonly rows = input.required<readonly PropRow[]>();
}
