import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeaderboardComponent } from './leaderboard.component';
import { RegularLeaderboardEntry, PlayoffLeaderboardEntry } from '@services/api.service';
import { TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Observable, Subject, of, throwError } from 'rxjs';
import { Column } from '@shared/column.types';

const MOCK_COLUMNS: Column[] = [
  { field: 'displayPosition', align: 'left', sortable: false },
  { field: 'teamName', align: 'left' },
];

const MOCK_REGULAR_ENTRIES: RegularLeaderboardEntry[] = [
  {
    teamId: '1', teamName: 'Team A', seasons: 13,
    wins: 80, losses: 40, ties: 10, points: 170, pointsPercent: 0.654,
    divWins: 20, divLosses: 10, divTies: 3,
    winPercent: 0.615, divWinPercent: 0.605,
    regularTrophies: 3, tieRank: false,
  },
  {
    teamId: '2', teamName: 'Team B', seasons: 13,
    wins: 75, losses: 50, ties: 5, points: 155, pointsPercent: 0.596,
    divWins: 18, divLosses: 12, divTies: 2,
    winPercent: 0.577, divWinPercent: 0.563,
    regularTrophies: 2, tieRank: false,
  },
  {
    teamId: '3', teamName: 'Team C', seasons: 13,
    wins: 75, losses: 50, ties: 5, points: 155, pointsPercent: 0.596,
    divWins: 17, divLosses: 13, divTies: 2,
    winPercent: 0.577, divWinPercent: 0.545,
    regularTrophies: 1, tieRank: true,
  },
];

const MOCK_PLAYOFF_ENTRIES: PlayoffLeaderboardEntry[] = [
  { teamId: '1', teamName: 'Team A', championships: 3, finals: 4, conferenceFinals: 6, secondRound: 8, firstRound: 10, tieRank: false },
  { teamId: '2', teamName: 'Team B', championships: 2, finals: 3, conferenceFinals: 5, secondRound: 7, firstRound: 9, tieRank: false },
  { teamId: '3', teamName: 'Team C', championships: 2, finals: 3, conferenceFinals: 4, secondRound: 6, firstRound: 8, tieRank: true },
];

function createFixture<T extends RegularLeaderboardEntry | PlayoffLeaderboardEntry>(
  fetchFn: () => Observable<T[]>,
  columns: Column[] = MOCK_COLUMNS,
): ComponentFixture<LeaderboardComponent> {
  const fixture = TestBed.createComponent(LeaderboardComponent);
  fixture.componentInstance.fetchFn = fetchFn as LeaderboardComponent['fetchFn'];
  fixture.componentInstance.columns = columns;
  fixture.detectChanges();
  return fixture;
}

describe('LeaderboardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaderboardComponent, TranslateModule.forRoot(), NoopAnimationsModule],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = createFixture(() => of(MOCK_REGULAR_ENTRIES));
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should call fetchFn on init and load regular data', () => {
    const fetchFn = jasmine.createSpy('fetchFn').and.returnValue(of(MOCK_REGULAR_ENTRIES));
    const fixture = createFixture(fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.data.length).toBe(3);
    expect(fixture.componentInstance.loading).toBeFalse();
  });

  it('should call fetchFn on init and load playoff data', () => {
    const fetchFn = jasmine.createSpy('fetchFn').and.returnValue(of(MOCK_PLAYOFF_ENTRIES));
    const fixture = createFixture(fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.data.length).toBe(3);
  });

  it('should derive positions correctly with ties', () => {
    const fixture = createFixture(() => of(MOCK_REGULAR_ENTRIES));
    const positions = fixture.componentInstance.data.map((d) => d.displayPosition);
    expect(positions).toEqual(['1', '2', '']);
  });

  it('should set apiError and clear loading on API failure', async () => {
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [LeaderboardComponent, TranslateModule.forRoot(), NoopAnimationsModule],
    }).compileComponents();

    const errorFixture = TestBed.createComponent(LeaderboardComponent);
    errorFixture.componentInstance.fetchFn = () => throwError(() => new Error('API error'));
    errorFixture.componentInstance.columns = MOCK_COLUMNS;
    errorFixture.detectChanges();

    expect(errorFixture.componentInstance.apiError).toBeTrue();
    expect(errorFixture.componentInstance.loading).toBeFalse();
  });

  it('should set loading to true before data arrives, false after', async () => {
    const subject$ = new Subject<RegularLeaderboardEntry[]>();

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [LeaderboardComponent, TranslateModule.forRoot(), NoopAnimationsModule],
    }).compileComponents();

    const pendingFixture = TestBed.createComponent(LeaderboardComponent);
    pendingFixture.componentInstance.fetchFn = () => subject$.asObservable();
    pendingFixture.componentInstance.columns = MOCK_COLUMNS;
    pendingFixture.detectChanges();

    expect(pendingFixture.componentInstance.loading).toBeTrue();

    subject$.next(MOCK_REGULAR_ENTRIES);
    subject$.complete();
    pendingFixture.detectChanges();

    expect(pendingFixture.componentInstance.loading).toBeFalse();
    expect(pendingFixture.componentInstance.data.length).toBe(3);
  });
});
