import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TeamSwitcherComponent } from './team-switcher.component';
import { ApiService, Team } from '@services/api.service';
import { FilterService } from '@services/filter.service';
import { TeamService } from '@services/team.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { MatSelectChange } from '@angular/material/select';

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

describe('TeamSwitcherComponent', () => {
  let component: TeamSwitcherComponent;
  let fixture: ComponentFixture<TeamSwitcherComponent>;
  let apiService: jasmine.SpyObj<ApiService>;
  let filterService: jasmine.SpyObj<FilterService>;
  let router: jasmine.SpyObj<Router>;
  let translate: TranslateService;

  const mockTeams: Team[] = [
    { id: '2', name: 'carolina' },
    { id: '1', name: 'colorado' },
  ];

  beforeEach(async () => {
    apiService = jasmine.createSpyObj<ApiService>('ApiService', ['getTeams']);
    filterService = jasmine.createSpyObj<FilterService>('FilterService', [
      'resetAll',
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        TeamSwitcherComponent,
        TranslateModule.forRoot(),
        NoopAnimationsModule,
      ],
      providers: [
        { provide: ApiService, useValue: apiService },
        { provide: FilterService, useValue: filterService },
        { provide: TeamService, useClass: TeamServiceMock },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamSwitcherComponent);
    component = fixture.componentInstance;

    translate = TestBed.inject(TranslateService);
    translate.setTranslation(
      'fi',
      {
        teams: {
          colorado: 'Colorado Avalanche',
          carolina: 'Carolina Hurricanes',
        },
      },
      true
    );
    translate.use('fi');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load teams on init', fakeAsync(() => {
    apiService.getTeams.and.returnValue(of(mockTeams));

    component.ngOnInit();
    tick();

    expect(apiService.getTeams).toHaveBeenCalled();
    expect(component.loading).toBe(false);
    expect(component.loadError).toBe(false);
    expect(component.teams.length).toBe(2);
  }));

  it('should sort teams alphabetically by translated label', fakeAsync(() => {
    apiService.getTeams.and.returnValue(of(mockTeams));

    component.ngOnInit();
    tick();

    expect(component.teams.map((t) => t.name)).toEqual(['carolina', 'colorado']);
  }));

  it('should set loadError on API failure', fakeAsync(() => {
    apiService.getTeams.and.returnValue(
      throwError(() => new Error('backend unavailable'))
    );

    component.ngOnInit();
    tick();

    expect(component.loading).toBe(false);
    expect(component.loadError).toBe(true);
    expect(component.teams).toEqual([]);
  }));

  it('should reset filters and navigate on team change', fakeAsync(() => {
    apiService.getTeams.and.returnValue(of(mockTeams));
    component.ngOnInit();
    tick();

    const event = { value: '2' } as MatSelectChange;
    component.changeTeam(event);
    tick();

    expect(component.selectedTeamId).toBe('2');
    expect(filterService.resetAll).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/player-stats']);
  }));
});
