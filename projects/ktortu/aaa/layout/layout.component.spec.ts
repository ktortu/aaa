import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KtLayoutComponent } from './layout.component';
import { KtSidenavComponent } from './sidenav.component';
import { KtToolbarComponent } from './toolbar.component';
import { KtLayoutService } from './layout.service';
import { KtViewport } from '@ktortu/aaa/cdk';
import { signal } from '@angular/core';

@Component({
  imports: [KtLayoutComponent, KtSidenavComponent, KtToolbarComponent],
  providers: [KtLayoutService],
  template: `
    <kt-layout [desktopCloseBehavior]="behavior()">
      <kt-sidenav>Sidenav content</kt-sidenav>
      <kt-toolbar>Toolbar content</kt-toolbar>
      <div id="main-content">Main content</div>
    </kt-layout>
  `,
})
class TestHost {
  behavior = signal<'hidden' | 'rail'>('hidden');
}

class MockKtViewport {
  isMobile = signal(false);
}

describe('KtLayoutComponent', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let viewport: MockKtViewport;

  beforeEach(() => {
    viewport = new MockKtViewport();

    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [{ provide: KtViewport, useValue: viewport }],
    });

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;

    // We can get the KtLayoutService provided by the TestHost to spy on it or verify state
  });

  it('should render the layout structure', () => {
    fixture.detectChanges();
    const element = fixture.nativeElement;

    expect(element.querySelector('kt-layout')).toBeTruthy();
    expect(element.querySelector('.kt-layout-main-wrapper')).toBeTruthy();
    expect(element.querySelector('.kt-layout-main')).toBeTruthy();
    expect(element.querySelector('.kt-layout-backdrop')).toBeTruthy();

    // Content projection
    expect(element.querySelector('kt-sidenav')).toBeTruthy();
    expect(element.querySelector('kt-toolbar')).toBeTruthy();
    expect(element.querySelector('#main-content')).toBeTruthy();
  });

  it('should synchronize desktopCloseBehavior with the service', () => {
    fixture.detectChanges();
    const service = fixture.debugElement.children[0].injector.get(KtLayoutService);

    // Default is hidden
    expect(service.desktopCloseBehavior()).toBe('hidden');

    // Update input
    host.behavior.set('rail');
    fixture.detectChanges();

    expect(service.desktopCloseBehavior()).toBe('rail');
  });

  it('should toggle backdrop visibility based on mobile open state', () => {
    viewport.isMobile.set(true);
    fixture.detectChanges();

    const service = fixture.debugElement.children[0].injector.get(KtLayoutService);
    service.open();
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector('.kt-layout-backdrop');

    // State is expanded -> mobile open
    expect(backdrop.classList.contains('is-visible')).toBe(true);

    service.close();
    fixture.detectChanges();

    expect(backdrop.classList.contains('is-visible')).toBe(false);
  });

  it('should close mobile drawer when clicking on the backdrop', () => {
    viewport.isMobile.set(true);
    fixture.detectChanges();

    const service = fixture.debugElement.children[0].injector.get(KtLayoutService);
    service.open();
    fixture.detectChanges();
    expect(service.isMobileOpen()).toBe(true);

    const backdrop = fixture.nativeElement.querySelector('.kt-layout-backdrop');
    backdrop.click();
    fixture.detectChanges();

    expect(service.isMobileOpen()).toBe(false);
  });

  it('should auto-close the drawer if resizing from mobile (open) to desktop', () => {
    viewport.isMobile.set(true);
    fixture.detectChanges();

    const service = fixture.debugElement.children[0].injector.get(KtLayoutService);
    service.open();
    fixture.detectChanges();
    expect(service.isMobileOpen()).toBe(true);

    // Simulate resize to desktop
    viewport.isMobile.set(false);
    fixture.detectChanges();

    // Since it's desktop, mobileOpen is false, and it returns to the expanded state
    expect(service.isExpanded()).toBe(true);
    expect(service.isMobileOpen()).toBe(false);
  });
});
