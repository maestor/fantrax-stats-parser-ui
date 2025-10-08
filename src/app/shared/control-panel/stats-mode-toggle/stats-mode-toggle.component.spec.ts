import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatsModeToggleComponent } from './stats-mode-toggle.component';
import { FilterService } from '@services/filter.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CommonModule } from '@angular/common';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';

describe('StatsModeToggleComponent', () => {
  let component: StatsModeToggleComponent;
  let fixture: ComponentFixture<StatsModeToggleComponent>;
  let filterService: FilterService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatsModeToggleComponent, MatSlideToggleModule, CommonModule],
      providers: [FilterService],
    }).compileComponents();

    fixture = TestBed.createComponent(StatsModeToggleComponent);
    component = fixture.componentInstance;
    filterService = TestBed.inject(FilterService);
    fixture.detectChanges();
  });

  it('should reflect statsPerGame from player filters', (done) => {
    component.context = 'player';
    filterService.updatePlayerFilters({ statsPerGame: true });
    component.ngOnInit();
    setTimeout(() => {
      expect(component.statsPerGame).toBeTrue();
      done();
    });
  });

  it('should reflect statsPerGame from goalie filters', (done) => {
    component.context = 'goalie';
    filterService.updateGoalieFilters({ statsPerGame: true });
    component.ngOnInit();
    setTimeout(() => {
      expect(component.statsPerGame).toBeTrue();
      done();
    });
  });

  it('should update player filters when toggleMode is called', (done) => {
    component.context = 'player';
    const event = { checked: true } as MatSlideToggleChange;

    component.toggleMode(event);

    filterService.playerFilters$.subscribe((filters) => {
      expect(filters.statsPerGame).toBeTrue();
      done();
    });
  });

  it('should update goalie filters when toggleMode is called', (done) => {
    component.context = 'goalie';
    const event = { checked: false } as MatSlideToggleChange;

    component.toggleMode(event);

    filterService.playerFilters$.subscribe((filters) => {
      expect(filters.statsPerGame).toBeTrue();
      done();
    });
  });
});
