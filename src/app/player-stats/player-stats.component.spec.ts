import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayerStatsComponent } from './player-stats.component';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ApiService, Player } from '@services/api.service';
import { FilterService } from '@services/filter.service';
import { StatsService } from '@services/stats.service';
import { TeamService } from '@services/team.service';
import { SettingsService } from '@services/settings.service';
import { ViewportService } from '@services/viewport.service';
import { BehaviorSubject } from 'rxjs';
import { of, throwError } from 'rxjs';
import { ComparisonService } from '@services/comparison.service';

class TeamServiceMock {
    private selectedTeamIdSubject = new BehaviorSubject<string>('1');
    selectedTeamId$ = this.selectedTeamIdSubject.asObservable();

    get selectedTeamId(): string {
        return this.selectedTeamIdSubject.value;
    }

    setTeamId(teamId: string): void {
        this.selectedTeamIdSubject.next(teamId);
    }
}

describe('PlayerStatsComponent', () => {
    let component: PlayerStatsComponent;
    let fixture: ComponentFixture<PlayerStatsComponent>;
    let apiServiceMock: any;
    let filterService: FilterService;
    let statsService: StatsService;
    let startFromSeasonSubject: BehaviorSubject<number | undefined>;

    beforeEach(async () => {
        apiServiceMock = {
            getPlayerData: vi.fn().mockName("ApiService.getPlayerData")
        } as any;

        // In the real app, startFromSeason is resolved from seasons and persisted.
        // PlayerStats waits until it is available before fetching combined stats.
        startFromSeasonSubject = new BehaviorSubject<number | undefined>(2012);

        await TestBed.configureTestingModule({
            imports: [
                PlayerStatsComponent,
                TranslateModule.forRoot(),
                NoopAnimationsModule,
            ],
            providers: [
                provideHttpClient(),
                { provide: ApiService, useValue: apiServiceMock },
                { provide: TeamService, useClass: TeamServiceMock },
                {
                    provide: SettingsService,
                    useValue: {
                        startFromSeason$: startFromSeasonSubject.asObservable(),
                        reportType: 'regular',
                        season: undefined,
                        setSeason: vi.fn(),
                        setReportType: vi.fn(),
                    },
                },
                { provide: ViewportService, useValue: { isMobile$: of(false) } },
            ],
        }).compileComponents();

        filterService = TestBed.inject(FilterService);
        statsService = TestBed.inject(StatsService);
        fixture = TestBed.createComponent(PlayerStatsComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should subscribe to player filters on init and fetch data with defaults and updates', () => {
        const mockPlayers: Player[] = [
            {
                name: 'Player 1',
                score: 0,
                scoreAdjustedByGames: 0,
                games: 10,
                goals: 5,
                assists: 5,
                points: 10,
                plusMinus: 1,
                penalties: 0,
                shots: 20,
                ppp: 2,
                shp: 0,
                hits: 3,
                blocks: 1,
            },
            {
                name: 'Player 2',
                score: 0,
                scoreAdjustedByGames: 0,
                games: 5,
                goals: 2,
                assists: 3,
                points: 5,
                plusMinus: 0,
                penalties: 1,
                shots: 10,
                ppp: 1,
                shp: 0,
                hits: 2,
                blocks: 0,
            },
        ];

        apiServiceMock.getPlayerData.mockReturnValue(of(mockPlayers));

        component.ngOnInit();

        expect(component.reportType).toBe('regular');
        expect(component.season).toBeUndefined();
        expect(component.statsPerGame).toBe(false);
        expect(component.minGames).toBe(0);
        expect(component.tableColumns.some(c => c.field === 'score')).toBe(true);
        expect(component.defaultSortColumn).toBe('score');
        expect(apiServiceMock.getPlayerData).toHaveBeenCalledWith({
            reportType: 'regular',
            season: undefined,
            startFrom: 2012,
        });
        expect(component.loading).toBe(false);
        expect(component.tableData).toEqual(mockPlayers);
        expect(component.maxGames).toBe(10);

        apiServiceMock.getPlayerData.mockClear();

        filterService.updatePlayerFilters({
            reportType: 'playoffs',
            season: 2024,
            statsPerGame: true,
            minGames: 5,
        });

        expect(component.reportType).toBe('playoffs');
        expect(component.season).toBe(2024);
        expect(component.statsPerGame).toBe(true);
        expect(component.minGames).toBe(5);
        expect(component.tableColumns.some(c => c.field === 'score')).toBe(false);
        expect(component.defaultSortColumn).toBe('scoreAdjustedByGames');
        expect(apiServiceMock.getPlayerData).toHaveBeenCalledWith({
            reportType: 'playoffs',
            season: 2024,
        });
    });

    it('should set apiError and clear data when getPlayerData errors during init stream', () => {
        apiServiceMock.getPlayerData.mockReturnValue(throwError(() => new Error('network')));

        component.ngOnInit();

        expect(component.loading).toBe(false);
        expect(component.apiError).toBe(true);
        expect(component.tableData).toEqual([]);
        expect(component.maxGames).toBe(0);
    });

    it('should use per-game stats when statsPerGame is true', () => {
        const apiData: Player[] = [
            {
                name: 'Player 1',
                score: 0,
                scoreAdjustedByGames: 0,
                games: 2,
                goals: 4,
                assists: 2,
                points: 6,
                plusMinus: 1,
                penalties: 0,
                shots: 10,
                ppp: 2,
                shp: 0,
                hits: 1,
                blocks: 0,
            },
        ];

        const perGameData: Player[] = [
            {
                ...apiData[0],
            },
        ];

        apiServiceMock.getPlayerData.mockReturnValue(of(apiData));
        vi.spyOn(statsService, 'getPlayerStatsPerGame').mockReturnValue(perGameData);

        component.statsPerGame = true;
        component.minGames = 0;

        component.fetchData({ reportType: 'regular' });

        expect(statsService.getPlayerStatsPerGame).toHaveBeenCalledWith(apiData);
        expect(component.tableData).toEqual(perGameData);
        expect(component.maxGames).toBe(apiData[0].games);
        expect(component.loading).toBe(false);
    });

    it('should filter tableData based on minGames and update maxGames', () => {
        const mockPlayers: Player[] = [
            {
                name: 'Player 1',
                score: 0,
                scoreAdjustedByGames: 0,
                games: 10,
                goals: 5,
                assists: 5,
                points: 10,
                plusMinus: 1,
                penalties: 0,
                shots: 20,
                ppp: 2,
                shp: 0,
                hits: 3,
                blocks: 1,
            },
            {
                name: 'Player 2',
                score: 0,
                scoreAdjustedByGames: 0,
                games: 5,
                goals: 2,
                assists: 3,
                points: 5,
                plusMinus: 0,
                penalties: 1,
                shots: 10,
                ppp: 1,
                shp: 0,
                hits: 2,
                blocks: 0,
            },
        ];

        apiServiceMock.getPlayerData.mockReturnValue(of(mockPlayers));

        component.statsPerGame = false;
        component.minGames = 8;

        component.fetchData({ reportType: 'regular' });

        expect(component.tableData.length).toBe(1);
        expect(component.tableData[0].name).toBe('Player 1');
        expect(component.maxGames).toBe(10);
    });

    it('should handle empty player data without errors', () => {
        const mockPlayers: Player[] = [];

        apiServiceMock.getPlayerData.mockReturnValue(of(mockPlayers));

        component.statsPerGame = false;
        component.minGames = 0;

        component.fetchData({ reportType: 'regular' });

        expect(component.tableData).toEqual([]);
        expect(component.maxGames).toBe(0);
        expect(component.loading).toBe(false);
    });

    it('should set apiError and clear data when ApiService errors', () => {
        apiServiceMock.getPlayerData.mockReturnValue(throwError(() => new Error('network')));

        component.statsPerGame = false;
        component.minGames = 0;
        component.apiError = false;

        component.fetchData({ reportType: 'regular' });

        expect(component.loading).toBe(false);
        expect(component.apiError).toBe(true);
        expect(component.tableData).toEqual([]);
        expect(component.maxGames).toBe(0);
    });

    it('should include teamId when a non-default team is selected', () => {
        apiServiceMock.getPlayerData.mockReturnValue(of([]));
        component.ngOnInit();

        apiServiceMock.getPlayerData.mockClear();

        const teamService = TestBed.inject(TeamService) as unknown as TeamServiceMock;
        teamService.setTeamId('2');

        expect(apiServiceMock.getPlayerData).toHaveBeenCalledWith({
            reportType: 'regular',
            season: undefined,
            teamId: '2',
            startFrom: 2012,
        });
    });

    it('should coalesce team change + filter reset into a single fetch', () => {
        apiServiceMock.getPlayerData.mockReturnValue(of([]));

        component.ngOnInit();
        apiServiceMock.getPlayerData.mockClear();

        const teamService = TestBed.inject(TeamService) as unknown as TeamServiceMock;

        // Simulate TeamSwitcher behavior: team change then resetAll (same tick).
        teamService.setTeamId('2');
        filterService.resetAll();

        expect(apiServiceMock.getPlayerData).toHaveBeenCalledTimes(1);
        expect(apiServiceMock.getPlayerData).toHaveBeenCalledWith({
            reportType: 'regular',
            season: undefined,
            teamId: '2',
            startFrom: 2012,
        });
    });

    it('should include startFrom when in combined mode and a startFromSeason is selected', () => {
        apiServiceMock.getPlayerData.mockReturnValue(of([]));

        component.ngOnInit();
        apiServiceMock.getPlayerData.mockClear();

        startFromSeasonSubject.next(2023);

        expect(apiServiceMock.getPlayerData).toHaveBeenCalledWith({
            reportType: 'regular',
            season: undefined,
            startFrom: 2023,
        });
    });

    it('should not fetch combined stats while startFromSeason is undefined (e.g. during team change transition)', () => {
        apiServiceMock.getPlayerData.mockReturnValue(of([]));

        component.ngOnInit();
        apiServiceMock.getPlayerData.mockClear();

        // Simulate clearing startFromSeason before the new team's oldest season is resolved.
        startFromSeasonSubject.next(undefined);
        const teamService = TestBed.inject(TeamService) as unknown as TeamServiceMock;
        teamService.setTeamId('2');
        expect(apiServiceMock.getPlayerData).not.toHaveBeenCalled();

        // Once resolved, fetch should happen with the correct startFrom.
        startFromSeasonSubject.next(2021);

        expect(apiServiceMock.getPlayerData).toHaveBeenCalledWith({
            reportType: 'regular',
            season: undefined,
            teamId: '2',
            startFrom: 2021,
        });
    });

    it('should not include startFrom when a specific season is selected', () => {
        apiServiceMock.getPlayerData.mockReturnValue(of([]));

        component.ngOnInit();
        apiServiceMock.getPlayerData.mockClear();

        startFromSeasonSubject.next(2023);
        filterService.updatePlayerFilters({ season: 2024 });

        expect(apiServiceMock.getPlayerData).toHaveBeenCalledWith({
            reportType: 'regular',
            season: 2024,
        });
    });

    it('should call getPlayerData with default params when fetchData is called without arguments', () => {
        const mockPlayers: Player[] = [
            {
                name: 'Player 1',
                score: 0,
                scoreAdjustedByGames: 0,
                games: 3,
                goals: 1,
                assists: 2,
                points: 3,
                plusMinus: 0,
                penalties: 0,
                shots: 5,
                ppp: 0,
                shp: 0,
                hits: 1,
                blocks: 0,
            },
        ];

        apiServiceMock.getPlayerData.mockReturnValue(of(mockPlayers));

        component.statsPerGame = false;
        component.minGames = 0;

        component.fetchData();

        expect(apiServiceMock.getPlayerData).toHaveBeenCalledWith({});
        expect(component.tableData).toEqual(mockPlayers);
        expect(component.maxGames).toBe(3);
        expect(component.loading).toBe(false);
    });

    it('should complete destroy$ on ngOnDestroy', () => {
        const nextSpy = vi.spyOn(component['destroy$'] as any, 'next');
        const completeSpy = vi.spyOn(component['destroy$'] as any, 'complete');

        component.ngOnDestroy();

        expect(nextSpy).toHaveBeenCalled();
        expect(completeSpy).toHaveBeenCalled();
    });

    describe('position filtering', () => {
        const mockPlayersWithPositions: Player[] = [
            {
                name: 'Forward 1',
                position: 'F',
                score: 80,
                scoreAdjustedByGames: 4,
                scoreByPosition: 90,
                scoreByPositionAdjustedByGames: 4.5,
                games: 20,
                goals: 15,
                assists: 20,
                points: 35,
                plusMinus: 10,
                penalties: 8,
                shots: 100,
                ppp: 10,
                shp: 2,
                hits: 30,
                blocks: 10,
            },
            {
                name: 'Forward 2',
                position: 'F',
                score: 70,
                scoreAdjustedByGames: 3.5,
                scoreByPosition: 75,
                scoreByPositionAdjustedByGames: 3.8,
                games: 20,
                goals: 10,
                assists: 15,
                points: 25,
                plusMinus: 5,
                penalties: 6,
                shots: 80,
                ppp: 8,
                shp: 1,
                hits: 25,
                blocks: 8,
            },
            {
                name: 'Defenseman 1',
                position: 'D',
                score: 60,
                scoreAdjustedByGames: 3,
                scoreByPosition: 85,
                scoreByPositionAdjustedByGames: 4.2,
                games: 20,
                goals: 5,
                assists: 20,
                points: 25,
                plusMinus: 15,
                penalties: 10,
                shots: 60,
                ppp: 5,
                shp: 0,
                hits: 50,
                blocks: 40,
            },
        ];

        it('should filter by position F when positionFilter is F', () => {
            apiServiceMock.getPlayerData.mockReturnValue(of(mockPlayersWithPositions));

            component.ngOnInit();

            filterService.updatePlayerFilters({ positionFilter: 'F' });

            expect(component.positionFilter).toBe('F');
            expect(component.tableData.length).toBe(2);
            expect(component.tableData.every(p => p.position === 'F')).toBe(true);
        });

        it('should filter by position D when positionFilter is D', () => {
            apiServiceMock.getPlayerData.mockReturnValue(of(mockPlayersWithPositions));

            component.ngOnInit();

            filterService.updatePlayerFilters({ positionFilter: 'D' });

            expect(component.positionFilter).toBe('D');
            expect(component.tableData.length).toBe(1);
            expect(component.tableData[0].name).toBe('Defenseman 1');
        });

        it('should use scoreByPosition when positionFilter is active', () => {
            apiServiceMock.getPlayerData.mockReturnValue(of(mockPlayersWithPositions));

            component.ngOnInit();

            filterService.updatePlayerFilters({ positionFilter: 'F' });

            // Scores should be transformed to position-based values
            const forward1 = component.tableData.find(p => p.name === 'Forward 1');
            expect(forward1?.score).toBe(90);
            expect(forward1?.scoreAdjustedByGames).toBe(4.5);
        });

        it('should show all players when positionFilter is all', () => {
            apiServiceMock.getPlayerData.mockReturnValue(of(mockPlayersWithPositions));

            component.ngOnInit();

            filterService.updatePlayerFilters({ positionFilter: 'F' });

            expect(component.tableData.length).toBe(2);

            filterService.updatePlayerFilters({ positionFilter: 'all' });

            expect(component.positionFilter).toBe('all');
            expect(component.tableData.length).toBe(3);
        });

        it('should use original scores when positionFilter is all', () => {
            apiServiceMock.getPlayerData.mockReturnValue(of(mockPlayersWithPositions));

            component.ngOnInit();

            // Position filter is 'all' by default
            expect(component.positionFilter).toBe('all');

            const forward1 = component.tableData.find(p => p.name === 'Forward 1');
            expect(forward1?.score).toBe(80);
            expect(forward1?.scoreAdjustedByGames).toBe(4);
        });

        it('should handle players without scoreByPosition gracefully', () => {
            const playersWithoutPositionScores: Player[] = [
                {
                    name: 'Forward Without Position Scores',
                    position: 'F',
                    score: 70,
                    scoreAdjustedByGames: 3.5,
                    games: 20,
                    goals: 10,
                    assists: 15,
                    points: 25,
                    plusMinus: 5,
                    penalties: 6,
                    shots: 80,
                    ppp: 8,
                    shp: 1,
                    hits: 25,
                    blocks: 8,
                },
            ];

            apiServiceMock.getPlayerData.mockReturnValue(of(playersWithoutPositionScores));

            component.ngOnInit();

            filterService.updatePlayerFilters({ positionFilter: 'F' });

            // Should fall back to original score values
            expect(component.tableData[0].score).toBe(70);
            expect(component.tableData[0].scoreAdjustedByGames).toBe(3.5);
        });

        it('should use scoreByPositionAdjustedByGames for score in per-game mode with position filter', () => {
            apiServiceMock.getPlayerData.mockReturnValue(of(mockPlayersWithPositions));

            component.ngOnInit();

            // Enable both statsPerGame and position filter
            filterService.updatePlayerFilters({ statsPerGame: true, positionFilter: 'F' });

            expect(component.statsPerGame).toBe(true);
            expect(component.positionFilter).toBe('F');

            // In per-game mode with position filter, score should use scoreByPositionAdjustedByGames
            const forward1 = component.tableData.find(p => p.name === 'Forward 1');
            expect(forward1?.score).toBe(4.5); // scoreByPositionAdjustedByGames
            expect(forward1?.scoreAdjustedByGames).toBe(4.5);
        });

        it('should handle per-game mode with position filter for players without position scores', () => {
            const playersWithoutPositionScores: Player[] = [
                {
                    name: 'Forward Without Position Scores',
                    position: 'F',
                    score: 70,
                    scoreAdjustedByGames: 3.5,
                    games: 20,
                    goals: 10,
                    assists: 15,
                    points: 25,
                    plusMinus: 5,
                    penalties: 6,
                    shots: 80,
                    ppp: 8,
                    shp: 1,
                    hits: 25,
                    blocks: 8,
                },
            ];

            apiServiceMock.getPlayerData.mockReturnValue(of(playersWithoutPositionScores));

            component.ngOnInit();

            filterService.updatePlayerFilters({ statsPerGame: true, positionFilter: 'F' });

            // Should fall back to regular per-game score (statsService sets score = scoreAdjustedByGames)
            expect(component.tableData[0].score).toBe(3.5);
        });
    });

    describe('comparison wiring', () => {
        const mockRow = { name: 'Player X' } as any;

        it('isRowSelected should delegate to ComparisonService.isSelected', () => {
            const comparisonService = TestBed.inject(ComparisonService);
            vi.spyOn(comparisonService, 'isSelected').mockReturnValue(true);
            expect(component.isRowSelected(mockRow)).toBe(true);
            expect(comparisonService.isSelected).toHaveBeenCalledWith(mockRow);
        });

        it('onRowSelect should delegate to ComparisonService.toggle', () => {
            const comparisonService = TestBed.inject(ComparisonService);
            vi.spyOn(comparisonService, 'toggle');
            component.onRowSelect(mockRow);
            expect(comparisonService.toggle).toHaveBeenCalledWith(mockRow);
        });
    });
});
