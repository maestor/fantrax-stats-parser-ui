import { TestBed } from '@angular/core/testing';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/angular';
import { Subject } from 'rxjs';
import { TranslateTestingModule } from '@testing/translate-testing';
import { CareerGoaliesComponent } from './career-goalies.component';
import { ApiService, CareerGoalieListItem } from '@services/api.service';
import { FooterVisibilityService } from '@services/footer-visibility.service';
import { careerGoaliesFixture, polyfillJsdom, provideDisabledMaterialAnimations } from '../../testing/behavior-test-utils';

describe('CareerGoaliesComponent', () => {
  beforeEach(() => polyfillJsdom());

  async function setup() {
    const response = new Subject<CareerGoalieListItem[]>();
    const view = await render(CareerGoaliesComponent, {
      imports: [TranslateTestingModule],
      providers: [
        provideDisabledMaterialAnimations(),
        { provide: ApiService, useValue: { getCareerGoalies: () => response } },
      ],
    });
    return { ...view, response, footer: TestBed.inject(FooterVisibilityService) };
  }

  it('shows loading, then formatted career rows that can be searched', async () => {
    const { response, footer } = await setup();
    expect(screen.getByText('table.loading')).toBeInTheDocument();
    expect(footer.footerVisible()).toBe(false);
    const row = careerGoaliesFixture[0];
    response.next([row]);
    response.complete();
    const cell = await screen.findByRole('cell', { name: row.name });
    expect(within(cell.closest('[role="row"]') as HTMLElement).getAllByRole('cell', { name: '2015-16' }).length).toBeGreaterThan(0);
    expect(screen.queryByText('table.loading')).not.toBeInTheDocument();
    expect(footer.footerVisible()).toBe(true);
    fireEvent.input(screen.getByRole('searchbox', { name: 'table.playerSearch' }), { target: { value: 'no matching career' } });
    expect(await screen.findByText('table.noSearchResults')).toBeInTheDocument();
  });

  it('finishes loading with the empty state for an empty response', async () => {
    const { response, footer } = await setup();
    response.next([]);
    response.complete();
    expect(await screen.findByText('table.noSearchResults')).toBeInTheDocument();
    expect(footer.footerVisible()).toBe(true);
  });

  it('shows the API error and releases the footer when loading fails', async () => {
    const { response, footer } = await setup();
    response.error(new Error('career request failed'));
    expect(await screen.findByText('table.apiUnavailable')).toBeInTheDocument();
    expect(screen.queryByText('table.loading')).not.toBeInTheDocument();
    expect(footer.footerVisible()).toBe(true);
  });

  it('ignores a late result after leaving the career page', async () => {
    const { response, fixture, footer } = await setup();
    fixture.destroy();
    footer.beginNavigation();
    response.next(careerGoaliesFixture);
    response.complete();
    await waitFor(() => expect(footer.footerVisible()).toBe(false));
  });
});
