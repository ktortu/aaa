import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThemeDialog } from './theme-dialog';

describe('ThemeDialog', () => {
  let component: ThemeDialog;
  let fixture: ComponentFixture<ThemeDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
