import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { KtIcon } from '@ktortu/aaa/icon';

@Component({
  selector: 'kt-foundations-index',
  imports: [RouterLink, KtIcon],
  template: `
    <div style="max-width: 900px; margin: 0 auto; padding: 2rem;">
      <h1 style="margin-bottom: 2rem; font-size: 2.5rem; font-weight: 300; letter-spacing: -0.02em;">Fondations</h1>
      <p style="font-size: 1.125rem; color: var(--kt-muted, #666); margin-bottom: 3rem; line-height: 1.6;">
        Découvrez les bases du design system : tokens, couleurs, typographie, et principes d'accessibilité.
      </p>

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
        <a
          routerLink="/foundations/tokens"
          style="display: flex; flex-direction: column; gap: 1rem; padding: 1.5rem; border-radius: 12px; background: var(--kt-surface); border: 1px solid var(--kt-outline); text-decoration: none; color: inherit; transition: transform 0.2s, box-shadow 0.2s;"
          onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)';"
          onmouseout="this.style.transform='none'; this.style.boxShadow='none';"
        >
          <div
            style="width: 48px; height: 48px; border-radius: 8px; background: color-mix(in oklab, var(--kt-primary) 15%, transparent); color: var(--kt-primary); display: flex; align-items: center; justify-content: center;"
          >
            <span ktIcon="design_services" size="24px"></span>
          </div>
          <h2 style="margin: 0; font-size: 1.25rem; font-weight: 500;">Tokens CSS</h2>
          <p style="margin: 0; color: var(--kt-muted); font-size: 0.9rem; line-height: 1.5;">
            Variables CSS pour les couleurs, espaces, typographie et formes.
          </p>
        </a>

        <a
          routerLink="/foundations/icons"
          style="display: flex; flex-direction: column; gap: 1rem; padding: 1.5rem; border-radius: 12px; background: var(--kt-surface); border: 1px solid var(--kt-outline); text-decoration: none; color: inherit; transition: transform 0.2s, box-shadow 0.2s;"
          onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)';"
          onmouseout="this.style.transform='none'; this.style.boxShadow='none';"
        >
          <div
            style="width: 48px; height: 48px; border-radius: 8px; background: color-mix(in oklab, var(--kt-primary) 15%, transparent); color: var(--kt-primary); display: flex; align-items: center; justify-content: center;"
          >
            <span ktIcon="interests" size="24px"></span>
          </div>
          <h2 style="margin: 0; font-size: 1.25rem; font-weight: 500;">Icônes</h2>
          <p style="margin: 0; color: var(--kt-muted); font-size: 0.9rem; line-height: 1.5;">
            Primitive autonome [ktIcon] : ligatures, polices à classes (Font Awesome, SVG), tailles, couleur,
            accessibilité.
          </p>
        </a>

        <a
          routerLink="/foundations/i18n"
          style="display: flex; flex-direction: column; gap: 1rem; padding: 1.5rem; border-radius: 12px; background: var(--kt-surface); border: 1px solid var(--kt-outline); text-decoration: none; color: inherit; transition: transform 0.2s, box-shadow 0.2s;"
          onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)';"
          onmouseout="this.style.transform='none'; this.style.boxShadow='none';"
        >
          <div
            style="width: 48px; height: 48px; border-radius: 8px; background: color-mix(in oklab, var(--kt-primary) 15%, transparent); color: var(--kt-primary); display: flex; align-items: center; justify-content: center;"
          >
            <span ktIcon="language" size="24px"></span>
          </div>
          <h2 style="margin: 0; font-size: 1.25rem; font-weight: 500;">Internationalisation</h2>
          <p style="margin: 0; color: var(--kt-muted); font-size: 0.9rem; line-height: 1.5;">
            Mécanismes de traduction et d'adaptation des composants.
          </p>
        </a>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoundationsIndex {}
