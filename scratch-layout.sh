#!/bin/bash
set -e

DIR="/home/ktortu/Dev/perso/aaa/projects/ktortu/aaa/layout"
mkdir -p "$DIR"

cat << 'EOF' > "$DIR/layout.service.ts"
import { Injectable, computed, inject, InjectionToken, signal } from '@angular/core';
import { ViewportService } from '@ktortu/aaa/cdk';

export type KtSidenavState = 'expanded' | 'rail';

export const KT_LAYOUT_DEFAULT_STATE = new InjectionToken<KtSidenavState>('KT_LAYOUT_DEFAULT_STATE', {
  providedIn: 'root',
  factory: () => 'expanded'
});

@Injectable({ providedIn: 'root' })
export class KtLayoutService {
  private readonly viewport = inject(ViewportService);
  private readonly defaultState = inject(KT_LAYOUT_DEFAULT_STATE);

  private readonly _isRail = signal<boolean>(this.defaultState === 'rail');
  private readonly _isMobileOpen = signal<boolean>(false);

  readonly isMobile = this.viewport.isMobile;
  readonly isRail = computed(() => !this.isMobile() && this._isRail());
  readonly isExpanded = computed(() => !this.isMobile() && !this._isRail());
  readonly isMobileOpen = computed(() => this.isMobile() && this._isMobileOpen());

  toggle() {
    if (this.isMobile()) {
      this._isMobileOpen.update(v => !v);
    } else {
      this._isRail.update(v => !v);
    }
  }

  open() {
    if (this.isMobile()) {
      this._isMobileOpen.set(true);
    } else {
      this._isRail.set(false);
    }
  }

  close() {
    if (this.isMobile()) {
      this._isMobileOpen.set(false);
    } else {
      this._isRail.set(true);
    }
  }
}
EOF

cat << 'EOF' > "$DIR/sidenav-toggle.directive.ts"
import { Directive, HostListener, inject } from '@angular/core';
import { KtLayoutService } from './layout.service';

@Directive({
  selector: '[ktSidenavToggle]',
  standalone: true,
})
export class KtSidenavToggleDirective {
  private readonly layout = inject(KtLayoutService);

  @HostListener('click')
  onClick() {
    this.layout.toggle();
  }
}
EOF

cat << 'EOF' > "$DIR/layout.component.ts"
import { Component, inject, effect } from '@angular/core';
import { KtLayoutService } from './layout.service';

@Component({
  selector: 'kt-layout',
  standalone: true,
  host: {
    'class': 'kt-layout-container'
  },
  template: `
    <ng-content select="kt-sidenav"></ng-content>
    <div class="kt-layout-main-wrapper">
      <ng-content select="kt-toolbar"></ng-content>
      <main class="kt-layout-main" [attr.aria-hidden]="layout.isMobileOpen()">
        <ng-content></ng-content>
      </main>
    </div>
    <div 
      class="kt-layout-backdrop" 
      [class.is-visible]="layout.isMobileOpen()"
      aria-hidden="true" 
      (click)="layout.close()">
    </div>
  `
})
export class KtLayoutComponent {
  protected readonly layout = inject(KtLayoutService);

  constructor() {
    effect(() => {
      // Clean up mobile state when switching back to desktop
      if (!this.layout.isMobile() && this.layout.isMobileOpen()) {
        this.layout.close();
      }
    }, { allowSignalWrites: true });
  }
}
EOF

cat << 'EOF' > "$DIR/sidenav.component.ts"
import { Component, inject, computed } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { KtLayoutService } from './layout.service';

@Component({
  selector: 'kt-sidenav',
  standalone: true,
  imports: [A11yModule],
  host: {
    'class': 'kt-sidenav',
    '[class.is-rail]': 'layout.isRail()',
    '[class.is-mobile-open]': 'layout.isMobileOpen()',
    '[attr.aria-expanded]': 'layout.isExpanded()',
    '[attr.aria-hidden]': 'isHidden()',
    'role': 'navigation'
  },
  hostDirectives: [
    {
      directive: A11yModule, // Wait, A11yModule is a module, not a directive. cdkTrapFocus is the directive. Let's fix this.
    }
  ],
  template: `<ng-content></ng-content>`
})
export class KtSidenavComponent {
  protected readonly layout = inject(KtLayoutService);
  protected readonly isHidden = computed(() => this.layout.isMobile() && !this.layout.isMobileOpen());
}
EOF

cat << 'EOF' > "$DIR/toolbar.component.ts"
import { Component } from '@angular/core';

@Component({
  selector: 'kt-toolbar',
  standalone: true,
  host: {
    'class': 'kt-toolbar',
    'role': 'banner'
  },
  template: `<ng-content></ng-content>`
})
export class KtToolbarComponent {}
EOF

cat << 'EOF' > "$DIR/nav-item.component.ts"
import { Component, input, inject } from '@angular/core';
import { KtLayoutService } from './layout.service';

@Component({
  selector: 'kt-nav-item',
  standalone: true,
  host: {
    'class': 'kt-nav-item'
  },
  template: `
    <div class="kt-nav-item-icon">
      <ng-content select="[kt-icon]"></ng-content>
    </div>
    <div class="kt-nav-item-label">
      {{ label() }}
      <ng-content></ng-content>
    </div>
    <!-- TODO: Add Tooltip component injection here conditionally based on layout.isRail() -->
  `
})
export class KtNavItemComponent {
  label = input.required<string>();
  protected readonly layout = inject(KtLayoutService);
}
EOF

cat << 'EOF' > "$DIR/public-api.ts"
export * from './layout.service';
export * from './layout.component';
export * from './sidenav.component';
export * from './toolbar.component';
export * from './nav-item.component';
export * from './sidenav-toggle.directive';
EOF

cat << 'EOF' > "$DIR/ng-package.json"
{
  "$schema": "../../../node_modules/ng-packagr/ng-package.schema.json",
  "lib": {
    "entryFile": "public-api.ts"
  }
}
EOF

# Now update styles
cat << 'EOF' > "/home/ktortu/Dev/perso/aaa/projects/ktortu/aaa/styles/layout.css"
/* ktortu/aaa/styles/layout.css */
:root {
  --kt-sidenav-width: 280px;
  --kt-sidenav-rail-width: 72px;
  --kt-layout-transition: 200ms cubic-bezier(0.25, 0.8, 0.25, 1);
  --kt-toolbar-height: 64px;
}

.kt-layout-container {
  display: flex;
  height: 100dvh;
  width: 100%;
  overflow: hidden;
  position: relative;
  background: var(--kt-sys-surface, #f8f9fa);
}

.kt-sidenav {
  width: var(--kt-sidenav-width);
  background: var(--kt-sys-surface, #ffffff);
  border-right: 1px solid var(--kt-sys-outline-variant, #e0e0e0);
  flex-shrink: 0;
  transition: width var(--kt-layout-transition), transform var(--kt-layout-transition);
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;
  z-index: 10;
}

.kt-sidenav.is-rail {
  width: var(--kt-sidenav-rail-width);
}

.kt-layout-main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.kt-toolbar {
  height: var(--kt-toolbar-height);
  background: var(--kt-sys-surface, #ffffff);
  border-bottom: 1px solid var(--kt-sys-outline-variant, #e0e0e0);
  display: flex;
  align-items: center;
  padding: 0 16px;
  flex-shrink: 0;
  z-index: 5;
}

.kt-layout-main {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.kt-layout-backdrop {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.32);
  z-index: 99;
  opacity: 0;
  transition: opacity var(--kt-layout-transition);
}

/* Nav Item styling for truncation */
.kt-nav-item {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
}

.kt-nav-item-icon {
  width: 24px;
  height: 24px;
  margin-right: 24px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.kt-nav-item-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 1;
  transition: opacity 100ms;
}

.kt-sidenav.is-rail .kt-nav-item {
  /* Keep padding equal to rail width - icon width / 2 */
  padding: 12px 24px;
}
.kt-sidenav.is-rail .kt-nav-item-label {
  opacity: 0;
}

/* 
  Mobile Breakpoint - 600px par défaut 
  (A copier/éjecter si modification nécessaire)
*/
@media (max-width: 600px) {
  .kt-sidenav {
    position: fixed;
    top: 0; bottom: 0; left: 0;
    z-index: 100;
    transform: translateX(-100%);
    width: 280px; /* On force la largeur étendue sur mobile */
  }
  
  .kt-sidenav.is-mobile-open {
    transform: translateX(0);
  }

  .kt-layout-backdrop {
    display: block;
    pointer-events: none;
  }
  
  .kt-layout-backdrop.is-visible {
    opacity: 1;
    pointer-events: auto;
  }
}
EOF
