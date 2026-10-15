import { render, screen, within } from '@testing-library/angular';
import { of } from 'rxjs';
import { ApiService, CareerHistory } from '@services/api.service';
import { ViewportService } from '@services/viewport.service';
import { TranslateTestingModule } from '@testing/translate-testing';
import { CareerHistoryComponent } from './career-history.component';

it('shows an undated source-to-expansion-team event at the bottom of the affected season', async () => {
  const history: CareerHistory = {
    id: '03l0t',
    coverage: { entryDraftSeasons: [], expansionDraftSeasons: [2021], openingDraftPresent: false, claimSeasons: [2021], tradeSeasons: [], completeness: 'unknown' },
    events: [
      { id: 'drop', type: 'drop', season: 2021, date: '2022-01-01T12:00:00Z', team: { id: '28', name: 'Seattle Kraken' } },
      { id: 'expansion-2021-28-19', type: 'expansion', season: 2021, date: null, fromTeam: { id: '19', name: 'Toronto Maple Leafs' }, team: { id: '28', name: 'Seattle Kraken' } },
    ],
  };
  await render(CareerHistoryComponent, {
    inputs: { id: '03l0t' },
    imports: [TranslateTestingModule],
    providers: [{ provide: ApiService, useValue: { getCareerHistory: () => of(history) } }, { provide: ViewportService, useValue: { isMobile$: of(false) } }],
  });
  const season = await screen.findByRole('region', { name: '2021-22' });
  const events = within(season).getAllByRole('listitem');
  expect(within(events[0]).getByRole('heading', { name: 'career.profile.events.drop' })).toBeInTheDocument();
  expect(within(events[1]).getByRole('heading', { name: 'career.profile.events.expansion' })).toBeInTheDocument();
  expect(within(events[1]).getByText('Toronto Maple Leafs → Seattle Kraken')).toBeInTheDocument();
  expect(events[1].querySelector('time')).toBeNull();
});
