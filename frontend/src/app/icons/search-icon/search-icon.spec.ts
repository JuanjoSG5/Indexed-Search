import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchIcon } from './search-icon';

describe('SearchIcon', () => {
  let component: SearchIcon;
  let fixture: ComponentFixture<SearchIcon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchIcon]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchIcon);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
