import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeasonSwitcherComponent } from './season-switcher.component';

describe('SeasonSwitcherComponent', () => {
  let component: SeasonSwitcherComponent;
  let fixture: ComponentFixture<SeasonSwitcherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeasonSwitcherComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeasonSwitcherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
