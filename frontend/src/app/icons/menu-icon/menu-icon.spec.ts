import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuIcon } from './menu-icon';

describe('MenuIcon', () => {
  let component: MenuIcon;
  let fixture: ComponentFixture<MenuIcon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuIcon]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuIcon);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
