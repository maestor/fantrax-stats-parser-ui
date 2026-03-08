import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { CareerPlayersComponent } from './career-players.component';
import { ApiService } from '@services/api.service';
import { careerPlayersFixture } from '../../testing/behavior-test-utils';

describe('CareerPlayersComponent', () => {
  function createComponent(apiServiceMock: Partial<ApiService>) {
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });

    return TestBed.runInInjectionContext(() => new CareerPlayersComponent());
  }

  it('loads career players and formats position inline with the displayed name', () => {
    const component = createComponent({
      getCareerPlayers: () => of(careerPlayersFixture),
    });

    component.ngOnInit();

    expect(component.searchLabelKey).toBe('table.careerPlayerSearch');
    expect(component.apiError).toBe(false);
    expect(component.loading).toBe(false);
    expect(component.data[0]).toEqual(careerPlayersFixture[0]);
    expect(
      component.formatCell(component.data[0], 'name', component.data[0].name)
    ).toBe(`${component.data[0].position} ${component.data[0].name}`);
    expect(
      component.formatCell(component.data[0], 'firstSeason', component.data[0].firstSeason)
    ).toBe('2012-13');
    expect(component.formatCell(component.data[0], 'regularGames', undefined)).toBe('-');
    expect(
      component.formatCell({ ...component.data[0], position: 'D' }, 'name', undefined)
    ).toBe('D -');
  });

  it('shows an API error state when career players loading fails', () => {
    const component = createComponent({
      getCareerPlayers: () => throwError(() => new Error('career players failed')),
    });

    component.ngOnInit();

    expect(component.data).toEqual([]);
    expect(component.apiError).toBe(true);
    expect(component.loading).toBe(false);
  });
});
