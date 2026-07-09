export * from './dialog-title.directive';
export * from './dialog-description.directive';
export * from './dialog-close.directive';
export * from './dialog-structure';
export * from './dialog-config';
// Point d'entrée recommandé pour implémenter un dialog : `defineKtDialog<Data, Résultat>()`
// (contrat typé co-localisé → injectData / injectRef / injectOpener). La fonction bas-niveau
// `injectKtDialogOpener` reste exportée mais est à éviter par défaut.
export * from './dialog-opener';
export * from './dialog-container';

export * from './dialog-imports';

export * from './dialog-helpers';
