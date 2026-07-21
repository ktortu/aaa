import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KtNavItemComponent } from './nav-item.component';
import { KtIcon } from '@ktortu/aaa/icon';
import { KtLayoutService } from './layout.service';

@Component({
  imports: [KtNavItemComponent, KtIcon],
  template: `
    <kt-nav-item label="Slot 1">
      <span kt-icon></span>
    </kt-nav-item>
    <kt-nav-item label="Slot 2">
      <span ktIcon="home"></span>
    </kt-nav-item>
    <kt-nav-item label="Slot 3">
      <span kt-icon [ktIcon]="'settings'"></span>
    </kt-nav-item>
  `,
})
class TestHost {}

describe('KtNavItemComponent', () => {
  let fixture: ComponentFixture<TestHost>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [KtLayoutService],
    });
    fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
  });

  it('should project element with kt-icon attribute', () => {
    const items = fixture.nativeElement.querySelectorAll('.kt-nav-item');
    const iconContainer = items[0].querySelector('.kt-nav-item-icon');
    expect(iconContainer.querySelector('span[kt-icon]')).toBeTruthy();
  });

  it('should project element with ktIcon directive attribute', () => {
    const items = fixture.nativeElement.querySelectorAll('.kt-nav-item');
    const iconContainer = items[1].querySelector('.kt-nav-item-icon');
    expect(iconContainer.querySelector('.kt-icon')).toBeTruthy(); // span ktIcon="home" has .kt-icon class
  });

  it('should project element with both attributes', () => {
    const items = fixture.nativeElement.querySelectorAll('.kt-nav-item');
    const iconContainer = items[2].querySelector('.kt-nav-item-icon');
    expect(iconContainer.querySelector('span[kt-icon].kt-icon')).toBeTruthy();
  });
});
