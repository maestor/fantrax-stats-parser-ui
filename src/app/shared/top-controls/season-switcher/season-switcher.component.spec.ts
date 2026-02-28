import type { Mock } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeasonSwitcherComponent } from './season-switcher.component';
import { ApiService, Season } from '@services/api.service';
import { FilterService } from '@services/filter.service';
import { TeamService } from '@services/team.service';
import { SettingsService } from '@services/settings.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject } from 'rxjs';
import { of, throwError } from 'rxjs';

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

describe('SeasonSwitcherComponent', () => {
    let component: SeasonSwitcherComponent;
    let fixture: ComponentFixture<SeasonSwitcherComponent>;
    let apiService: ApiService;
    let filterService: FilterService;
    let translate: TranslateService;
    let startFromSeasonSubject: BehaviorSubject<number | undefined>;

    const mockSeasons: Season[] = [
        { season: 2024, text: '2024-25' },
        { season: 2023, text: '2023-24' },
        { season: 2022, text: '2022-23' },
    ];

    beforeEach(async () => {
        const apiServiceMock = {
            getSeasons: vi.fn().mockReturnValue(of(mockSeasons)),
        };
        startFromSeasonSubject = new BehaviorSubject<number | undefined>(undefined);

        await TestBed.configureTestingModule({
            imports: [
                SeasonSwitcherComponent,
                TranslateModule.forRoot(),
                MatSelectModule,
                NoopAnimationsModule,
            ],
            providers: [
                { provide: ApiService, useValue: apiServiceMock },
                FilterService,
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
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(SeasonSwitcherComponent);
        component = fixture.componentInstance;
        apiService = TestBed.inject(ApiService);
        filterService = TestBed.inject(FilterService);
        translate = TestBed.inject(TranslateService);

        translate.setTranslation('fi', {
            season: {
                selector: 'Kausivalitsin',
                allSeasons: 'Kaikki kaudet',
            },
        }, true);
        translate.use('fi');
    });

    afterEach(() => {
        if (component) {
            component.ngOnDestroy();
        }
        filterService.resetPlayerFilters();
        filterService.resetGoalieFilters();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('should load seasons on init', () => {
            component.ngOnInit();


            expect(apiService.getSeasons).toHaveBeenCalledWith('regular');
            expect(component.seasons.length).toBe(3);
        });

        it('should reverse seasons order (newest first)', () => {
            component.ngOnInit();


            expect(component.seasons[0].season).toBe(2022);
            expect(component.seasons[2].season).toBe(2024);
        });

        it('should subscribe to player filters when context is player', () => {
            component.context = 'player';
            component.ngOnInit();


            expect(component.selectedSeason).toBe('all');
        });

        it('should update selectedSeason when player filters change', () => {
            component.context = 'player';
            component.ngOnInit();


            filterService.updatePlayerFilters({ season: 2024 });


            expect(component.selectedSeason).toBe(2024);
        });

        it('should subscribe to goalie filters when context is goalie', () => {
            component.context = 'goalie';
            component.ngOnInit();


            filterService.updateGoalieFilters({ season: 2023 });


            expect(component.selectedSeason).toBe(2023);
        });

        it('should refetch seasons when reportType changes', () => {
            component.context = 'player';
            component.ngOnInit();


            (apiService.getSeasons as Mock).mockClear();

            filterService.updatePlayerFilters({ reportType: 'playoffs' });


            expect(apiService.getSeasons).toHaveBeenCalledWith('playoffs');
        });

        it('should include teamId when a non-default team is selected', () => {
            component.context = 'player';
            component.ngOnInit();


            (apiService.getSeasons as Mock).mockClear();

            const teamService = TestBed.inject(TeamService) as unknown as TeamServiceMock;
            teamService.setTeamId('2');


            // On team change we first show the unfiltered season list.
            expect(apiService.getSeasons).toHaveBeenCalledWith('regular', '2');

            // Once startFromSeason is resolved, SeasonSwitcher refetches filtered seasons.
            (apiService.getSeasons as Mock).mockClear();
            startFromSeasonSubject.next(2018);


            expect(apiService.getSeasons).toHaveBeenCalledWith('regular', '2', 2018);
        });

        it('should not refetch when the same teamId re-emits after initialization', () => {
            component.context = 'player';
            component.ngOnInit();


            (apiService.getSeasons as Mock).mockClear();

            const teamService = TestBed.inject(TeamService) as unknown as TeamServiceMock;
            teamService.setTeamId('1');


            // distinctUntilChanged should prevent redundant API calls, but scan still evaluates teamChanged.
            expect(apiService.getSeasons).not.toHaveBeenCalled();
        });

        it('should refetch seasons with startFrom when startFromSeason changes', () => {
            component.context = 'player';
            component.ngOnInit();


            (apiService.getSeasons as Mock).mockClear();

            startFromSeasonSubject.next(2018);


            expect(apiService.getSeasons).toHaveBeenCalledWith('regular', undefined, 2018);
        });

        it('should show all seasons label when selectedSeason is all', () => {
            component.context = 'player';
            component.ngOnInit();

            fixture.detectChanges();

            fixture.detectChanges();

            expect(component.selectedSeason).toBe('all');

            const compiled = fixture.nativeElement as HTMLElement;
            const trigger = (compiled.querySelector('.mat-mdc-select-min-line') as HTMLElement | null) ??
                (compiled.querySelector('.mat-mdc-select-value-text') as HTMLElement | null) ??
                (compiled.querySelector('.mat-mdc-select-trigger') as HTMLElement | null);

            expect(trigger).toBeTruthy();
            expect(trigger?.textContent).toContain('Kaikki kaudet');
        });
    });

    describe('API error handling', () => {
        it('should clear seasons and selectedSeasonText on API error', () => {
            component.selectedSeason = 2024;
            component.seasons = [...mockSeasons];

            (apiService.getSeasons as Mock).mockReturnValue(throwError(() => new Error('boom')));

            component.ngOnInit();


            expect(component.seasons).toEqual([]);
            expect(component.selectedSeasonText).toBeUndefined();
        });
    });

    describe('changeSeason', () => {
        it('should update player filters when context is player', () => {
            component.context = 'player';
            const event = { value: 2024 } as MatSelectChange;

            let result: number | undefined;
            filterService.playerFilters$.subscribe((filters) => {
                result = filters.season;
            });

            component.changeSeason(event);


            expect(result).toBe(2024);
        });

        it('should update goalie filters when context is goalie', () => {
            component.context = 'goalie';
            const event = { value: 2023 } as MatSelectChange;

            let result: number | undefined;
            filterService.goalieFilters$.subscribe((filters) => {
                result = filters.season;
            });

            component.changeSeason(event);


            expect(result).toBe(2023);
        });

        it('should handle undefined season', () => {
            component.context = 'player';
            const event = { value: 'all' } as MatSelectChange;

            let result: number | undefined;
            filterService.playerFilters$.subscribe((filters) => {
                result = filters.season;
            });

            component.changeSeason(event);


            expect(result).toBeUndefined();
        });

        it('should coerce string season values to numbers', () => {
            component.context = 'player';
            const event = { value: '2024' } as unknown as MatSelectChange;

            let result: number | undefined;
            filterService.playerFilters$.subscribe((filters) => {
                result = filters.season;
            });

            component.seasons = [...mockSeasons];
            component.changeSeason(event);


            expect(component.selectedSeason).toBe(2024);
            expect(result).toBe(2024);
        });

        it('should treat non-numeric season strings as all (undefined filter season)', () => {
            component.context = 'player';

            const updateSpy = vi.spyOn(filterService, 'updatePlayerFilters');
            const event = { value: 'not-a-season' } as unknown as MatSelectChange;

            component.changeSeason(event);


            expect(component.selectedSeason).toBe('all');
            expect(updateSpy).toHaveBeenCalledWith({ season: undefined });
        });
    });

    describe('seasons normalization + invalid selected season handling', () => {
        it('should normalize numeric-string seasons and keep invalid seasons unchanged', () => {
            (apiService.getSeasons as Mock).mockReturnValue(of([
                { season: '2024', text: '2024-25' } as any,
                { season: 'oops', text: 'N/A' } as any,
            ]));

            component.ngOnInit();


            expect(component.seasons.some((s) => s.season === 2024)).toBe(true);
            expect(component.seasons.some((s: any) => s.season === 'oops')).toBe(true);
        });

        it('should reset player season filter when selected season is not present in loaded seasons', () => {
            component.context = 'player';

            // Drive selectedSeason via FilterService (ngOnInit subscribes to filters).
            filterService.updatePlayerFilters({ season: 2099 });

            const updateSpy = vi.spyOn(filterService, 'updatePlayerFilters');

            (apiService.getSeasons as Mock).mockReturnValue(of(mockSeasons));
            component.ngOnInit();


            expect(updateSpy).toHaveBeenCalledWith({ season: undefined });
        });

        it('should reset goalie season filter when selected season is not present in loaded seasons', () => {
            component.context = 'goalie';

            filterService.updateGoalieFilters({ season: 2099 });

            const updateSpy = vi.spyOn(filterService, 'updateGoalieFilters');

            (apiService.getSeasons as Mock).mockReturnValue(of(mockSeasons));
            component.ngOnInit();


            expect(updateSpy).toHaveBeenCalledWith({ season: undefined });
        });
    });

    describe('ngOnDestroy', () => {
        it('should complete destroy$ subject', () => {
            vi.spyOn(component.destroy$, 'next');
            vi.spyOn(component.destroy$, 'complete');

            component.ngOnDestroy();

            expect(component.destroy$.next).toHaveBeenCalled();
            expect(component.destroy$.complete).toHaveBeenCalled();
        });
    });
});
