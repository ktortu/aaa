import { Directive, inject, input } from '@angular/core';
import { KT_SELECT_CONFIG, KtSelectConfigOptions } from './select-config';

/** Configure les `kt-select` d'un sous-arbre via DI (équivalent du Context provider de react-select).
    Alternative à un provider global de `KT_SELECT_CONFIG` : on pose la directive sur un conteneur et
    tous les `kt-select` descendants en héritent.

    ```html
    <div [ktSelectConfig]="{ placeholder: 'Choisir…', emptyText: 'Aucun résultat' }">
      <kt-select … />
    </div>
    ```

    La directive EST fournie comme `KT_SELECT_CONFIG` (`useExisting`) : les getters exposent l'objet
    bindé sous la forme `Partial<KtSelectConfigOptions>` attendue par le composant. */
@Directive({
  selector: '[ktSelectConfig]',
  providers: [
    {
      provide: KT_SELECT_CONFIG,
      // Vue `Partial<KtSelectConfigOptions>` calculée à la volée : chaque accès de clé résout
      // `input bindé ?? contexte parent hérité`. Un Proxy évite d'énumérer (et de maintenir à la
      // main) un getter par clé — toute nouvelle clé de `KtSelectConfigOptions` est couverte
      // automatiquement, sans risque de dérive entre les deux fichiers.
      useFactory: (directive: KtSelectConfig) =>
        new Proxy({} as Partial<KtSelectConfigOptions>, {
          get: (_target, key) => directive.resolve(key as keyof KtSelectConfigOptions),
        }),
      deps: [KtSelectConfig],
    },
  ],
})
export class KtSelectConfig {
  readonly ktSelectConfig = input<Partial<KtSelectConfigOptions>>({});

  /** Config héritée du contexte parent (provider global ou directive englobante) : la
      directive ne masque que les clés qu'elle définit, le reste continue d'en hériter. */
  private readonly parent = inject(KT_SELECT_CONFIG, { optional: true, skipSelf: true });

  /** Résout une clé : valeur bindée sur la directive, sinon valeur héritée du contexte parent. */
  resolve<K extends keyof KtSelectConfigOptions>(key: K): Partial<KtSelectConfigOptions>[K] {
    return this.ktSelectConfig()[key] ?? this.parent?.[key];
  }
}
