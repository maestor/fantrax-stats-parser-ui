import { fireEvent, render, screen } from '@testing-library/angular';
import { Subject, of, throwError } from 'rxjs';

import { AppComponent } from '../../../app.component';
import {
    getBehaviorTestConfig,
    polyfillJsdom,
    seedLocalStorage,
    seasonsFixture,
    slicedPlayers,
    waitForBehaviorAssertion,
} from '../../../testing/behavior-test-utils';
import type { Season } from '@services/api.service';

describe('SeasonSwitcherComponent — desktop user flow', () => {
    beforeEach(() => {
        polyfillJsdom();
        seedLocalStorage();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('lets user select a specific season and switch back to all seasons', async () => {
        const { fixture } = await render(AppComponent, getBehaviorTestConfig({ isMobile: false }));

        const firstPlayerName = slicedPlayers[0].name;
        await waitForBehaviorAssertion(fixture, () => {
            expect(screen.getByText(firstPlayerName)).toBeTruthy();
        });

        const seasonCombobox = screen.getByRole('combobox', { name: /season\.selector/ });

        fireEvent.click(seasonCombobox);
        const season2023 = await screen.findByRole('option', { name: '2023-2024' });
        fireEvent.click(season2023);

        await vi.waitFor(() => {
            expect(seasonCombobox).toHaveTextContent('2023-2024');
        });

        fireEvent.click(seasonCombobox);
        const allSeasonsOption = await screen.findByRole('option', { name: 'season.allSeasons' });
        fireEvent.click(allSeasonsOption);

        await vi.waitFor(() => {
            expect(seasonCombobox).toHaveTextContent('season.allSeasons');
        });
    });

    it('keeps the trigger blank until delayed season options resolve for a persisted saved season', async () => {
        localStorage.setItem(
            'fantrax.settings',
            JSON.stringify({
                selectedTeamId: '1',
                startFromSeason: 2012,
                topControlsExpanded: true,
                season: 2018,
                reportType: 'regular',
            })
        );

        const delayedSeasonOptions$ = new Subject<Season[]>();
        const { fixture } = await render(
            AppComponent,
            getBehaviorTestConfig({
                isMobile: false,
                getSeasons: (_reportType, _teamId, startFrom) =>
                    startFrom === 2012
                        ? delayedSeasonOptions$.asObservable()
                        : of(seasonsFixture as Season[]),
            })
        );

        await waitForBehaviorAssertion(fixture, () => {
            expect(screen.getByText(slicedPlayers[0].name)).toBeTruthy();
        });

        const seasonCombobox = screen.getByRole('combobox', { name: /season\.selector/ });
        expect(seasonCombobox).not.toHaveTextContent('2018');
        expect(seasonCombobox).not.toHaveTextContent('season.allSeasons');

        delayedSeasonOptions$.next(seasonsFixture as Season[]);
        delayedSeasonOptions$.complete();

        await waitForBehaviorAssertion(fixture, () => {
            expect(seasonCombobox).toHaveTextContent('2018-2019');
        });
    });

    it('keeps the trigger blank until delayed season options resolve for the default all-seasons state', async () => {
        const delayedSeasonOptions$ = new Subject<Season[]>();
        const { fixture } = await render(
            AppComponent,
            getBehaviorTestConfig({
                isMobile: false,
                getSeasons: (_reportType, _teamId, startFrom) =>
                    startFrom === 2012
                        ? delayedSeasonOptions$.asObservable()
                        : of(seasonsFixture as Season[]),
            })
        );

        await waitForBehaviorAssertion(fixture, () => {
            expect(screen.getByText(slicedPlayers[0].name)).toBeTruthy();
        });

        const seasonCombobox = screen.getByRole('combobox', { name: /season\.selector/ });
        expect(seasonCombobox).not.toHaveTextContent('season.allSeasons');

        delayedSeasonOptions$.next(seasonsFixture as Season[]);
        delayedSeasonOptions$.complete();

        await waitForBehaviorAssertion(fixture, () => {
            expect(seasonCombobox).toHaveTextContent('season.allSeasons');
        });
    });

    it('keeps the trigger blank when the season request resolves to the prerender fallback empty state', async () => {
        localStorage.setItem(
            'fantrax.settings',
            JSON.stringify({
                selectedTeamId: '1',
                startFromSeason: 2012,
                topControlsExpanded: true,
                season: 2018,
                reportType: 'regular',
            })
        );

        const { fixture } = await render(
            AppComponent,
            getBehaviorTestConfig({
                isMobile: false,
                getSeasons: () => throwError(() => new Error('Server prerender skips API requests.')),
            })
        );
        await waitForBehaviorAssertion(fixture, () => {
            expect(screen.getByText(slicedPlayers[0].name)).toBeTruthy();
        });

        const seasonCombobox = screen.getByRole('combobox', { name: /season\.selector/ });
        expect(seasonCombobox).not.toHaveTextContent('2018');
        expect(seasonCombobox).not.toHaveTextContent('season.allSeasons');
        expect(JSON.parse(localStorage.getItem('fantrax.settings') ?? '{}')).toMatchObject({
            season: 2018,
        });
    });
});
