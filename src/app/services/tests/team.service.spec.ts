import { TestBed } from '@angular/core/testing';
import { TeamService } from '../team.service';

describe('TeamService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
    localStorage.clear();
  });

  it('should default to stored team id when present', () => {
    localStorage.setItem('fantrax.selectedTeamId', '7');
    const service = TestBed.inject(TeamService);

    expect(service.selectedTeamId).toBe('7');
  });

  it('should fall back to default team id when stored value is blank', () => {
    localStorage.setItem('fantrax.selectedTeamId', '   ');
    const service = TestBed.inject(TeamService);

    expect(service.selectedTeamId).toBe('1');
  });

  it('should fall back to default team id when localStorage throws', () => {
    spyOn(localStorage, 'getItem').and.throwError('storage blocked');
    const service = TestBed.inject(TeamService);

    expect(service.selectedTeamId).toBe('1');
  });

  it('setTeamId should ignore falsy values', () => {
    localStorage.setItem('fantrax.selectedTeamId', '3');
    const service = TestBed.inject(TeamService);

    const setItemSpy = spyOn(localStorage, 'setItem');

    service.setTeamId('');

    expect(service.selectedTeamId).toBe('3');
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('setTeamId should ignore unchanged values', () => {
    localStorage.setItem('fantrax.selectedTeamId', '3');
    const service = TestBed.inject(TeamService);

    const setItemSpy = spyOn(localStorage, 'setItem');

    service.setTeamId('3');

    expect(service.selectedTeamId).toBe('3');
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('setTeamId should update observable and persist the new value', () => {
    const service = TestBed.inject(TeamService);

    const values: string[] = [];
    const sub = service.selectedTeamId$.subscribe((v) => values.push(v));

    const setItemSpy = spyOn(localStorage, 'setItem').and.callThrough();

    service.setTeamId('9');

    expect(service.selectedTeamId).toBe('9');
    expect(values).toContain('9');
    expect(setItemSpy).toHaveBeenCalledWith('fantrax.selectedTeamId', '9');

    sub.unsubscribe();
  });

  it('setTeamId should still update even if persist throws', () => {
    const service = TestBed.inject(TeamService);

    spyOn(localStorage, 'setItem').and.throwError('quota exceeded');

    service.setTeamId('11');

    expect(service.selectedTeamId).toBe('11');
  });
});
