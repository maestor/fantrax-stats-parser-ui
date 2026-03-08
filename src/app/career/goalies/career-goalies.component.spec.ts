import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { CareerGoaliesComponent } from './career-goalies.component';
import { ApiService } from '@services/api.service';
import { careerGoaliesFixture } from '../../testing/behavior-test-utils';

describe('CareerGoaliesComponent', () => {
  function createComponent(apiServiceMock: Partial<ApiService>) {
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });

    return TestBed.runInInjectionContext(() => new CareerGoaliesComponent());
  }

  it('loads goalie career rows and formats season numbers for display', () => {
    const component = createComponent({
      getCareerGoalies: () => of(careerGoaliesFixture),
    });

    component.ngOnInit();

    expect(component.searchLabelKey).toBe('table.playerSearch');
    expect(component.apiError).toBe(false);
    expect(component.loading).toBe(false);
    expect(component.data[0]).toEqual(careerGoaliesFixture[0]);
    expect(
      component.formatCell(component.data[0], 'firstSeason', component.data[0].firstSeason)
    ).toBe('2015-16');
    expect(component.formatCell(component.data[0], 'regularGames', undefined)).toBe('-');
  });

  it('shows an API error state when career goalies loading fails', () => {
    const component = createComponent({
      getCareerGoalies: () => throwError(() => new Error('career goalies failed')),
    });

    component.ngOnInit();

    expect(component.data).toEqual([]);
    expect(component.apiError).toBe(true);
    expect(component.loading).toBe(false);
  });
});
