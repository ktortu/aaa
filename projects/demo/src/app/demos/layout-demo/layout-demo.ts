import { Component } from '@angular/core';

@Component({
  selector: 'kt-layout-demo',
  standalone: true,
  template: `
    <div style="max-width: 800px;">
      <h2 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 1rem; color: var(--kt-primary);">
        Module Layout (Shell)
      </h2>

      <p style="margin-bottom: 1.5rem; line-height: 1.6;">
        Le module <strong>Layout</strong> permet de construire facilement l'ossature d'une application (Shell) avec une
        barre latérale (Sidenav) et une barre supérieure (Toolbar). Il est entièrement responsive : la Sidenav se
        transforme en tiroir caché sur mobile.
      </p>

      <div
        style="background: color-mix(in oklab, var(--kt-on-surface) 3%, var(--kt-surface)); padding: 1.5rem; border-radius: 8px; border: 1px solid var(--kt-outline); margin-bottom: 2rem;"
      >
        <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">Note sur cette démo</h3>
        <p style="margin-bottom: 0;">
          L'interface que vous utilisez actuellement pour consulter cette documentation
          <strong>est construite avec <code>&lt;kt-layout&gt;</code></strong> ! Vous pouvez observer son comportement en
          direct en réduisant la taille de votre fenêtre ou en utilisant le bouton de bascule (flèche) en bas de la
          barre latérale sur ordinateur.
        </p>
      </div>

      <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem;">Configuration et utilisation</h3>

      <p style="margin-bottom: 1rem;">
        Le point d'entrée est <code>@ktortu/aaa/layout</code>. Les styles associés sont dans
        <code>@ktortu/aaa/layout.css</code>. <br /><strong>Note importante :</strong> Pour utiliser le composant, vous
        devez fournir le <code>KtLayoutService</code> dans votre application ou au niveau de votre composant racine via
        <code>providers: [KtLayoutService]</code>. Cela permet de garantir l'isolation si votre application utilise
        plusieurs layouts indépendants.
      </p>

      <pre
        ngNonBindable
        style="background: color-mix(in oklab, var(--kt-on-surface) 5%, var(--kt-surface)); padding: 1rem; border-radius: 6px; overflow-x: auto; font-family: monospace; font-size: 0.9rem; margin-bottom: 2rem; border: 1px solid var(--kt-outline);"
      ><code>&lt;kt-layout desktopCloseBehavior="rail"&gt;
  &lt;kt-sidenav&gt;
    &lt;!-- Liens de navigation --&gt;
    &lt;a href="#"&gt;Accueil&lt;/a&gt;
    
    &lt;!-- Bouton de bascule Desktop (Rail / Étendu) --&gt;
    &lt;button ktSidenavToggle #btn="ktSidenavToggle"&gt;
      {{ btn.isRail() ? 'Agrandir' : 'Réduire' }}
    &lt;/button&gt;
  &lt;/kt-sidenav&gt;

  &lt;kt-toolbar&gt;
    &lt;!-- Bouton de bascule Mobile (Burger) --&gt;
    &lt;button ktSidenavToggle class="hide-on-desktop"&gt;Menu&lt;/button&gt;
    &lt;h1&gt;Mon Application&lt;/h1&gt;
  &lt;/kt-toolbar&gt;

  &lt;!-- Contenu principal (ex: router-outlet) --&gt;
  &lt;main&gt;Bienvenue !&lt;/main&gt;
&lt;/kt-layout&gt;</code></pre>

      <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem;">
        La Toolbar (<code>&lt;kt-toolbar&gt;</code>)
      </h3>
      <p style="margin-bottom: 1.5rem; line-height: 1.6;">
        Bien que souvent utilisée au sein d'un <code>&lt;kt-layout&gt;</code>, la
        <strong><code>&lt;kt-toolbar&gt;</code> peut tout à fait être utilisée en dehors</strong>, de façon 100%
        indépendante. C'est un simple conteneur Flexbox (<code>display: flex; align-items: center;</code>) possédant une
        hauteur fixe et une bordure inférieure. Idéale pour créer un en-tête d'application ou de carte, peu importe son
        emplacement dans le DOM.
      </p>

      <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem;">Tokens CSS (Personnalisation)</h3>
      <p style="margin-bottom: 1rem; line-height: 1.6;">
        Toute l'apparence et les dimensions du layout sont personnalisables via des tokens CSS :
      </p>
      <ul style="padding-left: 1.5rem; line-height: 1.6; margin-bottom: 2rem; font-family: monospace;">
        <li>--kt-sidenav-width: 280px;</li>
        <li>--kt-sidenav-rail-width: 72px;</li>
        <li>--kt-toolbar-height: 64px;</li>
        <li>--kt-layout-transition: 200ms cubic-bezier(...);</li>
      </ul>

      <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem;">Fonctionnalités clés</h3>
      <ul style="padding-left: 1.5rem; line-height: 1.6; margin-bottom: 2rem;">
        <li style="margin-bottom: 0.5rem;">
          <strong>desktopCloseBehavior</strong> : Permet de choisir si le menu doit être totalement masqué
          (<code>hidden</code>, comportement par défaut) ou réduit à ses icônes (<code>rail</code>) lors de la fermeture
          sur ordinateur.
        </li>
        <li style="margin-bottom: 0.5rem;">
          <strong>Directive ktSidenavToggle</strong> : Peut être posée sur n'importe quel élément interactif (bouton)
          pour basculer le menu. Elle expose son état (<code>isRail</code>, <code>isHidden</code>,
          <code>isExpanded</code>) pour une interface dynamique (ex: changement d'icône).
        </li>
        <li style="margin-bottom: 0.5rem;">
          <strong>Accessibilité (a11y)</strong> : Les attributs <code>aria-hidden</code> et la gestion du focus via
          <code>CdkTrapFocus</code> (sur mobile) sont gérés automatiquement.
        </li>
      </ul>
    </div>
  `,
})
export class LayoutDemo {}
