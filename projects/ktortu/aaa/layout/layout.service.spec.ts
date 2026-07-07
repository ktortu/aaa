import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { KtLayoutService } from './layout.service';
import { KtViewport } from '@ktortu/aaa/cdk';

class MockKtViewport {
  isMobile = signal(false);
}

describe('KtLayoutService', () => {
  let service: KtLayoutService;
  let viewport: MockKtViewport;

  beforeEach(() => {
    viewport = new MockKtViewport();
    TestBed.configureTestingModule({
      providers: [KtLayoutService, { provide: KtViewport, useValue: viewport }],
    });
    service = TestBed.inject(KtLayoutService);
  });

  describe('desktop environment', () => {
    beforeEach(() => {
      viewport.isMobile.set(false);
    });

    it('should initialize with expanded state by default', () => {
      expect(service.isExpanded()).toBe(true);
      expect(service.isRail()).toBe(false);
      expect(service.isHidden()).toBe(false);
    });

    it('should toggle between expanded and default desktop behavior (hidden)', () => {
      expect(service.isExpanded()).toBe(true);
      service.toggle();
      expect(service.isHidden()).toBe(true);
      service.toggle();
      expect(service.isExpanded()).toBe(true);
    });

    it('should toggle between expanded and rail when desktopCloseBehavior is rail', () => {
      service.desktopCloseBehavior.set('rail');
      expect(service.isExpanded()).toBe(true);

      service.toggle();
      expect(service.isRail()).toBe(true);

      service.toggle();
      expect(service.isExpanded()).toBe(true);
    });

    it('should allow setting state directly via close() and open()', () => {
      service.desktopCloseBehavior.set('rail');
      service.close();
      expect(service.isRail()).toBe(true);
    });

    it('isMobileOpen should always be false on desktop', () => {
      expect(service.isMobileOpen()).toBe(false);

      // Even if state is expanded, it's a desktop open, not a mobile open
      service.open();
      expect(service.isMobileOpen()).toBe(false);
    });
  });

  describe('mobile environment', () => {
    beforeEach(() => {
      viewport.isMobile.set(true);
    });

    it('should consider expanded state as mobile open', () => {
      service.open();
      expect(service.isMobileOpen()).toBe(true);
    });

    it('should consider hidden state as mobile closed', () => {
      service.close();
      expect(service.isMobileOpen()).toBe(false);
    });

    it('toggle should switch between expanded and hidden on mobile, ignoring rail behavior', () => {
      service.desktopCloseBehavior.set('rail');
      service.close();

      service.toggle();
      expect(service.isExpanded()).toBe(false);
      expect(service.isMobileOpen()).toBe(true); // Since it's mobile, we check isMobileOpen

      service.toggle();
      expect(service.isHidden()).toBe(true);
      expect(service.isMobileOpen()).toBe(false);
    });

    it('close method should always set state to hidden on mobile', () => {
      service.open();
      expect(service.isMobileOpen()).toBe(true);

      service.close();
      expect(service.isHidden()).toBe(true);
      expect(service.isMobileOpen()).toBe(false);
    });
  });
});
