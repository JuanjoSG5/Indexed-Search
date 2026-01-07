import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SadFace } from './sad-face';

describe('SadFace', () => {
  let component: SadFace;
  let fixture: ComponentFixture<SadFace>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SadFace]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SadFace);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
