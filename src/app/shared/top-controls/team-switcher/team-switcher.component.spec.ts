import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { fireEvent, render, screen } from '@testing-library/angular';
import { Subject, of } from 'rxjs';

import { AppComponent } from '../../../app.component';
import {
  getBehaviorTestConfig,
  openDashboardSettingsDrawer,
  polyfillJsdom,
  seedLocalStorage,
  seasonsFixture,
  slicedGoalies,
  slicedPlayers,
  waitForBehaviorAssertion,
} from '../../../testing/behavior-test-utils';
import type { Goalie, Player, Season } from '@services/api.service';

describe('TeamSwitcherComponent — desktop user flow', { timeout: 60_000 }, () => {
  beforeEach(() => {
    polyfillJsdom();
    seedLocalStorage();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('switches team in place and resets report type to regular', async () => {
    await render(AppComponent, getBehaviorTestConfig({ isMobile: false }));
    const router = TestBed.inject(Router);

    const firstPlayerName = slicedPlayers[0].name;
    await screen.findByText(firstPlayerName, {}, { timeout: 15_000 });
    await openDashboardSettingsDrawer();

    const reportCombobox = screen.getByRole('combobox', { name: /reportType\.selector/ });
    fireEvent.click(reportCombobox);

    const playoffsOption = await screen.findByRole('option', { name: 'reportType.playoffs' });
    fireEvent.click(playoffsOption);

    await vi.waitFor(() => {
      expect(reportCombobox).toHaveTextContent('reportType.playoffs');
    });

    const teamCombobox = screen.getByRole('combobox', { name: /team\.selector/ });
    fireEvent.click(teamCombobox);

    const dallasOption = await screen.findByRole('option', { name: 'Dallas Stars' });
    fireEvent.click(dallasOption);

    await vi.waitFor(() => {
      expect(teamCombobox).toHaveTextContent('Dallas Stars');
      expect(reportCombobox).toHaveTextContent('reportType.regular');
      expect(router.url).toBe('/');
    });
  });

  it('keeps goalie stats active while switching teams and refreshes goalie data', async () => {
    const dallasGoalies = [
      { ...slicedGoalies[0], id: 'dallas-demo-goalie', name: 'Dallas Demo Goalie' },
    ] as unknown as Goalie[];
    const getGoalieData = vi.fn((params: { teamId?: string }) =>
      params.teamId === '29'
        ? of(dallasGoalies)
        : of(slicedGoalies as unknown as Goalie[])
    );

    const { fixture } = await render(
      AppComponent,
      getBehaviorTestConfig({
        isMobile: false,
        getGoalieData,
      })
    );
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/goalie-stats');

    await waitForBehaviorAssertion(fixture, () => {
      expect(screen.getByText(slicedGoalies[0].name)).toBeInTheDocument();
    });
    await openDashboardSettingsDrawer();

    const teamCombobox = screen.getByRole('combobox', { name: /team\.selector/ });
    fireEvent.click(teamCombobox);
    fireEvent.click(await screen.findByRole('option', { name: 'Dallas Stars' }));

    await waitForBehaviorAssertion(fixture, () => {
      expect(router.url).toBe('/goalie-stats');
      expect(teamCombobox).toHaveTextContent('Dallas Stars');
      expect(screen.getByText('Dallas Demo Goalie')).toBeInTheDocument();
      expect(screen.queryByText(slicedGoalies[0].name)).not.toBeInTheDocument();
    });
  });

  it('clears stale combined rows while the new team start season is still resolving, then shows the new team data', async () => {
    const dallasSeasons$ = new Subject<Season[]>();
    const dallasPlayers = [
      { ...slicedPlayers[0], id: 'dallas-demo', name: 'Dallas Demo' },
    ] as unknown as Player[];
    const getPlayerData = vi.fn((params: { teamId?: string }) =>
      params.teamId === '29'
        ? of(dallasPlayers)
        : of(slicedPlayers as unknown as Player[])
    );

    const { fixture } = await render(
      AppComponent,
      getBehaviorTestConfig({
        isMobile: false,
        getSeasons: (_reportType, teamId) =>
          teamId === '29' ? dallasSeasons$.asObservable() : of(seasonsFixture),
        getPlayerData,
      })
    );

    await screen.findByText(slicedPlayers[0].name, {}, { timeout: 5_000 });
    await openDashboardSettingsDrawer();

    const teamCombobox = screen.getByRole('combobox', { name: /team\.selector/ });
    fireEvent.click(teamCombobox);
    fireEvent.click(await screen.findByRole('option', { name: 'Dallas Stars' }));

    await waitForBehaviorAssertion(fixture, () => {
      expect(screen.queryByText(slicedPlayers[0].name)).not.toBeInTheDocument();
      expect(screen.queryByText('Dallas Demo')).not.toBeInTheDocument();
    });

    dallasSeasons$.next([{ season: 2015, text: '2015-2016' } as Season]);
    dallasSeasons$.complete();

    await waitForBehaviorAssertion(fixture, () => {
      expect(teamCombobox).toHaveTextContent('Dallas Stars');
      expect(screen.queryByText(slicedPlayers[0].name)).not.toBeInTheDocument();
      expect(getPlayerData).toHaveBeenCalledWith(
        expect.objectContaining({ teamId: '29', startFrom: 2015 })
      );
    });
  });
});
