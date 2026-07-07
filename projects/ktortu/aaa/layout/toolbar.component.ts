import { Component } from '@angular/core';

/**
 * Barre d'outils supérieure (Toolbar / Top app bar).
 * Se place généralement dans un `kt-layout`.
 */
@Component({
  selector: 'kt-toolbar',
  standalone: true,
  host: {
    class: 'kt-toolbar',
    role: 'banner',
  },
  template: `<ng-content></ng-content>`,
})
export class KtToolbarComponent {}
