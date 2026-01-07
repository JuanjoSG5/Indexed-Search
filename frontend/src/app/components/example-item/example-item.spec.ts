import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExampleItem } from './example-item';

describe('PreselectedItem', () => {
  let component: ExampleItem;
  let fixture: ComponentFixture<ExampleItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExampleItem]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExampleItem);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
