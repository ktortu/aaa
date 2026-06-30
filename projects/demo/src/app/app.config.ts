import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideKtDialogDefaults } from '@ktortu/aaa/dialog';
import { provideKtDefaultFR } from '@ktortu/aaa/i18n';

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
