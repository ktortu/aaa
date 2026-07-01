import { Routes } from '@angular/router';

/** Une page par démo (lazy `loadComponent`) pour isoler le debug et alléger le bundle initial.
    Les composants reviennent un par un ; seules les routes documentées sont câblées. */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: '@ktortu/aaa — Design system',
    loadComponent: () => import('./demos/home/home').then((m) => m.Home),
  },
  {
    path: 'foundations',
    pathMatch: 'full',
    redirectTo: 'foundations/tokens',
  },
  {
    path: 'foundations/tokens',
    title: 'Tokens CSS — Design system',
    loadComponent: () => import('./demos/foundations-demo/tokens-demo').then((m) => m.TokensDemo),
  },
  {
    path: 'foundations/icons',
    title: 'Gestion des icônes — Design system',
    loadComponent: () => import('./demos/foundations-demo/icons-demo').then((m) => m.IconsDemo),
  },
  {
    path: 'foundations/i18n',
    title: 'Internationalisation — Design system',
    loadComponent: () => import('./demos/foundations-demo/i18n-demo').then((m) => m.I18nDemo),
  },
  {
    path: 'outline',
    title: 'Apparence outline — Design system',
    loadComponent: () => import('./demos/outline-demo/outline-demo').then((m) => m.OutlineDemo),
  },
  {
    path: 'buttons',
    title: 'Boutons — Design system',
    loadComponent: () => import('./demos/buttons-demo/buttons-demo').then((m) => m.ButtonsDemo),
  },
  {
    path: 'tooltip',
    title: 'Tooltip — Design system',
    loadComponent: () => import('./demos/tooltip-demo/tooltip-demo').then((m) => m.TooltipDemo),
  },
  {
    path: 'forms',
    title: 'Formulaires — Design system',
    loadComponent: () => import('./demos/forms-demo/forms-demo').then((m) => m.FormsDemo),
  },
  {
    path: 'form-showcase',
    title: 'Formulaire (Signal Forms) — Design system',
    loadComponent: () => import('./demos/form-showcase-demo/form-showcase-demo').then((m) => m.FormShowcaseDemo),
  },
  {
    path: 'temporal',
    title: 'Temporal — Design system',
    loadComponent: () => import('./demos/temporal-demo/temporal-demo').then((m) => m.TemporalDemo),
  },
  {
    path: 'choice',
    title: 'Checkbox / Radio / Switch — Design system',
    loadComponent: () => import('./demos/choice-demo/choice-demo').then((m) => m.ChoiceDemo),
  },
  {
    path: 'select',
    title: 'Select — Design system',
    loadComponent: () => import('./demos/select-demo/select-demo').then((m) => m.SelectDemo),
  },
  {
    path: 'multi-select',
    title: 'Multi-Select — Design system',
    loadComponent: () => import('./demos/multi-select-demo/multi-select-demo').then((m) => m.MultiSelectDemo),
  },
  {
    path: 'chips',
    title: 'Chips — Design system',
    loadComponent: () => import('./demos/chips-demo/chips-demo').then((m) => m.ChipsDemo),
  },
  {
    path: 'dialog',
    title: 'Dialog — Design system',
    loadComponent: () => import('./demos/dialog-demo/dialog-demo').then((m) => m.DialogDemo),
  },
  {
    path: 'snackbar',
    title: 'Snackbar — Design system',
    loadComponent: () => import('./demos/snackbar-demo/snackbar-demo').then((m) => m.SnackbarDemo),
  },
  {
    path: 'card',
    title: 'Card — Design system',
    loadComponent: () => import('./demos/card-demo/card-demo').then((m) => m.CardDemo),
  },
  {
    path: 'tabs',
    title: 'Tabs — Design system',
    loadComponent: () => import('./demos/tabs-demo/tabs-demo').then((m) => m.TabsDemo),
  },
  {
    path: 'menu',
    title: 'Menu — Design system',
    loadComponent: () => import('./demos/menu-demo/menu-demo').then((m) => m.MenuDemo),
  },
  {
    path: 'disclosure',
    title: 'Disclosure — Design system',
    loadComponent: () => import('./demos/disclosure-demo/disclosure-demo').then((m) => m.DisclosureDemo),
  },
  {
    path: 'progress-bar',
    title: 'Progress Bar — Design system',
    loadComponent: () => import('./demos/progress-bar-demo/progress-bar-demo').then((m) => m.ProgressBarDemo),
  },
  { path: '**', redirectTo: '' },
];
