import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeasonSwitcherComponent } from './season-switcher.component';
import { FilterService } from '@services/filter.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';

describe('SeasonSwitcherComponent', () => {
  let component: SeasonSwitcherComponent;
  let fixture: ComponentFixture<SeasonSwitcherComponent>;
  let filterService: FilterService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SeasonSwitcherComponent,
        MatFormFieldModule,
        MatSelectModule,
        CommonModule,
      ],
      providers: [FilterService],
    }).compileComponents();

    fixture = TestBed.createComponent(SeasonSwitcherComponent);
    component = fixture.componentInstance;
    filterService = TestBed.inject(FilterService);
    fixture.detectChanges();
  });

  it('should select player season from service', (done) => {
    component.context = 'player';
    filterService.updatePlayerFilters({ season: 2021 });
    component.ngOnInit();
    setTimeout(() => {
      expect(component.selectedSeason).toBe(2021);
      done();
    });
  });

  it('should update goalie season on change', () => {
    component.context = 'goalie';
    component.changeSeason({ value: 2019 } as any);
    component.selectedSeason = 2019;
    component.ngOnInit();
    expect(component.selectedSeason).toBe(2019);
  });
});
