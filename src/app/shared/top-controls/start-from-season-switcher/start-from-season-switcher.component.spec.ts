import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { StartFromSeasonSwitcherComponent } from './start-from-season-switcher.component';
import { ApiService, Season } from '@services/api.service';
import { TeamService } from '@services/team.service';
import { SettingsService } from '@services/settings.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, of } from 'rxjs';
import { throwError } from 'rxjs';

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

describe('StartFromSeasonSwitcherComponent', () => {
  let component: StartFromSeasonSwitcherComponent;
  let fixture: ComponentFixture<StartFromSeasonSwitcherComponent>;
  let apiService: ApiService;
  let settingsService: SettingsService;

  const mockSeasons: Season[] = [
    { season: 2024, text: '2024-25' },
    { season: 2023, text: '2023-24' },
  ];

  const mockSeasonsTeam2: Season[] = [
    { season: 2016, text: '2016-17' },
    { season: 2015, text: '2015-16' },
  ];

  beforeEach(async () => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }

    const apiServiceMock = {
      getSeasons: jasmine
        .createSpy('getSeasons')
        .and.callFake((reportType: string, teamId?: string) => {
          if (reportType !== 'regular') return of([] as any);
          return teamId === '2' ? of(mockSeasonsTeam2) : of(mockSeasons);
        }),
    };

    await TestBed.configureTestingModule({
      imports: [
        StartFromSeasonSwitcherComponent,
        TranslateModule.forRoot(),
        NoopAnimationsModule,
      ],
      providers: [
        { provide: ApiService, useValue: apiServiceMock },
        { provide: TeamService, useClass: TeamServiceMock },
        SettingsService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StartFromSeasonSwitcherComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService);
    settingsService = TestBed.inject(SettingsService);

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation(
      'fi',
      {
        startFromSeason: {
          selector: 'Alkaen kaudesta',
        },
      },
      true
    );
    translate.use('fi');
  });

  afterEach(() => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load regular seasons on init', fakeAsync(() => {
    component.ngOnInit();
    tick();

    expect(apiService.getSeasons).toHaveBeenCalledWith('regular');
    expect(component.seasons.length).toBe(2);
  }));

  it('should sort seasons from oldest to newest', fakeAsync(() => {
    component.ngOnInit();
    tick();

    expect(component.seasons.map((s) => s.season)).toEqual([2023, 2024]);
  }));

  it('should persist startFrom selection via SettingsService', fakeAsync(() => {
    component.ngOnInit();
    tick();

    component.changeStartFrom({ value: 2023 } as any);
    tick();

    expect(settingsService.startFromSeason).toBe(2023);
  }));

  it('should ignore non-numeric selections', fakeAsync(() => {
    component.ngOnInit();
    tick();

    component.changeStartFrom({ value: 2024 } as any);
    tick();

    component.changeStartFrom({ value: 'not-a-season' } as any);
    tick();

    expect(settingsService.startFromSeason).toBe(2024);
  }));

  it('should load regular seasons with teamId when a non-default team is selected', fakeAsync(() => {
    component.ngOnInit();
    tick();

    (apiService.getSeasons as jasmine.Spy).calls.reset();

    const teamService = TestBed.inject(TeamService) as unknown as TeamServiceMock;
    teamService.setTeamId('2');
    tick();

    expect(apiService.getSeasons).toHaveBeenCalledWith('regular', '2');
  }));

  it('should normalize season numbers returned as strings', fakeAsync(() => {
    (apiService.getSeasons as jasmine.Spy).and.returnValue(
      of([
        { season: '2024', text: '2024-25' } as any,
        { season: '2023', text: '2023-24' } as any,
      ])
    );

    component.ngOnInit();
    tick();

    expect(component.seasons.every((s) => typeof s.season === 'number')).toBeTrue();
  }));

  it('should keep season value when it cannot be normalized', fakeAsync(() => {
    (apiService.getSeasons as jasmine.Spy).and.returnValue(
      of([{ season: 'not-a-season', text: '???' } as any])
    );

    component.ngOnInit();
    tick();

    expect(component.seasons.length).toBe(1);
    expect(component.seasons[0].season as any).toBe('not-a-season');
  }));

  it('should reset startFrom to oldest when selected season is not present in fetched seasons', fakeAsync(() => {
    const resetSpy = spyOn(settingsService, 'setStartFromSeason').and.callThrough();

    component.ngOnInit();

    // Ensure a value is selected before the seasons response is processed.
    settingsService.setStartFromSeason(2022);
    tick();

    expect(resetSpy).toHaveBeenCalledWith(2023);
    expect(settingsService.startFromSeason).toBe(2023);
  }));

  it('should reset startFrom to team oldest on team changes (and reset again when switching back)', fakeAsync(() => {
    const resetSpy = spyOn(settingsService, 'setStartFromSeason').and.callThrough();

    component.ngOnInit();
    tick();

    // Choose a valid season for default team
    settingsService.setStartFromSeason(2024);
    tick();

    const teamService = TestBed.inject(TeamService) as unknown as TeamServiceMock;

    resetSpy.calls.reset();
    teamService.setTeamId('2');
    tick();

    expect(resetSpy).toHaveBeenCalledWith(2015);
    expect(settingsService.startFromSeason).toBe(2015);

    resetSpy.calls.reset();
    teamService.setTeamId('1');
    tick();

    expect(resetSpy).toHaveBeenCalledWith(2023);
    expect(settingsService.startFromSeason).toBe(2023);
  }));

  it('should handle API errors by showing an empty season list', fakeAsync(() => {
    (apiService.getSeasons as jasmine.Spy).and.returnValue(
      throwError(() => new Error('network'))
    );

    component.ngOnInit();
    tick();

    expect(component.seasons).toEqual([]);
  }));
});
