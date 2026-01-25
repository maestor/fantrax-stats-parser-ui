import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { GoalieStatsComponent } from './goalie-stats.component';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ApiService, Goalie } from '@services/api.service';
import { FilterService } from '@services/filter.service';
import { StatsService } from '@services/stats.service';
import { TeamService } from '@services/team.service';
import { ViewportService } from '@services/viewport.service';
import { GOALIE_COLUMNS, GOALIE_SEASON_COLUMNS } from '@shared/table-columns';
import { BehaviorSubject, of, throwError } from 'rxjs';

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

describe('GoalieStatsComponent', () => {
  let component: GoalieStatsComponent;
  let fixture: ComponentFixture<GoalieStatsComponent>;
  let apiServiceMock: jasmine.SpyObj<ApiService>;
  let filterService: FilterService;
  let statsService: StatsService;

  beforeEach(async () => {
    apiServiceMock = jasmine.createSpyObj<ApiService>('ApiService', [
      'getGoalieData',
    ]);

    await TestBed.configureTestingModule({
      imports: [
        GoalieStatsComponent,
        TranslateModule.forRoot(),
        NoopAnimationsModule,
      ],
      providers: [
        provideHttpClient(),
        { provide: ApiService, useValue: apiServiceMock },
        { provide: ViewportService, useValue: { isMobile$: of(false) } },
        { provide: TeamService, useClass: TeamServiceMock },
      ],
    }).compileComponents();

    filterService = TestBed.inject(FilterService);
    statsService = TestBed.inject(StatsService);
    fixture = TestBed.createComponent(GoalieStatsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should subscribe to goalie filters on init, set columns and fetch data', fakeAsync(() => {
    const mockGoalies: Goalie[] = [
      {
        name: 'Goalie 1',
        score: 0,
        scoreAdjustedByGames: 0,
        games: 20,
        wins: 10,
        saves: 500,
        shutouts: 2,
        goals: 0,
        assists: 1,
        points: 1,
        penalties: 0,
        ppp: 0,
        shp: 0,
        gaa: '2.00',
        savePercent: '0.920',
      },
      {
        name: 'Goalie 2',
        score: 0,
        scoreAdjustedByGames: 0,
        games: 5,
        wins: 2,
        saves: 100,
        shutouts: 0,
        goals: 0,
        assists: 0,
        points: 0,
        penalties: 0,
        ppp: 0,
        shp: 0,
        gaa: '3.00',
        savePercent: '0.900',
      },
    ];

    apiServiceMock.getGoalieData.and.returnValue(of(mockGoalies));

    component.ngOnInit();
    tick(1);

    expect(component.reportType).toBe('regular');
    expect(component.season).toBeUndefined();
    expect(component.statsPerGame).toBe(false);
    expect(component.minGames).toBe(0);
    expect(component.tableColumns).toEqual(GOALIE_COLUMNS);
    expect(component.tableColumns.includes('score')).toBeTrue();
    expect(component.defaultSortColumn).toBe('score');
    expect(apiServiceMock.getGoalieData).toHaveBeenCalledWith({
      reportType: 'regular',
      season: undefined,
    });
    expect(component.loading).toBe(false);
    expect(component.tableData).toEqual(mockGoalies);
    expect(component.maxGames).toBe(20);

    apiServiceMock.getGoalieData.calls.reset();

    filterService.updateGoalieFilters({
      season: 2024,
      reportType: 'playoffs',
      statsPerGame: true,
      minGames: 5,
    });
    tick(1);

    expect(component.season).toBe(2024);
    expect(component.reportType).toBe('playoffs');
    expect(component.tableColumns).toEqual(GOALIE_SEASON_COLUMNS.filter((c) => c !== 'score'));
    expect(component.tableColumns.includes('score')).toBeFalse();
    expect(component.defaultSortColumn).toBe('scoreAdjustedByGames');
    expect(apiServiceMock.getGoalieData).toHaveBeenCalledWith({
      reportType: 'playoffs',
      season: 2024,
    });
  }));

  it('should coalesce team change + filter reset into a single fetch', fakeAsync(() => {
    apiServiceMock.getGoalieData.and.returnValue(of([]));

    component.ngOnInit();
    tick(1);
    apiServiceMock.getGoalieData.calls.reset();

    const teamService = TestBed.inject(TeamService) as unknown as TeamServiceMock;

    teamService.setTeamId('2');
    filterService.resetAll();

    tick(1);

    expect(apiServiceMock.getGoalieData).toHaveBeenCalledTimes(1);
    expect(apiServiceMock.getGoalieData).toHaveBeenCalledWith({
      reportType: 'regular',
      season: undefined,
      teamId: '2',
    });
  }));

  it('should use per-game goalie stats when statsPerGame is true', () => {
    const apiData: Goalie[] = [
      {
        name: 'Goalie 1',
        score: 0,
        scoreAdjustedByGames: 0,
        games: 2,
        wins: 2,
        saves: 60,
        shutouts: 1,
        goals: 0,
        assists: 0,
        points: 0,
        penalties: 0,
        ppp: 0,
        shp: 0,
        gaa: '2.00',
        savePercent: '0.930',
      },
    ];

    const perGameData: Goalie[] = [
      {
        ...apiData[0],
      },
    ];

    apiServiceMock.getGoalieData.and.returnValue(of(apiData));
    spyOn(statsService, 'getGoalieStatsPerGame').and.returnValue(perGameData);

    component.statsPerGame = true;
    component.minGames = 0;

    component.fetchData({ reportType: 'regular' });

    expect(statsService.getGoalieStatsPerGame).toHaveBeenCalledWith(apiData);
    expect(component.tableData).toEqual(perGameData);
    expect(component.maxGames).toBe(apiData[0].games);
    expect(component.loading).toBe(false);
  });

  it('should filter goalie tableData based on minGames and update maxGames', () => {
    const mockGoalies: Goalie[] = [
      {
        name: 'Goalie 1',
        score: 0,
        scoreAdjustedByGames: 0,
        games: 20,
        wins: 10,
        saves: 500,
        shutouts: 2,
        goals: 0,
        assists: 1,
        points: 1,
        penalties: 0,
        ppp: 0,
        shp: 0,
        gaa: '2.00',
        savePercent: '0.920',
      },
      {
        name: 'Goalie 2',
        score: 0,
        scoreAdjustedByGames: 0,
        games: 5,
        wins: 2,
        saves: 100,
        shutouts: 0,
        goals: 0,
        assists: 0,
        points: 0,
        penalties: 0,
        ppp: 0,
        shp: 0,
        gaa: '3.00',
        savePercent: '0.900',
      },
    ];

    apiServiceMock.getGoalieData.and.returnValue(of(mockGoalies));

    component.statsPerGame = false;
    component.minGames = 10;

    component.fetchData({ reportType: 'regular' });

    expect(component.tableData.length).toBe(1);
    expect(component.tableData[0].name).toBe('Goalie 1');
    expect(component.maxGames).toBe(20);
  });

  it('should set apiError and clear data when ApiService errors', () => {
    apiServiceMock.getGoalieData.and.returnValue(
      throwError(() => new Error('network'))
    );

    component.statsPerGame = false;
    component.minGames = 0;
    component.apiError = false;

    component.fetchData({ reportType: 'regular' });

    expect(component.loading).toBe(false);
    expect(component.apiError).toBe(true);
    expect(component.tableData).toEqual([]);
    expect(component.maxGames).toBe(0);
  });

  it('should handle empty goalie data without errors', () => {
    const mockGoalies: Goalie[] = [];

    apiServiceMock.getGoalieData.and.returnValue(of(mockGoalies));

    component.statsPerGame = false;
    component.minGames = 0;

    component.fetchData({ reportType: 'regular' });

    expect(component.tableData).toEqual([]);
    expect(component.maxGames).toBe(0);
    expect(component.loading).toBe(false);
  });

  it('should call getGoalieData with default params when fetchData is called without arguments', () => {
    const mockGoalies: Goalie[] = [
      {
        name: 'Goalie 1',
        score: 0,
        scoreAdjustedByGames: 0,
        games: 3,
        wins: 2,
        saves: 90,
        shutouts: 1,
        goals: 0,
        assists: 0,
        points: 0,
        penalties: 0,
        ppp: 0,
        shp: 0,
        gaa: '2.00',
        savePercent: '0.930',
      },
    ];

    apiServiceMock.getGoalieData.and.returnValue(of(mockGoalies));

    component.statsPerGame = false;
    component.minGames = 0;

    component.fetchData();

    expect(apiServiceMock.getGoalieData).toHaveBeenCalledWith({});
    expect(component.tableData).toEqual(mockGoalies);
    expect(component.maxGames).toBe(3);
    expect(component.loading).toBe(false);
  });

  it('should include teamId when a non-default team is selected', fakeAsync(() => {
    apiServiceMock.getGoalieData.and.returnValue(of([]));
    component.ngOnInit();
    tick(1);

    apiServiceMock.getGoalieData.calls.reset();

    const teamService = TestBed.inject(TeamService) as unknown as TeamServiceMock;
    teamService.setTeamId('2');
    tick(1);

    expect(apiServiceMock.getGoalieData).toHaveBeenCalledWith({
      reportType: 'regular',
      season: undefined,
      teamId: '2',
    });
  }));

  it('should complete destroy$ on ngOnDestroy', () => {
    const nextSpy = spyOn<any>(component['destroy$'], 'next');
    const completeSpy = spyOn<any>(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(nextSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });
});
