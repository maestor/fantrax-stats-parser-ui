import { TestBed } from '@angular/core/testing';
import { ComparisonService } from '../comparison.service';
import { Player } from '../api.service';
import { first } from 'rxjs';

const mockPlayerA: Player = {
  name: 'Mikko Rantanen',
  position: 'F',
  score: 94.31,
  scoreAdjustedByGames: 93.1,
  games: 427,
  goals: 193,
  assists: 254,
  points: 447,
  plusMinus: 0,
  penalties: 256,
  shots: 1182,
  ppp: 165,
  shp: 0,
  hits: 276,
  blocks: 41,
};

const mockPlayerB: Player = {
  name: 'Aaron Ekblad',
  position: 'D',
  score: 100,
  scoreAdjustedByGames: 67.22,
  games: 540,
  goals: 100,
  assists: 188,
  points: 288,
  plusMinus: 40,
  penalties: 355,
  shots: 1413,
  ppp: 94,
  shp: 6,
  hits: 582,
  blocks: 574,
};

const mockPlayerC: Player = {
  name: 'Jason Zucker',
  position: 'F',
  score: 71.58,
  scoreAdjustedByGames: 58.64,
  games: 448,
  goals: 132,
  assists: 110,
  points: 242,
  plusMinus: 26,
  penalties: 169,
  shots: 1038,
  ppp: 41,
  shp: 5,
  hits: 496,
  blocks: 0,
};

describe('ComparisonService', () => {
  let service: ComparisonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ComparisonService);
  });

  describe('initial state', () => {
    it('should start with empty selection', (done) => {
      service.selection$.pipe(first()).subscribe((selection) => {
        expect(selection).toEqual([]);
        done();
      });
    });

    it('should report canSelectMore as true', (done) => {
      service.canSelectMore$.pipe(first()).subscribe((canSelect) => {
        expect(canSelect).toBeTrue();
        done();
      });
    });
  });

  describe('toggle', () => {
    it('should add a player to selection', (done) => {
      service.toggle(mockPlayerA);
      service.selection$.pipe(first()).subscribe((selection) => {
        expect(selection.length).toBe(1);
        expect(selection[0].name).toBe('Mikko Rantanen');
        done();
      });
    });

    it('should remove a player that is already selected', (done) => {
      service.toggle(mockPlayerA);
      service.toggle(mockPlayerA);
      service.selection$.pipe(first()).subscribe((selection) => {
        expect(selection).toEqual([]);
        done();
      });
    });

    it('should allow selecting two players', (done) => {
      service.toggle(mockPlayerA);
      service.toggle(mockPlayerB);
      service.selection$.pipe(first()).subscribe((selection) => {
        expect(selection.length).toBe(2);
        done();
      });
    });

    it('should not allow selecting more than two players', (done) => {
      service.toggle(mockPlayerA);
      service.toggle(mockPlayerB);
      service.toggle(mockPlayerC);
      service.selection$.pipe(first()).subscribe((selection) => {
        expect(selection.length).toBe(2);
        done();
      });
    });

    it('should report canSelectMore as false when two are selected', (done) => {
      service.toggle(mockPlayerA);
      service.toggle(mockPlayerB);
      service.canSelectMore$.pipe(first()).subscribe((canSelect) => {
        expect(canSelect).toBeFalse();
        done();
      });
    });
  });

  describe('isSelected', () => {
    it('should return true for a selected player', () => {
      service.toggle(mockPlayerA);
      expect(service.isSelected(mockPlayerA)).toBeTrue();
    });

    it('should return false for an unselected player', () => {
      expect(service.isSelected(mockPlayerA)).toBeFalse();
    });
  });

  describe('clear', () => {
    it('should remove all selections', (done) => {
      service.toggle(mockPlayerA);
      service.toggle(mockPlayerB);
      service.clear();
      service.selection$.pipe(first()).subscribe((selection) => {
        expect(selection).toEqual([]);
        done();
      });
    });
  });

  describe('orderedSelection', () => {
    it('should return player with higher FR as playerA', (done) => {
      service.toggle(mockPlayerA); // FR 94.31
      service.toggle(mockPlayerB); // FR 100
      service.orderedSelection$.pipe(first()).subscribe((ordered) => {
        expect(ordered).not.toBeNull();
        expect(ordered!.playerA.name).toBe('Aaron Ekblad');
        expect(ordered!.playerB.name).toBe('Mikko Rantanen');
        done();
      });
    });

    it('should return null when fewer than 2 selected', (done) => {
      service.toggle(mockPlayerA);
      service.orderedSelection$.pipe(first()).subscribe((ordered) => {
        expect(ordered).toBeNull();
        done();
      });
    });
  });
});
