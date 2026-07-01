import { InjectionToken } from '@angular/core';

export interface KtDisclosureInterface {
  readonly contentId: string;
  readonly expanded: () => boolean;
  toggle(): void;
}

export const KT_DISCLOSURE = new InjectionToken<KtDisclosureInterface>('KT_DISCLOSURE');
