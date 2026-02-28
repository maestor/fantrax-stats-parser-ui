import type { MockedObject } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeaderboardPlayoffsComponent } from './leaderboard-playoffs.component';
import { ApiService } from '@services/api.service';
import { TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

describe('LeaderboardPlayoffsComponent', () => {
    let component: LeaderboardPlayoffsComponent;
    let fixture: ComponentFixture<LeaderboardPlayoffsComponent>;
    let apiSpy: MockedObject<ApiService>;

    beforeEach(async () => {
        apiSpy = {
            getLeaderboardPlayoffs: vi.fn().mockName("ApiService.getLeaderboardPlayoffs")
        };
        apiSpy.getLeaderboardPlayoffs.mockReturnValue(of([]));

        await TestBed.configureTestingModule({
            imports: [LeaderboardPlayoffsComponent, TranslateModule.forRoot(), NoopAnimationsModule],
            providers: [{ provide: ApiService, useValue: apiSpy }],
        }).compileComponents();

        fixture = TestBed.createComponent(LeaderboardPlayoffsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('fetchFn should delegate to getLeaderboardPlayoffs', () => {
        component.fetchFn();
        expect(apiSpy.getLeaderboardPlayoffs).toHaveBeenCalled();
    });
});
