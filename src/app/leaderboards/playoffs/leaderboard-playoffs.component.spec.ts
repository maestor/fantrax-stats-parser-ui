import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeaderboardPlayoffsComponent } from './leaderboard-playoffs.component';
import { ApiService, PlayoffLeaderboardEntry } from '@services/api.service';
import { TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

const MOCK_ENTRIES: PlayoffLeaderboardEntry[] = [
  {
    teamId: '1', teamName: 'Team A',
    championships: 3, finals: 4, conferenceFinals: 6,
    secondRound: 8, firstRound: 10, tieRank: false,
  },
  {
    teamId: '2', teamName: 'Team B',
    championships: 2, finals: 3, conferenceFinals: 5,
    secondRound: 7, firstRound: 9, tieRank: false,
  },
  {
    teamId: '3', teamName: 'Team C',
    championships: 2, finals: 3, conferenceFinals: 4,
    secondRound: 6, firstRound: 8, tieRank: true,
  },
];

describe('LeaderboardPlayoffsComponent', () => {
  let component: LeaderboardPlayoffsComponent;
  let fixture: ComponentFixture<LeaderboardPlayoffsComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('ApiService', ['getLeaderboardPlayoffs']);
    apiSpy.getLeaderboardPlayoffs.and.returnValue(of(MOCK_ENTRIES));

    await TestBed.configureTestingModule({
      imports: [
        LeaderboardPlayoffsComponent,
        TranslateModule.forRoot(),
        NoopAnimationsModule,
      ],
      providers: [{ provide: ApiService, useValue: apiSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(LeaderboardPlayoffsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load data and derive positions on init', () => {
    expect(apiSpy.getLeaderboardPlayoffs).toHaveBeenCalledTimes(1);
    expect(component.data.length).toBe(3);
  });

  it('should derive positions correctly with ties', () => {
    const positions = component.data.map(d => d.displayPosition);
    expect(positions).toEqual(['1', '2', '']);
  });

  it('should set apiError and clear loading on API failure', async () => {
    apiSpy.getLeaderboardPlayoffs.and.returnValue(throwError(() => new Error('API error')));

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [LeaderboardPlayoffsComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [{ provide: ApiService, useValue: apiSpy }],
    }).compileComponents();

    const errorFixture = TestBed.createComponent(LeaderboardPlayoffsComponent);
    errorFixture.detectChanges();
    const errorComponent = errorFixture.componentInstance;

    expect(errorComponent.apiError).toBeTrue();
    expect(errorComponent.loading).toBeFalse();
  });
});
