import { PropRow, TokenGroup } from '../../shared/doc-types';

/** Inputs / API publique de la famille `[ktDisclosure]` (cf. `disclosure.ts`). Aucun token de
    config DI : les libellés sont fournis côté template (i18n-neutre, cf. ADR-0003 / ADR-0004). */
export const DISCLOSURE_PROPS: readonly PropRow[] = [
  {
    name: 'expanded',
    type: 'model<boolean>',
    default: 'false',
    description:
      'État ouvert/fermé. À utiliser **en binding** (`[(expanded)]` / `[expanded]`), jamais en attribut nu (un `model()` n’accepte pas `booleanAttribute`). Exposé via `exportAs: "ktDisclosure"` pour piloter le libellé.',
  },
  {
    name: 'toggle() / expand() / collapse()',
    type: 'méthodes',
    default: '—',
    description: 'Pilotage impératif de l’état depuis le composant hôte.',
  },
  {
    name: 'chevron',
    type: 'boolean',
    default: 'true',
    description:
      'Sur `[ktDisclosureToggle]` : affiche un chevron décoratif qui pivote selon l’état. La directive applique la classe de style elle-même. Désactiver avec `[chevron]="false"`.',
  },
];

/** Marqueurs de la famille (importables en bloc via `KtDisclosureImports`). */
export const DISCLOSURE_DIRECTIVE_PROPS: readonly PropRow[] = [
  {
    name: 'KtDisclosureImports',
    type: 'Directive[]',
    default: '—',
    description: 'Tableau regroupant les 3 marqueurs ci-dessous, à passer tel quel dans `imports`.',
  },
  {
    name: '[ktDisclosure]',
    type: 'Directive (hôte)',
    default: '—',
    description: 'Possède l’état, génère l’`id` du panneau, expose `expanded()` + `toggle/expand/collapse`.',
  },
  {
    name: '[ktDisclosureToggle]',
    type: 'Directive (sur `button`)',
    default: '—',
    description:
      'Déclencheur sur un VRAI `<button>` (clavier natif, `type="button"` forcé). Câble `aria-expanded` / `aria-controls`. Exige un nom accessible (warning en dev sinon).',
  },
  {
    name: '<kt-disclosure-content>',
    type: 'Composant (élément)',
    default: '—',
    description:
      'Panneau repliable. Enveloppe le contenu d’un wrapper `overflow:hidden` (animation grid), porte l’`id` et passe `inert` quand il est fermé. Pas de `role=region`.',
  },
];

/** Tokens CSS du disclosure, d’après `disclosure-tokens.css`. */
export const DISCLOSURE_TOKENS: readonly TokenGroup[] = [
  {
    title: 'Animation',
    tokens: [
      {
        name: '--disclosure-anim-duration',
        default: '0.2s',
        description: 'Durée de l’ouverture/fermeture (`grid-template-rows`). Neutralisée sous prefers-reduced-motion.',
      },
    ],
  },
  {
    title: 'Cible tactile',
    tokens: [
      {
        name: '--disclosure-toggle-min-size',
        default: '44px',
        description: 'Hauteur minimale du déclencheur (cible tactile AAA, WCAG 2.5.5).',
      },
    ],
  },
  {
    title: 'Chevron (input `chevron`, affiché par défaut)',
    tokens: [
      { name: '--disclosure-chevron-size', default: '1em', description: 'Taille du chevron CSS.' },
      { name: '--disclosure-chevron-gap', default: '0.5rem', description: 'Écart entre le libellé et le chevron.' },
    ],
  },
];

export const DISCLOSURE_TS_SNIPPET = `import { KtDisclosureImports } from '@ktortu/aaa/disclosure';

@Component({
  imports: [KtDisclosureImports],
  // ...
})
export class MyComponent {}`;

export const DISCLOSURE_HTML_SNIPPET = `<!-- Le libellé est piloté par l'état exposé (exportAs) ; chevron affiché par défaut -->
<div ktDisclosure #d="ktDisclosure">
  <button ktDisclosureToggle>
    {{ d.expanded() ? 'Voir moins' : 'Voir plus' }}
  </button>
  <kt-disclosure-content>
    <p>Autant de blocs que voulu…</p>
  </kt-disclosure-content>
</div>

<!-- Contrôlé / pré-ouvert, sans chevron -->
<div ktDisclosure [(expanded)]="showOptions">
  <button ktDisclosureToggle [chevron]="false">Options avancées</button>
  <kt-disclosure-content>…</kt-disclosure-content>
</div>`;
