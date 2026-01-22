import { TestBed } from '@angular/core/testing';
import { FilterService, FilterState } from '../filter.service';
import { take } from 'rxjs';

describe('FilterService', () => {
  let service: FilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FilterService],
    });
    service = TestBed.inject(FilterService);
  });

  afterEach(() => {
    service.resetPlayerFilters();
    service.resetGoalieFilters();
  });

  describe('initial state', () => {
    it('should start with default player filter values', (done) => {
      service.playerFilters$.pipe(take(1)).subscribe((filters) => {
        expect(filters.reportType).toBe('regular');
        expect(filters.season).toBeUndefined();
        expect(filters.statsPerGame).toBe(false);
        expect(filters.minGames).toBe(0);
        done();
      });
    });

    it('should start with default goalie filter values', (done) => {
      service.goalieFilters$.pipe(take(1)).subscribe((filters) => {
        expect(filters.reportType).toBe('regular');
        expect(filters.season).toBeUndefined();
        expect(filters.statsPerGame).toBe(false);
        expect(filters.minGames).toBe(0);
        done();
      });
    });
  });

  describe('updatePlayerFilters', () => {
    it('should update reportType for players', (done) => {
      service.updatePlayerFilters({ reportType: 'playoffs' });

      service.playerFilters$.pipe(take(1)).subscribe((filters) => {
        expect(filters.reportType).toBe('playoffs');
        done();
      });
    });

    it('should update season for players', (done) => {
      service.updatePlayerFilters({ season: 2024 });

      service.playerFilters$.pipe(take(1)).subscribe((filters) => {
        expect(filters.season).toBe(2024);
        done();
      });
    });

    it('should update statsPerGame for players', (done) => {
      service.updatePlayerFilters({ statsPerGame: true });

      service.playerFilters$.pipe(take(1)).subscribe((filters) => {
        expect(filters.statsPerGame).toBe(true);
        done();
      });
    });

    it('should update minGames for players', (done) => {
      service.updatePlayerFilters({ minGames: 10 });

      service.playerFilters$.pipe(take(1)).subscribe((filters) => {
        expect(filters.minGames).toBe(10);
        done();
      });
    });

    it('should update multiple fields at once for players', (done) => {
      service.updatePlayerFilters({
        reportType: 'playoffs',
        season: 2023,
        statsPerGame: true,
        minGames: 20,
      });

      service.playerFilters$.pipe(take(1)).subscribe((filters) => {
        expect(filters.reportType).toBe('playoffs');
        expect(filters.season).toBe(2023);
        expect(filters.statsPerGame).toBe(true);
        expect(filters.minGames).toBe(20);
        done();
      });
    });

    it('should preserve unchanged fields when updating players', (done) => {
      service.updatePlayerFilters({ reportType: 'playoffs', season: 2024 });
      service.updatePlayerFilters({ statsPerGame: true });

      service.playerFilters$.pipe(take(1)).subscribe((filters) => {
        expect(filters.reportType).toBe('playoffs');
        expect(filters.season).toBe(2024);
        expect(filters.statsPerGame).toBe(true);
        expect(filters.minGames).toBe(0);
        done();
      });
    });

    it('should update player filters independently of goalie filters', (done) => {
      service.updatePlayerFilters({ reportType: 'playoffs', season: 2020 });

      service.playerFilters$.pipe(take(1)).subscribe((playerFilters) => {
        expect(playerFilters.reportType).toBe('playoffs');
        expect(playerFilters.season).toBe(2020);

        service.goalieFilters$.pipe(take(1)).subscribe((goalieFilters) => {
          expect(goalieFilters.reportType).toBe('regular');
          expect(goalieFilters.season).toBeUndefined();
          done();
        });
      });
    });

    it('should emit new values to subscribers', (done) => {
      const emissions: FilterState[] = [];

      const subscription = service.playerFilters$.subscribe((filters) => {
        emissions.push(filters);
      });

      service.updatePlayerFilters({ reportType: 'playoffs' });
      service.updatePlayerFilters({ season: 2024 });

      setTimeout(() => {
        expect(emissions.length).toBe(3);
        expect(emissions[0].reportType).toBe('regular');
        expect(emissions[1].reportType).toBe('playoffs');
        expect(emissions[2].season).toBe(2024);
        subscription.unsubscribe();
        done();
      }, 10);
    });
  });

  describe('updateGoalieFilters', () => {
    it('should update reportType for goalies', (done) => {
      service.updateGoalieFilters({ reportType: 'playoffs' });

      service.goalieFilters$.pipe(take(1)).subscribe((filters) => {
        expect(filters.reportType).toBe('playoffs');
        done();
      });
    });

    it('should update season for goalies', (done) => {
      service.updateGoalieFilters({ season: 2024 });

      service.goalieFilters$.pipe(take(1)).subscribe((filters) => {
        expect(filters.season).toBe(2024);
        done();
      });
    });

    it('should update statsPerGame for goalies', (done) => {
      service.updateGoalieFilters({ statsPerGame: true });

      service.goalieFilters$.pipe(take(1)).subscribe((filters) => {
        expect(filters.statsPerGame).toBe(true);
        done();
      });
    });

    it('should update minGames for goalies', (done) => {
      service.updateGoalieFilters({ minGames: 5 });

      service.goalieFilters$.pipe(take(1)).subscribe((filters) => {
        expect(filters.minGames).toBe(5);
        done();
      });
    });

    it('should update multiple fields at once for goalies', (done) => {
      service.updateGoalieFilters({
        reportType: 'playoffs',
        season: 2022,
        statsPerGame: true,
        minGames: 15,
      });

      service.goalieFilters$.pipe(take(1)).subscribe((filters) => {
        expect(filters.reportType).toBe('playoffs');
        expect(filters.season).toBe(2022);
        expect(filters.statsPerGame).toBe(true);
        expect(filters.minGames).toBe(15);
        done();
      });
    });

    it('should preserve unchanged fields when updating goalies', (done) => {
      service.updateGoalieFilters({ reportType: 'playoffs', season: 2024 });
      service.updateGoalieFilters({ statsPerGame: true });

      service.goalieFilters$.pipe(take(1)).subscribe((filters) => {
        expect(filters.reportType).toBe('playoffs');
        expect(filters.season).toBe(2024);
        expect(filters.statsPerGame).toBe(true);
        expect(filters.minGames).toBe(0);
        done();
      });
    });

    it('should update goalie filters independently of player filters', (done) => {
      service.updateGoalieFilters({ statsPerGame: true, minGames: 10 });

      service.goalieFilters$.pipe(take(1)).subscribe((goalieFilters) => {
        expect(goalieFilters.statsPerGame).toBe(true);
        expect(goalieFilters.minGames).toBe(10);

        service.playerFilters$.pipe(take(1)).subscribe((playerFilters) => {
          expect(playerFilters.statsPerGame).toBe(false);
          expect(playerFilters.minGames).toBe(0);
          done();
        });
      });
    });
  });

  describe('resetPlayerFilters', () => {
    it('should reset player filters to defaults', (done) => {
      service.updatePlayerFilters({
        reportType: 'playoffs',
        season: 2024,
        statsPerGame: true,
        minGames: 20,
      });

      service.resetPlayerFilters();

      service.playerFilters$.pipe(take(1)).subscribe((filters) => {
        expect(filters.reportType).toBe('regular');
        expect(filters.season).toBeUndefined();
        expect(filters.statsPerGame).toBe(false);
        expect(filters.minGames).toBe(0);
        done();
      });
    });

    it('should not affect goalie filters when resetting player filters', (done) => {
      service.updateGoalieFilters({
        reportType: 'playoffs',
        season: 2023,
      });
      service.updatePlayerFilters({
        reportType: 'playoffs',
        season: 2024,
      });

      service.resetPlayerFilters();

      service.goalieFilters$.pipe(take(1)).subscribe((filters) => {
        expect(filters.reportType).toBe('playoffs');
        expect(filters.season).toBe(2023);
        done();
      });
    });
  });

  describe('resetGoalieFilters', () => {
    it('should reset goalie filters to defaults', (done) => {
      service.updateGoalieFilters({
        reportType: 'playoffs',
        season: 2024,
        statsPerGame: true,
        minGames: 15,
      });

      service.resetGoalieFilters();

      service.goalieFilters$.pipe(take(1)).subscribe((filters) => {
        expect(filters.reportType).toBe('regular');
        expect(filters.season).toBeUndefined();
        expect(filters.statsPerGame).toBe(false);
        expect(filters.minGames).toBe(0);
        done();
      });
    });

    it('should not affect player filters when resetting goalie filters', (done) => {
      service.updatePlayerFilters({
        reportType: 'playoffs',
        season: 2024,
      });
      service.updateGoalieFilters({
        reportType: 'playoffs',
        season: 2023,
      });

      service.resetGoalieFilters();

      service.playerFilters$.pipe(take(1)).subscribe((filters) => {
        expect(filters.reportType).toBe('playoffs');
        expect(filters.season).toBe(2024);
        done();
      });
    });
  });

  describe('resetAll', () => {
    it('should reset both player and goalie filters to defaults', (done) => {
      service.updatePlayerFilters({
        reportType: 'playoffs',
        season: 2024,
        statsPerGame: true,
        minGames: 10,
      });

      service.updateGoalieFilters({
        reportType: 'playoffs',
        season: 2023,
        statsPerGame: true,
        minGames: 5,
      });

      service.resetAll();

      service.playerFilters$.pipe(take(1)).subscribe((playerFilters) => {
        expect(playerFilters.reportType).toBe('regular');
        expect(playerFilters.season).toBeUndefined();
        expect(playerFilters.statsPerGame).toBe(false);
        expect(playerFilters.minGames).toBe(0);

        service.goalieFilters$.pipe(take(1)).subscribe((goalieFilters) => {
          expect(goalieFilters.reportType).toBe('regular');
          expect(goalieFilters.season).toBeUndefined();
          expect(goalieFilters.statsPerGame).toBe(false);
          expect(goalieFilters.minGames).toBe(0);
          done();
        });
      });
    });
  });

  describe('multiple subscribers', () => {
    it('should emit to multiple player filter subscribers', (done) => {
      const emissions1: FilterState[] = [];
      const emissions2: FilterState[] = [];

      const sub1 = service.playerFilters$.subscribe((f) => emissions1.push(f));
      const sub2 = service.playerFilters$.subscribe((f) => emissions2.push(f));

      service.updatePlayerFilters({ reportType: 'playoffs' });

      setTimeout(() => {
        expect(emissions1.length).toBe(2);
        expect(emissions2.length).toBe(2);
        expect(emissions1[1].reportType).toBe('playoffs');
        expect(emissions2[1].reportType).toBe('playoffs');
        sub1.unsubscribe();
        sub2.unsubscribe();
        done();
      }, 10);
    });

    it('should emit to multiple goalie filter subscribers', (done) => {
      const emissions1: FilterState[] = [];
      const emissions2: FilterState[] = [];

      const sub1 = service.goalieFilters$.subscribe((f) => emissions1.push(f));
      const sub2 = service.goalieFilters$.subscribe((f) => emissions2.push(f));

      service.updateGoalieFilters({ season: 2024 });

      setTimeout(() => {
        expect(emissions1.length).toBe(2);
        expect(emissions2.length).toBe(2);
        expect(emissions1[1].season).toBe(2024);
        expect(emissions2[1].season).toBe(2024);
        sub1.unsubscribe();
        sub2.unsubscribe();
        done();
      }, 10);
    });
  });

  describe('edge cases', () => {
    it('should handle setting season to undefined', (done) => {
      service.updatePlayerFilters({ season: 2024 });
      service.updatePlayerFilters({ season: undefined });

      service.playerFilters$.pipe(take(1)).subscribe((filters) => {
        expect(filters.season).toBeUndefined();
        done();
      });
    });

    it('should handle minGames set to 0', (done) => {
      service.updatePlayerFilters({ minGames: 20 });
      service.updatePlayerFilters({ minGames: 0 });

      service.playerFilters$.pipe(take(1)).subscribe((filters) => {
        expect(filters.minGames).toBe(0);
        done();
      });
    });

    it('should handle statsPerGame toggle', (done) => {
      service.updateGoalieFilters({ statsPerGame: true });
      service.updateGoalieFilters({ statsPerGame: false });

      service.goalieFilters$.pipe(take(1)).subscribe((filters) => {
        expect(filters.statsPerGame).toBe(false);
        done();
      });
    });
  });
});
