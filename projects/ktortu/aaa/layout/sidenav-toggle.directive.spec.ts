import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KtSidenavToggleDirective } from './sidenav-toggle.directive';
import { KtLayoutService } from './layout.service';
import { KtViewport } from '@ktortu/aaa/cdk';
import { signal } from '@angular/core';

class MockKtViewport {
  isMobile = signal(false);
}

@Component({
  imports: [KtSidenavToggleDirective],
  providers: [KtLayoutService],
  template: `
    <button ktSidenavToggle #btn="ktSidenavToggle" (click)="onClick()">
      Toggle
      @if (btn.isRail()) {
        <span>Rail</span>
      }
      @if (btn.isHidden()) {
        <span>Hidden</span>
      }
      @if (btn.isExpanded()) {
        <span>Expanded</span>
      }
    </button>
  `,
})
class TestHost {
  clicked = false;
  onClick() {
    this.clicked = true;
  }
}

describe('KtSidenavToggleDirective', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let service: KtLayoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [{ provide: KtViewport, useValue: new MockKtViewport() }],
    });

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    service = fixture.debugElement.children[0].injector.get(KtLayoutService);
  });

  it('should toggle layout state on click', () => {
    fixture.detectChanges();
    expect(service.isExpanded()).toBe(true);

    const button = fixture.nativeElement.querySelector('button');
    button.click();

    // Clicking toggles to hidden by default desktop behavior
    expect(service.isHidden()).toBe(true);
    expect(host.clicked).toBe(true); // Should not prevent default handlers
  });

  it('should expose layout state through the exported instance', () => {
    // Start expanded
    fixture.detectChanges();
    let text = fixture.nativeElement.textContent;
    expect(text).toContain('Expanded');
    expect(text).not.toContain('Rail');
    expect(text).not.toContain('Hidden');

    // Switch to hidden
    service.close();
    fixture.detectChanges();
    text = fixture.nativeElement.textContent;
    expect(text).toContain('Hidden');

    // Switch to rail
    service.desktopCloseBehavior.set('rail');
    service.close();
    fixture.detectChanges();
    text = fixture.nativeElement.textContent;
    expect(text).toContain('Rail');
  });
});
