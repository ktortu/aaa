import { Directive } from '@angular/core';
import { KtTabScroller } from './tab-scroller';

/**
 * @deprecated Utilisez {@link KtTabScroller} (sélecteur `[ktTabScroller]`) : même défilement de
 * l'onglet sélectionné dans la vue, plus la pagination par chevrons. `ktTabScroll` reste un **alias
 * fonctionnel** (il applique `KtTabScroller` comme directive hôte) et sera retiré dans une version
 * majeure ultérieure.
 *
 * Note : depuis cette version, une liste pilotée par `ktTabScroll`/`ktTabScroller` masque sa
 * scrollbar native par défaut (les chevrons / ombres prennent le relais). Réafficher la barre via
 * `--tab-scroller-scrollbar: thin`.
 */
@Directive({
  selector: '[ngTabList][ktTabScroll]',
  exportAs: 'ktTabScroll',
  hostDirectives: [KtTabScroller],
})
export class KtTabScroll {}
