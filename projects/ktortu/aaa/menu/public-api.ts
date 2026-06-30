import { KtMenu, KtMenuItem, KtMenuSeparator } from './menu';
import { KtMenuTrigger } from './menu-trigger';
import { KtMenuItemCheckbox, KtMenuItemRadio, KtMenuRadioGroup } from './menu-toggle';

export * from './menu';
export * from './menu-trigger';
export * from './menu-toggle';

/**
 * Import ergonomique de toute la famille menu (couche de THÈME ktortu) en une fois :
 * `imports: [KtMenuImports]` au lieu d'énumérer chaque directive. À composer avec les directives
 * d'`@angular/aria/menu` (`Menu`, `MenuItem`, `MenuTrigger`, `MenuContent`), qui apportent le
 * comportement accessible.
 */
export const KtMenuImports = [
  KtMenu,
  KtMenuItem,
  KtMenuSeparator,
  KtMenuTrigger,
  KtMenuItemCheckbox,
  KtMenuItemRadio,
  KtMenuRadioGroup,
] as const;
