import { TestBed } from '@angular/core/testing';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/angular';
import { Subject } from 'rxjs';
import { TranslateTestingModule } from '@testing/translate-testing';
import { CareerPlayersComponent } from './career-players.component';
import { ApiService, CareerPlayerListItem } from '@services/api.service';
import { FooterVisibilityService } from '@services/footer-visibility.service';
import { careerPlayersFixture, polyfillJsdom, provideDisabledMaterialAnimations } from '../../testing/behavior-test-utils';

describe('CareerPlayersComponent', () => {
  beforeEach(() => polyfillJsdom());

  async function setup() {
    const response = new Subject<CareerPlayerListItem[]>();
    const view = await render(CareerPlayersComponent, {
      imports: [TranslateTestingModule],
      providers: [
        provideDisabledMaterialAnimations(),
        { provide: ApiService, useValue: { getCareerPlayers: () => response } },
      ],
    });
    return { ...view, response, footer: TestBed.inject(FooterVisibilityService) };
  }

  it('shows loading, then formatted career rows that can be searched', async () => {
    const { response, footer } = await setup();
    expect(screen.getByText('table.loading')).toBeInTheDocument();
    expect(footer.footerVisible()).toBe(false);
    const row = careerPlayersFixture[0];
    response.next([row]);
    response.complete();
    const cell = await screen.findByRole('cell', { name: `${row.position} ${row.name}` });
    expect(within(cell.closest('[role="row"]') as HTMLElement).getAllByRole('cell', { name: '2012-13' }).length).toBeGreaterThan(0);
    expect(screen.queryByText('table.loading')).not.toBeInTheDocument();
    expect(footer.footerVisible()).toBe(true);
    fireEvent.input(screen.getByRole('searchbox', { name: 'table.careerPlayerSearch' }), { target: { value: 'no matching career' } });
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
    response.next(careerPlayersFixture);
    response.complete();
    await waitFor(() => expect(footer.footerVisible()).toBe(false));
  });
});
