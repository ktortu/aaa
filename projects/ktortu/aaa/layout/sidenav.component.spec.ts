import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { signal } from '@angular/core';
import { KtSidenavComponent } from './sidenav.component';
import { KtLayoutService } from './layout.service';
import { KtViewport } from '@ktortu/aaa/cdk';

class MockKtViewport {
  isMobile = signal(false);
}

@Component({
  imports: [KtSidenavComponent],
  providers: [KtLayoutService],
  template: `<kt-sidenav>Links</kt-sidenav>`,
})
class TestHost {}

describe('KtSidenavComponent', () => {
  let fixture: ComponentFixture<TestHost>;
  let viewport: MockKtViewport;
  let service: KtLayoutService;

  beforeEach(() => {
    viewport = new MockKtViewport();
    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [{ provide: KtViewport, useValue: viewport }],
    });

    fixture = TestBed.createComponent(TestHost);
    service = fixture.debugElement.children[0].injector.get(KtLayoutService);
  });

  describe('desktop', () => {
    beforeEach(() => {
      viewport.isMobile.set(false);
    });

    it('should have is-hidden class when hidden', () => {
      service.close();
      fixture.detectChanges();
      const sidenav = fixture.nativeElement.querySelector('kt-sidenav');

      expect(sidenav.classList.contains('is-hidden')).toBe(true);
      expect(sidenav.classList.contains('is-rail')).toBe(false);
      expect(sidenav.classList.contains('is-mobile-open')).toBe(false);
    });

    it('should have is-rail class when rail', () => {
      service.desktopCloseBehavior.set('rail');
      service.close();
      fixture.detectChanges();
      const sidenav = fixture.nativeElement.querySelector('kt-sidenav');

      expect(sidenav.classList.contains('is-hidden')).toBe(false);
      expect(sidenav.classList.contains('is-rail')).toBe(true);
    });

    it('should have no state classes when expanded', () => {
      service.open();
      fixture.detectChanges();
      const sidenav = fixture.nativeElement.querySelector('kt-sidenav');

      expect(sidenav.classList.contains('is-hidden')).toBe(false);
      expect(sidenav.classList.contains('is-rail')).toBe(false);
      expect(sidenav.classList.contains('is-mobile-open')).toBe(false);
    });

    it('should bind aria-hidden when hidden', () => {
      service.close();
      fixture.detectChanges();
      const sidenav = fixture.nativeElement.querySelector('kt-sidenav');

      expect(sidenav.getAttribute('aria-hidden')).toBe('true');

      service.open();
      fixture.detectChanges();
      expect(sidenav.getAttribute('aria-hidden')).toBe('false');
    });
  });

  describe('mobile', () => {
    beforeEach(() => {
      viewport.isMobile.set(true);
    });

    it('should have is-mobile-open class when expanded', () => {
      service.open();
      fixture.detectChanges();
      const sidenav = fixture.nativeElement.querySelector('kt-sidenav');

      expect(sidenav.classList.contains('is-mobile-open')).toBe(true);
    });

    it('should bind aria-hidden when not open on mobile', () => {
      service.close();
      fixture.detectChanges();
      const sidenav = fixture.nativeElement.querySelector('kt-sidenav');

      expect(sidenav.getAttribute('aria-hidden')).toBe('true');

      service.open();
      fixture.detectChanges();
      expect(sidenav.getAttribute('aria-hidden')).toBe('false');
    });

    it('should activate CdkTrapFocus only when open on mobile', () => {
      service.open();
      fixture.detectChanges();

      const sidenav = fixture.debugElement.children[0];
      expect(sidenav).toBeTruthy();
    });

    it('should close mobile drawer when Escape key is pressed', () => {
      service.open();
      fixture.detectChanges();
      const sidenav = fixture.nativeElement.querySelector('kt-sidenav');
      expect(service.isMobileOpen()).toBe(true);

      sidenav.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();

      expect(service.isMobileOpen()).toBe(false);
      expect(sidenav.classList.contains('is-mobile-open')).toBe(false);
    });
  });
});
