import { TestBed } from '@angular/core/testing';
import { FilterService } from '../filter.service';
import { take } from 'rxjs';

describe('FilterService', () => {
  let service: FilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FilterService);
  });

  it('should start with default values', (done) => {
    service.playerFilters$.pipe(take(1)).subscribe((filters) => {
      expect(filters.reportType).toBe('regular');
      expect(filters.season).toBeUndefined();
      expect(filters.statsPerGame).toBeFalse();
      done();
    });
  });

  it('should update player filters independently of goalie filters', (done) => {
    service.updatePlayerFilters({ reportType: 'playoffs', season: 2020 });

    service.playerFilters$.pipe(take(1)).subscribe((filters) => {
      expect(filters.reportType).toBe('playoffs');
      expect(filters.season).toBe(2020);
    });

    service.goalieFilters$.pipe(take(1)).subscribe((filters) => {
      // goalie filters should remain defaults
      expect(filters.reportType).toBe('regular');
      expect(filters.season).toBeUndefined();
    });

    done();
  });

  it('should update goalie filters independently', (done) => {
    service.updateGoalieFilters({ statsPerGame: true });

    service.goalieFilters$.pipe(take(1)).subscribe((filters) => {
      expect(filters.statsPerGame).toBeTrue();
    });

    service.playerFilters$.pipe(take(1)).subscribe((filters) => {
      expect(filters.statsPerGame).toBeFalse();
    });

    done();
  });
});
