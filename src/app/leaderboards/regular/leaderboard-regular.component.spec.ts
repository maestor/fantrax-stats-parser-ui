import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeaderboardRegularComponent } from './leaderboard-regular.component';
import { ApiService, RegularLeaderboardEntry } from '@services/api.service';
import { TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Subject, of, throwError } from 'rxjs';

const MOCK_ENTRIES: RegularLeaderboardEntry[] = [
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

describe('LeaderboardRegularComponent', () => {
  let component: LeaderboardRegularComponent;
  let fixture: ComponentFixture<LeaderboardRegularComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('ApiService', ['getLeaderboardRegular']);
    apiSpy.getLeaderboardRegular.and.returnValue(of(MOCK_ENTRIES));

    await TestBed.configureTestingModule({
      imports: [
        LeaderboardRegularComponent,
        TranslateModule.forRoot(),
        NoopAnimationsModule,
      ],
      providers: [{ provide: ApiService, useValue: apiSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(LeaderboardRegularComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load data and derive positions on init', () => {
    expect(apiSpy.getLeaderboardRegular).toHaveBeenCalledTimes(1);
    expect(component.data.length).toBe(3);
  });

  it('should derive positions correctly with ties', () => {
    const positions = component.data.map(d => d.displayPosition);
    expect(positions).toEqual(['1', '2', '']);
  });

  it('should include pointsPercent column between losses and winPercent', () => {
    const cols = component.displayedColumns;
    const lossesIdx = cols.indexOf('losses');
    const pointsPercentIdx = cols.indexOf('pointsPercent');
    const winPercentIdx = cols.indexOf('winPercent');
    expect(pointsPercentIdx).toBeGreaterThan(lossesIdx);
    expect(pointsPercentIdx).toBeLessThan(winPercentIdx);
  });

  it('should format pointsPercent as Finnish style percentage', () => {
    expect(component.formatCell('pointsPercent', 0.654)).toBe('65,4');
    expect(component.formatCell('pointsPercent', 0.596)).toBe('59,6');
  });

  it('should format winPercent as Finnish style', () => {
    expect(component.formatWinPercent(0.615)).toBe('61,5');
    expect(component.formatWinPercent(0.563)).toBe('56,3');
  });

  it('should set apiError and clear loading on API failure', async () => {
    apiSpy.getLeaderboardRegular.and.returnValue(throwError(() => new Error('API error')));

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [LeaderboardRegularComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [{ provide: ApiService, useValue: apiSpy }],
    }).compileComponents();

    const errorFixture = TestBed.createComponent(LeaderboardRegularComponent);
    errorFixture.detectChanges();
    const errorComponent = errorFixture.componentInstance;

    expect(errorComponent.apiError).toBeTrue();
    expect(errorComponent.loading).toBeFalse();
  });

  it('should set loading to true before data arrives', async () => {
    const subject$ = new Subject<RegularLeaderboardEntry[]>();
    apiSpy.getLeaderboardRegular.and.returnValue(subject$.asObservable());

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [LeaderboardRegularComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [{ provide: ApiService, useValue: apiSpy }],
    }).compileComponents();

    const pendingFixture = TestBed.createComponent(LeaderboardRegularComponent);
    pendingFixture.detectChanges();

    expect(pendingFixture.componentInstance.loading).toBeTrue();

    subject$.next(MOCK_ENTRIES);
    subject$.complete();
    pendingFixture.detectChanges();

    expect(pendingFixture.componentInstance.loading).toBeFalse();
    expect(pendingFixture.componentInstance.data.length).toBe(3);
  });
});
