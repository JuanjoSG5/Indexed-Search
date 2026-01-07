import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XIcon } from './x-icon';

describe('XIcon', () => {
  let component: XIcon;
  let fixture: ComponentFixture<XIcon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [XIcon]
    })
    .compileComponents();

    fixture = TestBed.createComponent(XIcon);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
