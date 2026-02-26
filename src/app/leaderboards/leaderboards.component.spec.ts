import { TestBed } from '@angular/core/testing';
import { LeaderboardsComponent } from './leaderboards.component';
import { ApiService } from '@services/api.service';
import { TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

describe('LeaderboardsComponent', () => {
  let component: LeaderboardsComponent;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('ApiService', ['getLeaderboardRegular', 'getLeaderboardPlayoffs']);
    apiSpy.getLeaderboardRegular.and.returnValue(of([]));
    apiSpy.getLeaderboardPlayoffs.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [LeaderboardsComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [{ provide: ApiService, useValue: apiSpy }],
    }).compileComponents();

    const fixture = TestBed.createComponent(LeaderboardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('regularFormatCell', () => {
    it('should format winPercent as Finnish style percentage', () => {
      expect(component.regularFormatCell('winPercent', 0.615)).toBe('61,5');
      expect(component.regularFormatCell('winPercent', 0.563)).toBe('56,3');
    });

    it('should format pointsPercent as Finnish style percentage', () => {
      expect(component.regularFormatCell('pointsPercent', 0.654)).toBe('65,4');
      expect(component.regularFormatCell('pointsPercent', 0.596)).toBe('59,6');
    });

    it('should pass through non-percent columns as string', () => {
      expect(component.regularFormatCell('teamName', 'Team A')).toBe('Team A');
      expect(component.regularFormatCell('wins', 80)).toBe('80');
    });

    it('should handle undefined value gracefully', () => {
      expect(component.regularFormatCell('wins', undefined)).toBe('');
    });
  });

  it('regularFetchFn should delegate to getLeaderboardRegular', () => {
    component.regularFetchFn();
    expect(apiSpy.getLeaderboardRegular).toHaveBeenCalled();
  });

  it('playoffsFetchFn should delegate to getLeaderboardPlayoffs', () => {
    component.playoffsFetchFn();
    expect(apiSpy.getLeaderboardPlayoffs).toHaveBeenCalled();
  });

  it('should include pointsPercent column between losses and winPercent in regularColumns', () => {
    const cols = component.regularColumns.map((c) => c.field);
    const lossesIdx = cols.indexOf('losses');
    const pointsPercentIdx = cols.indexOf('pointsPercent');
    const winPercentIdx = cols.indexOf('winPercent');
    expect(pointsPercentIdx).toBeGreaterThan(lossesIdx);
    expect(pointsPercentIdx).toBeLessThan(winPercentIdx);
  });
});
