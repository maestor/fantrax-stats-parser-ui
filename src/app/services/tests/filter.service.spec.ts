import { TestBed } from '@angular/core/testing';
import { FilterService, FilterState } from '../filter.service';
import { take } from 'rxjs';

describe('FilterService', () => {
    let service: FilterService;

    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({
            providers: [FilterService],
        });
        service = TestBed.inject(FilterService);
    });

    afterEach(() => {
        service.resetPlayerFilters();
        service.resetGoalieFilters();
    });

    describe('initial state', () => {
        it('should start with default player filter values', async () => {
            service.playerFilters$.pipe(take(1)).subscribe((filters) => {
                expect(filters.reportType).toBe('regular');
                expect(filters.season).toBeUndefined();
                expect(filters.statsPerGame).toBe(false);
                expect(filters.minGames).toBe(0);
                expect(filters.positionFilter).toBe('all');

            });
        });

        it('should start with default goalie filter values', async () => {
            service.goalieFilters$.pipe(take(1)).subscribe((filters) => {
                expect(filters.reportType).toBe('regular');
                expect(filters.season).toBeUndefined();
                expect(filters.statsPerGame).toBe(false);
                expect(filters.minGames).toBe(0);
                expect(filters.positionFilter).toBe('all');

            });
        });
    });

    describe('initialization from persisted settings', () => {
        it('should init season from settings when stored', async () => {
            localStorage.setItem('fantrax.settings', JSON.stringify({
                selectedTeamId: '1',
                startFromSeason: null,
                topControlsExpanded: true,
                season: 2024,
                reportType: 'regular',
            }));
            TestBed.resetTestingModule();
            TestBed.configureTestingModule({ providers: [FilterService] });
            const freshService = TestBed.inject(FilterService);

            freshService.playerFilters$.pipe(take(1)).subscribe((filters) => {
                expect(filters.season).toBe(2024);

            });
        });

        it('should init reportType from settings when stored', async () => {
            localStorage.setItem('fantrax.settings', JSON.stringify({
                selectedTeamId: '1',
                startFromSeason: null,
                topControlsExpanded: true,
                season: null,
                reportType: 'playoffs',
            }));
            TestBed.resetTestingModule();
            TestBed.configureTestingModule({ providers: [FilterService] });
            const freshService = TestBed.inject(FilterService);

            freshService.playerFilters$.pipe(take(1)).subscribe((filters) => {
                expect(filters.reportType).toBe('playoffs');

            });
        });

        it('should init both player and goalie filters from settings', async () => {
            localStorage.setItem('fantrax.settings', JSON.stringify({
                selectedTeamId: '1',
                startFromSeason: null,
                topControlsExpanded: true,
                season: 2023,
                reportType: 'playoffs',
            }));
            TestBed.resetTestingModule();
            TestBed.configureTestingModule({ providers: [FilterService] });
            const freshService = TestBed.inject(FilterService);

            freshService.goalieFilters$.pipe(take(1)).subscribe((filters) => {
                expect(filters.season).toBe(2023);
                expect(filters.reportType).toBe('playoffs');

            });
        });
    });

    describe('persistence on filter change', () => {
        it('should persist season to settings when updatePlayerFilters changes season', () => {
            service.updatePlayerFilters({ season: 2023 });

            const stored = JSON.parse(localStorage.getItem('fantrax.settings') ?? '{}');
            expect(stored.season).toBe(2023);
        });

        it('should persist null season to settings when season is cleared', () => {
            service.updatePlayerFilters({ season: 2023 });
            service.updatePlayerFilters({ season: undefined });

            const stored = JSON.parse(localStorage.getItem('fantrax.settings') ?? '{}');
            expect(stored.season).toBeNull();
        });

        it('should persist reportType to settings when updatePlayerFilters changes reportType', () => {
            service.updatePlayerFilters({ reportType: 'playoffs' });

            const stored = JSON.parse(localStorage.getItem('fantrax.settings') ?? '{}');
            expect(stored.reportType).toBe('playoffs');
        });

        it('should persist season to settings when updateGoalieFilters changes season', () => {
            service.updateGoalieFilters({ season: 2022 });

            const stored = JSON.parse(localStorage.getItem('fantrax.settings') ?? '{}');
            expect(stored.season).toBe(2022);
        });

        it('should persist reportType to settings when updateGoalieFilters changes reportType', () => {
            service.updateGoalieFilters({ reportType: 'both' });

            const stored = JSON.parse(localStorage.getItem('fantrax.settings') ?? '{}');
            expect(stored.reportType).toBe('both');
        });

        it('should not persist statsPerGame or minGames changes to settings', () => {
            service.updatePlayerFilters({ statsPerGame: true, minGames: 10 });

            const stored = JSON.parse(localStorage.getItem('fantrax.settings') ?? '{}');
            expect(stored.season).toBeNull();
            expect(stored.reportType).toBe('regular');
            expect(stored['statsPerGame']).toBeUndefined();
            expect(stored['minGames']).toBeUndefined();
        });

        it('should persist season=null and reportType=regular after resetAll', () => {
            service.updatePlayerFilters({ season: 2024, reportType: 'playoffs' });
            service.resetAll();

            const stored = JSON.parse(localStorage.getItem('fantrax.settings') ?? '{}');
            expect(stored.season).toBeNull();
            expect(stored.reportType).toBe('regular');
        });
    });

    describe('updatePlayerFilters', () => {
        it('should update reportType for players', async () => {
            service.updatePlayerFilters({ reportType: 'playoffs' });

            service.playerFilters$.pipe(take(1)).subscribe((filters) => {
                expect(filters.reportType).toBe('playoffs');

            });
        });

        it('should update season for players', async () => {
            service.updatePlayerFilters({ season: 2024 });

            service.playerFilters$.pipe(take(1)).subscribe((filters) => {
                expect(filters.season).toBe(2024);

            });
        });

        it('should update statsPerGame for players', async () => {
            service.updatePlayerFilters({ statsPerGame: true });

            service.playerFilters$.pipe(take(1)).subscribe((filters) => {
                expect(filters.statsPerGame).toBe(true);

            });
        });

        it('should update minGames for players', async () => {
            service.updatePlayerFilters({ minGames: 10 });

            service.playerFilters$.pipe(take(1)).subscribe((filters) => {
                expect(filters.minGames).toBe(10);

            });
        });

        it('should update multiple fields at once for players', async () => {
            service.updatePlayerFilters({
                reportType: 'playoffs',
                season: 2023,
                statsPerGame: true,
                minGames: 20,
            });

            service.playerFilters$.pipe(take(1)).subscribe((filters) => {
                expect(filters.reportType).toBe('playoffs');
                expect(filters.season).toBe(2023);
                expect(filters.statsPerGame).toBe(true);
                expect(filters.minGames).toBe(20);

            });
        });

        it('should preserve unchanged fields when updating players', async () => {
            service.updatePlayerFilters({ reportType: 'playoffs', season: 2024 });
            service.updatePlayerFilters({ statsPerGame: true });

            service.playerFilters$.pipe(take(1)).subscribe((filters) => {
                expect(filters.reportType).toBe('playoffs');
                expect(filters.season).toBe(2024);
                expect(filters.statsPerGame).toBe(true);
                expect(filters.minGames).toBe(0);

            });
        });

        it('should sync reportType and season to goalie filters', async () => {
            service.updatePlayerFilters({ reportType: 'playoffs', season: 2020 });

            service.playerFilters$.pipe(take(1)).subscribe((playerFilters) => {
                expect(playerFilters.reportType).toBe('playoffs');
                expect(playerFilters.season).toBe(2020);

                service.goalieFilters$.pipe(take(1)).subscribe((goalieFilters) => {
                    expect(goalieFilters.reportType).toBe('playoffs');
                    expect(goalieFilters.season).toBe(2020);

                });
            });
        });

        it('should emit new values to subscribers', () => {
            const emissions: FilterState[] = [];

            const subscription = service.playerFilters$.subscribe((filters) => {
                emissions.push(filters);
            });

            service.updatePlayerFilters({ reportType: 'playoffs' });
            service.updatePlayerFilters({ season: 2024 });

            expect(emissions.length).toBe(3);
            expect(emissions[0].reportType).toBe('regular');
            expect(emissions[1].reportType).toBe('playoffs');
            expect(emissions[2].season).toBe(2024);
            subscription.unsubscribe();
        });
    });

    describe('updateGoalieFilters', () => {
        it('should update reportType for goalies', async () => {
            service.updateGoalieFilters({ reportType: 'playoffs' });

            service.goalieFilters$.pipe(take(1)).subscribe((filters) => {
                expect(filters.reportType).toBe('playoffs');

            });
        });

        it('should update season for goalies', async () => {
            service.updateGoalieFilters({ season: 2024 });

            service.goalieFilters$.pipe(take(1)).subscribe((filters) => {
                expect(filters.season).toBe(2024);

            });
        });

        it('should update statsPerGame for goalies', async () => {
            service.updateGoalieFilters({ statsPerGame: true });

            service.goalieFilters$.pipe(take(1)).subscribe((filters) => {
                expect(filters.statsPerGame).toBe(true);

            });
        });

        it('should update minGames for goalies', async () => {
            service.updateGoalieFilters({ minGames: 5 });

            service.goalieFilters$.pipe(take(1)).subscribe((filters) => {
                expect(filters.minGames).toBe(5);

            });
        });

        it('should update multiple fields at once for goalies', async () => {
            service.updateGoalieFilters({
                reportType: 'playoffs',
                season: 2022,
                statsPerGame: true,
                minGames: 15,
            });

            service.goalieFilters$.pipe(take(1)).subscribe((filters) => {
                expect(filters.reportType).toBe('playoffs');
                expect(filters.season).toBe(2022);
                expect(filters.statsPerGame).toBe(true);
                expect(filters.minGames).toBe(15);

            });
        });

        it('should preserve unchanged fields when updating goalies', async () => {
            service.updateGoalieFilters({ reportType: 'playoffs', season: 2024 });
            service.updateGoalieFilters({ statsPerGame: true });

            service.goalieFilters$.pipe(take(1)).subscribe((filters) => {
                expect(filters.reportType).toBe('playoffs');
                expect(filters.season).toBe(2024);
                expect(filters.statsPerGame).toBe(true);
                expect(filters.minGames).toBe(0);

            });
        });

        it('should update goalie filters independently of player filters', async () => {
            service.updateGoalieFilters({ statsPerGame: true, minGames: 10 });

            service.goalieFilters$.pipe(take(1)).subscribe((goalieFilters) => {
                expect(goalieFilters.statsPerGame).toBe(true);
                expect(goalieFilters.minGames).toBe(10);

                service.playerFilters$.pipe(take(1)).subscribe((playerFilters) => {
                    expect(playerFilters.statsPerGame).toBe(false);
                    expect(playerFilters.minGames).toBe(0);

                });
            });
        });

        it('should sync reportType and season to player filters', async () => {
            service.updateGoalieFilters({ reportType: 'playoffs', season: 2021 });

            service.goalieFilters$.pipe(take(1)).subscribe((goalieFilters) => {
                expect(goalieFilters.reportType).toBe('playoffs');
                expect(goalieFilters.season).toBe(2021);

                service.playerFilters$.pipe(take(1)).subscribe((playerFilters) => {
                    expect(playerFilters.reportType).toBe('playoffs');
                    expect(playerFilters.season).toBe(2021);

                });
            });
        });
    });

    describe('resetPlayerFilters', () => {
        it('should reset player filters to defaults', async () => {
            service.updatePlayerFilters({
                reportType: 'playoffs',
                season: 2024,
                statsPerGame: true,
                minGames: 20,
            });

            service.resetPlayerFilters();

            service.playerFilters$.pipe(take(1)).subscribe((filters) => {
                // Global filters are shared across contexts and are not reset here.
                expect(filters.reportType).toBe('playoffs');
                expect(filters.season).toBe(2024);
                expect(filters.statsPerGame).toBe(false);
                expect(filters.minGames).toBe(0);

            });
        });

        it('should not affect goalie filters when resetting player filters', async () => {
            service.updateGoalieFilters({ statsPerGame: true, minGames: 5 });
            service.updatePlayerFilters({ statsPerGame: true, minGames: 20 });

            service.resetPlayerFilters();

            service.goalieFilters$.pipe(take(1)).subscribe((filters) => {
                expect(filters.statsPerGame).toBe(true);
                expect(filters.minGames).toBe(5);

            });
        });
    });

    describe('resetGoalieFilters', () => {
        it('should reset goalie filters to defaults', async () => {
            service.updateGoalieFilters({
                reportType: 'playoffs',
                season: 2024,
                statsPerGame: true,
                minGames: 15,
            });

            service.resetGoalieFilters();

            service.goalieFilters$.pipe(take(1)).subscribe((filters) => {
                // Global filters are shared across contexts and are not reset here.
                expect(filters.reportType).toBe('playoffs');
                expect(filters.season).toBe(2024);
                expect(filters.statsPerGame).toBe(false);
                expect(filters.minGames).toBe(0);

            });
        });

        it('should not affect player filters when resetting goalie filters', async () => {
            service.updatePlayerFilters({ statsPerGame: true, minGames: 10 });
            service.updateGoalieFilters({ statsPerGame: true, minGames: 5 });

            service.resetGoalieFilters();

            service.playerFilters$.pipe(take(1)).subscribe((filters) => {
                expect(filters.statsPerGame).toBe(true);
                expect(filters.minGames).toBe(10);

            });
        });
    });

    describe('resetAll', () => {
        it('should reset both player and goalie filters to defaults', async () => {
            service.updatePlayerFilters({
                reportType: 'playoffs',
                season: 2024,
                statsPerGame: true,
                minGames: 10,
                positionFilter: 'F',
            });

            service.updateGoalieFilters({
                reportType: 'playoffs',
                season: 2023,
                statsPerGame: true,
                minGames: 5,
            });

            service.resetAll();

            service.playerFilters$.pipe(take(1)).subscribe((playerFilters) => {
                expect(playerFilters.reportType).toBe('regular');
                expect(playerFilters.season).toBeUndefined();
                expect(playerFilters.statsPerGame).toBe(false);
                expect(playerFilters.minGames).toBe(0);
                expect(playerFilters.positionFilter).toBe('all');

                service.goalieFilters$.pipe(take(1)).subscribe((goalieFilters) => {
                    expect(goalieFilters.reportType).toBe('regular');
                    expect(goalieFilters.season).toBeUndefined();
                    expect(goalieFilters.statsPerGame).toBe(false);
                    expect(goalieFilters.minGames).toBe(0);
                    expect(goalieFilters.positionFilter).toBe('all');

                });
            });
        });
    });

    describe('multiple subscribers', () => {
        it('should emit to multiple player filter subscribers', () => {
            const emissions1: FilterState[] = [];
            const emissions2: FilterState[] = [];

            const sub1 = service.playerFilters$.subscribe((f) => emissions1.push(f));
            const sub2 = service.playerFilters$.subscribe((f) => emissions2.push(f));

            service.updatePlayerFilters({ reportType: 'playoffs' });

            expect(emissions1.length).toBe(2);
            expect(emissions2.length).toBe(2);
            expect(emissions1[1].reportType).toBe('playoffs');
            expect(emissions2[1].reportType).toBe('playoffs');
            sub1.unsubscribe();
            sub2.unsubscribe();
        });

        it('should emit to multiple goalie filter subscribers', () => {
            const emissions1: FilterState[] = [];
            const emissions2: FilterState[] = [];

            const sub1 = service.goalieFilters$.subscribe((f) => emissions1.push(f));
            const sub2 = service.goalieFilters$.subscribe((f) => emissions2.push(f));

            service.updateGoalieFilters({ season: 2024 });

            expect(emissions1.length).toBe(2);
            expect(emissions2.length).toBe(2);
            expect(emissions1[1].season).toBe(2024);
            expect(emissions2[1].season).toBe(2024);
            sub1.unsubscribe();
            sub2.unsubscribe();
        });
    });

    describe('positionFilter', () => {
        it('should update positionFilter for players to F', async () => {
            service.updatePlayerFilters({ positionFilter: 'F' });

            service.playerFilters$.pipe(take(1)).subscribe((filters) => {
                expect(filters.positionFilter).toBe('F');

            });
        });

        it('should update positionFilter for players to D', async () => {
            service.updatePlayerFilters({ positionFilter: 'D' });

            service.playerFilters$.pipe(take(1)).subscribe((filters) => {
                expect(filters.positionFilter).toBe('D');

            });
        });

        it('should update positionFilter for players back to all', async () => {
            service.updatePlayerFilters({ positionFilter: 'F' });
            service.updatePlayerFilters({ positionFilter: 'all' });

            service.playerFilters$.pipe(take(1)).subscribe((filters) => {
                expect(filters.positionFilter).toBe('all');

            });
        });

        it('should reset positionFilter when resetPlayerFilters is called', async () => {
            service.updatePlayerFilters({ positionFilter: 'D' });
            service.resetPlayerFilters();

            service.playerFilters$.pipe(take(1)).subscribe((filters) => {
                expect(filters.positionFilter).toBe('all');

            });
        });

        it('should not sync positionFilter to goalie filters', async () => {
            service.updatePlayerFilters({ positionFilter: 'F' });

            service.goalieFilters$.pipe(take(1)).subscribe((filters) => {
                expect(filters.positionFilter).toBe('all');

            });
        });
    });

    describe('edge cases', () => {
        it('should handle setting season to undefined', async () => {
            service.updatePlayerFilters({ season: 2024 });
            service.updatePlayerFilters({ season: undefined });

            service.playerFilters$.pipe(take(1)).subscribe((filters) => {
                expect(filters.season).toBeUndefined();

            });
        });

        it('should handle minGames set to 0', async () => {
            service.updatePlayerFilters({ minGames: 20 });
            service.updatePlayerFilters({ minGames: 0 });

            service.playerFilters$.pipe(take(1)).subscribe((filters) => {
                expect(filters.minGames).toBe(0);

            });
        });

        it('should handle statsPerGame toggle', async () => {
            service.updateGoalieFilters({ statsPerGame: true });
            service.updateGoalieFilters({ statsPerGame: false });

            service.goalieFilters$.pipe(take(1)).subscribe((filters) => {
                expect(filters.statsPerGame).toBe(false);

            });
        });
    });
});
