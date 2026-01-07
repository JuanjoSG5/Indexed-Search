import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LinkedinIcon } from './linkedin-icon';

describe('LinkedinIcon', () => {
  let component: LinkedinIcon;
  let fixture: ComponentFixture<LinkedinIcon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LinkedinIcon]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LinkedinIcon);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
