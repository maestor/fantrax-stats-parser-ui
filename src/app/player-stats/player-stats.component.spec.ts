import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayerStatsComponent } from './player-stats.component';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ApiService, Player } from '@services/api.service';
import { FilterService } from '@services/filter.service';
import { StatsService } from '@services/stats.service';
import { TeamService } from '@services/team.service';
import { BehaviorSubject } from 'rxjs';
import { of } from 'rxjs';

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
  let apiServiceMock: jasmine.SpyObj<ApiService>;
  let filterService: FilterService;
  let statsService: StatsService;

  beforeEach(async () => {
    apiServiceMock = jasmine.createSpyObj<ApiService>('ApiService', [
      'getPlayerData',
    ]);

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

    apiServiceMock.getPlayerData.and.returnValue(of(mockPlayers));

    component.ngOnInit();

    expect(component.reportType).toBe('regular');
    expect(component.season).toBeUndefined();
    expect(component.statsPerGame).toBe(false);
    expect(component.minGames).toBe(0);
    expect(apiServiceMock.getPlayerData).toHaveBeenCalledWith({
      reportType: 'regular',
      season: undefined,
    });
    expect(component.loading).toBe(false);
    expect(component.tableData).toEqual(mockPlayers);
    expect(component.maxGames).toBe(10);

    apiServiceMock.getPlayerData.calls.reset();

    filterService.updatePlayerFilters({
      reportType: 'playoffs',
      season: 2024,
      statsPerGame: false,
      minGames: 5,
    });

    expect(component.reportType).toBe('playoffs');
    expect(component.season).toBe(2024);
    expect(component.statsPerGame).toBe(false);
    expect(component.minGames).toBe(5);
    expect(apiServiceMock.getPlayerData).toHaveBeenCalledWith({
      reportType: 'playoffs',
      season: 2024,
    });
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

    apiServiceMock.getPlayerData.and.returnValue(of(apiData));
    spyOn(statsService, 'getPlayerStatsPerGame').and.returnValue(perGameData);

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

    apiServiceMock.getPlayerData.and.returnValue(of(mockPlayers));

    component.statsPerGame = false;
    component.minGames = 8;

    component.fetchData({ reportType: 'regular' });

    expect(component.tableData.length).toBe(1);
    expect(component.tableData[0].name).toBe('Player 1');
    expect(component.maxGames).toBe(10);
  });

  it('should handle empty player data without errors', () => {
    const mockPlayers: Player[] = [];

    apiServiceMock.getPlayerData.and.returnValue(of(mockPlayers));

    component.statsPerGame = false;
    component.minGames = 0;

    component.fetchData({ reportType: 'regular' });

    expect(component.tableData).toEqual([]);
    expect(component.maxGames).toBe(0);
    expect(component.loading).toBe(false);
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

    apiServiceMock.getPlayerData.and.returnValue(of(mockPlayers));

    component.statsPerGame = false;
    component.minGames = 0;

    component.fetchData();

    expect(apiServiceMock.getPlayerData).toHaveBeenCalledWith({});
    expect(component.tableData).toEqual(mockPlayers);
    expect(component.maxGames).toBe(3);
    expect(component.loading).toBe(false);
  });

  it('should complete destroy$ on ngOnDestroy', () => {
    const nextSpy = spyOn<any>(component['destroy$'], 'next');
    const completeSpy = spyOn<any>(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(nextSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });
});
