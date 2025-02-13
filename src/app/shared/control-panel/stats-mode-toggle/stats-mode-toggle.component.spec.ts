import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatsModeToggleComponent } from './stats-mode-toggle.component';

describe('StatsModeToggleComponent', () => {
  let component: StatsModeToggleComponent;
  let fixture: ComponentFixture<StatsModeToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatsModeToggleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatsModeToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
