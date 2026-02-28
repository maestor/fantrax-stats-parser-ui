import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PositionFilterToggleComponent } from './position-filter-toggle.component';
import { FilterService, PositionFilter } from '@services/filter.service';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonToggleModule, MatButtonToggleChange } from '@angular/material/button-toggle';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('PositionFilterToggleComponent', () => {
    let component: PositionFilterToggleComponent;
    let fixture: ComponentFixture<PositionFilterToggleComponent>;
    let filterService: FilterService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                PositionFilterToggleComponent,
                TranslateModule.forRoot(),
                MatButtonToggleModule,
                NoopAnimationsModule,
            ],
            providers: [FilterService],
        }).compileComponents();

        fixture = TestBed.createComponent(PositionFilterToggleComponent);
        component = fixture.componentInstance;
        filterService = TestBed.inject(FilterService);
    });

    afterEach(() => {
        if (component) {
            component.ngOnDestroy();
        }
        filterService.resetPlayerFilters();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('ngOnInit - player context', () => {
        it('should subscribe to player filters', fakeAsync(() => {
            component.context = 'player';
            component.ngOnInit();
            tick();

            expect(component.positionFilter).toBe('all');
        }));

        it('should update positionFilter when player filters change', fakeAsync(() => {
            component.context = 'player';
            component.ngOnInit();
            tick();

            filterService.updatePlayerFilters({ positionFilter: 'F' });
            tick();

            expect(component.positionFilter).toBe('F');
        }));

        it('should update positionFilter to D when filters change to D', fakeAsync(() => {
            component.context = 'player';
            component.ngOnInit();
            tick();

            filterService.updatePlayerFilters({ positionFilter: 'D' });
            tick();

            expect(component.positionFilter).toBe('D');
        }));
    });

    describe('ngOnInit - goalie context', () => {
        it('should not subscribe to filters for goalie context', fakeAsync(() => {
            component.context = 'goalie';
            component.ngOnInit();
            tick();

            // Should remain at default value since goalies don't use position filter
            expect(component.positionFilter).toBe('all');
        }));
    });

    describe('onPositionChange', () => {
        it('should update player filters when position changes to F', fakeAsync(() => {
            component.context = 'player';
            const event = { value: 'F' } as MatButtonToggleChange;

            let result: PositionFilter | undefined;
            filterService.playerFilters$.subscribe((filters) => {
                result = filters.positionFilter;
            });

            component.onPositionChange(event);
            tick();

            expect(result).toBe('F');
        }));

        it('should update player filters when position changes to D', fakeAsync(() => {
            component.context = 'player';
            const event = { value: 'D' } as MatButtonToggleChange;

            let result: PositionFilter | undefined;
            filterService.playerFilters$.subscribe((filters) => {
                result = filters.positionFilter;
            });

            component.onPositionChange(event);
            tick();

            expect(result).toBe('D');
        }));

        it('should update player filters when position changes to all', fakeAsync(() => {
            component.context = 'player';
            filterService.updatePlayerFilters({ positionFilter: 'F' });
            tick();

            let result: PositionFilter | undefined;
            filterService.playerFilters$.subscribe((filters) => {
                result = filters.positionFilter;
            });

            const event = { value: 'all' } as MatButtonToggleChange;
            component.onPositionChange(event);
            tick();

            expect(result).toBe('all');
        }));
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
