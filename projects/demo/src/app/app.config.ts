import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideKtDialogDefaults } from '@ktortu/aaa/dialog';
import { provideKtDefaultFR } from '@ktortu/aaa/i18n';
import { provideKtIcon } from '@ktortu/aaa/icon';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      }),
    ),
    provideKtDialogDefaults(),
    // Registre de police d'icônes de la démo (racine) : la primitive [ktIcon] restitue ainsi le
    // rendu des anciens spans manuels (Material Symbols Outlined, FILL 0 / wght 300).
    provideKtIcon({
      fonts: { outlined: { family: 'Material Symbols Outlined', variationSettings: "'FILL' 0, 'wght' 300" } },
      defaultFont: 'outlined',
    }),
    // Toute la lib en français en un appel. On ne surcharge que les quelques libellés select
    // propres à cette démo qui diffèrent du dictionnaire FR par défaut (placeholders, etc.).
    provideKtDefaultFR({
      select: {
        placeholder: 'Choisir...',
        emptyText: 'Aucun résultat',
        filterPlaceholder: 'Rechercher...',
        filterLabel: 'Filtrer',
      },
    }),
  ],
};
