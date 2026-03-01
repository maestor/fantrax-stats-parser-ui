import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeaderboardRegularComponent } from './leaderboard-regular.component';
import { ApiService } from '@services/api.service';
import { TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

describe('LeaderboardRegularComponent', () => {
    let component: LeaderboardRegularComponent;
    let fixture: ComponentFixture<LeaderboardRegularComponent>;
    let apiSpy: any;

    beforeEach(async () => {
        apiSpy = {
            getLeaderboardRegular: vi.fn().mockName("ApiService.getLeaderboardRegular")
        } as any;
        apiSpy.getLeaderboardRegular.mockReturnValue(of([]));

        await TestBed.configureTestingModule({
            imports: [LeaderboardRegularComponent, TranslateModule.forRoot(), NoopAnimationsModule],
            providers: [{ provide: ApiService, useValue: apiSpy }],
        }).compileComponents();

        fixture = TestBed.createComponent(LeaderboardRegularComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('fetchFn should delegate to getLeaderboardRegular', () => {
        component.fetchFn();
        expect(apiSpy.getLeaderboardRegular).toHaveBeenCalled();
    });

    describe('formatCell', () => {
        it('should format winPercent as Finnish style percentage', () => {
            expect(component.formatCell('winPercent', 0.615)).toBe('61,5');
            expect(component.formatCell('winPercent', 0.563)).toBe('56,3');
        });

        it('should format pointsPercent as Finnish style percentage', () => {
            expect(component.formatCell('pointsPercent', 0.654)).toBe('65,4');
            expect(component.formatCell('pointsPercent', 0.596)).toBe('59,6');
        });

        it('should pass through non-percent columns as string', () => {
            expect(component.formatCell('teamName', 'Team A')).toBe('Team A');
            expect(component.formatCell('wins', 80)).toBe('80');
        });

        it('should handle undefined value gracefully', () => {
            expect(component.formatCell('wins', undefined)).toBe('');
        });
    });

    it('should include pointsPercent column between losses and winPercent', () => {
        const cols = component.columns.map((c) => c.field);
        const lossesIdx = cols.indexOf('losses');
        const pointsPercentIdx = cols.indexOf('pointsPercent');
        const winPercentIdx = cols.indexOf('winPercent');
        expect(pointsPercentIdx).toBeGreaterThan(lossesIdx);
        expect(pointsPercentIdx).toBeLessThan(winPercentIdx);
    });
});
