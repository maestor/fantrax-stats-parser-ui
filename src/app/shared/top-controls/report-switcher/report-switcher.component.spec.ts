import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReportSwitcherComponent } from './report-switcher.component';
import { FilterService } from '@services/filter.service';
import { TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ReportSwitcherComponent', () => {
    let component: ReportSwitcherComponent;
    let fixture: ComponentFixture<ReportSwitcherComponent>;
    let filterService: FilterService;

    beforeEach(async () => {
        localStorage.clear();
        await TestBed.configureTestingModule({
            imports: [
                ReportSwitcherComponent,
                TranslateModule.forRoot(),
                NoopAnimationsModule,
            ],
            providers: [FilterService],
        }).compileComponents();

        fixture = TestBed.createComponent(ReportSwitcherComponent);
        component = fixture.componentInstance;
        filterService = TestBed.inject(FilterService);
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

    describe('initialization', () => {
        it('should have default context as player', () => {
            expect(component.context).toBe('player');
        });

        it('should initialize reportType$ observable', () => {
            expect(component.reportType$).toBeDefined();
        });
    });

    describe('ngOnInit - player context', () => {
        it('should reflect initial player filter reportType', () => {
            component.context = 'player';
            component.ngOnInit();


            component.reportType$.subscribe((value) => {
                expect(value).toBe('regular');
            });
        });

        it('should update reportType$ when player filters change', () => {
            component.context = 'player';
            component.ngOnInit();


            filterService.updatePlayerFilters({ reportType: 'playoffs' });


            component.reportType$.subscribe((value) => {
                expect(value).toBe('playoffs');
            });
        });

        it('should emit multiple values as filters change', () => {
            component.context = 'player';
            component.ngOnInit();


            const emissions: string[] = [];
            component.reportType$.subscribe((value) => emissions.push(value));


            filterService.updatePlayerFilters({ reportType: 'playoffs' });


            filterService.updatePlayerFilters({ reportType: 'regular' });


            expect(emissions).toContain('regular');
            expect(emissions).toContain('playoffs');
        });
    });

    describe('ngOnInit - goalie context', () => {
        it('should reflect initial goalie filter reportType', () => {
            component.context = 'goalie';
            component.ngOnInit();


            component.reportType$.subscribe((value) => {
                expect(value).toBe('regular');
            });
        });

        it('should update reportType$ when goalie filters change', () => {
            component.context = 'goalie';
            component.ngOnInit();


            filterService.updateGoalieFilters({ reportType: 'playoffs' });


            component.reportType$.subscribe((value) => {
                expect(value).toBe('playoffs');
            });
        });

        it('should be updated when player filter reportType changes (global sync)', () => {
            component.context = 'goalie';
            component.ngOnInit();


            filterService.updatePlayerFilters({ reportType: 'playoffs' });


            component.reportType$.subscribe((value) => {
                expect(value).toBe('playoffs');
            });
        });
    });

    describe('changeReportType', () => {
        it('updates player filters when called in player context', () => {
            component.context = 'player';
            component.ngOnInit();


            component.changeReportType('playoffs');


            filterService.playerFilters$.subscribe((f) => expect(f.reportType).toBe('playoffs'));
        });

        it('updates goalie filters when called in goalie context', () => {
            component.context = 'goalie';
            component.ngOnChanges({
                context: { currentValue: 'goalie', previousValue: 'player', firstChange: true, isFirstChange: () => true },
            });
            component.ngOnInit();


            component.changeReportType('both');


            filterService.goalieFilters$.subscribe((f) => expect(f.reportType).toBe('both'));
        });

        it('supports all report type values', () => {
            component.context = 'player';
            component.ngOnInit();


            component.changeReportType('both');


            filterService.playerFilters$.subscribe((f) => expect(f.reportType).toBe('both'));
        });

        it('syncs reportType to goalie filters via global sync', () => {
            component.context = 'player';
            component.ngOnInit();


            component.changeReportType('playoffs');


            filterService.goalieFilters$.subscribe((f) => expect(f.reportType).toBe('playoffs'));
        });

        it('works correctly after context change', () => {
            component.context = 'player';
            component.ngOnInit();


            component.changeReportType('playoffs');


            component.context = 'goalie';
            component.ngOnChanges({
                context: {
                    currentValue: 'goalie',
                    previousValue: 'player',
                    firstChange: false,
                    isFirstChange: () => false,
                },
            });


            component.reportType$.subscribe((value) => expect(value).toBe('playoffs'));
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

        it('should unsubscribe from filter changes', () => {
            component.context = 'player';
            component.ngOnInit();


            const emissions: string[] = [];
            component.reportType$.subscribe((value) => emissions.push(value));


            component.ngOnDestroy();

            filterService.updatePlayerFilters({ reportType: 'playoffs' });


            expect(emissions.filter((e) => e === 'playoffs').length).toBe(0);
        });
    });

    describe('integration scenarios', () => {
        it('should synchronize observable with filter service', () => {
            component.context = 'player';
            filterService.updatePlayerFilters({ reportType: 'playoffs' });


            component.ngOnInit();


            component.reportType$.subscribe((value) => {
                expect(value).toBe('playoffs');
            });
        });

        it('should handle rapid filter changes', () => {
            component.context = 'player';
            component.ngOnInit();


            const emissions: string[] = [];
            component.reportType$.subscribe((value) => emissions.push(value));


            filterService.updatePlayerFilters({ reportType: 'playoffs' });

            filterService.updatePlayerFilters({ reportType: 'regular' });

            filterService.updatePlayerFilters({ reportType: 'playoffs' });


            expect(emissions[emissions.length - 1]).toBe('playoffs');
        });

        it('should work correctly after context change', () => {
            component.context = 'player';
            component.ngOnInit();


            filterService.updatePlayerFilters({ reportType: 'playoffs' });


            component.context = 'goalie';
            component.ngOnChanges({
                context: {
                    currentValue: 'goalie',
                    previousValue: 'player',
                    firstChange: false,
                    isFirstChange: () => false,
                },
            });


            component.reportType$.subscribe((value) => expect(value).toBe('playoffs'));
        });
    });
});
