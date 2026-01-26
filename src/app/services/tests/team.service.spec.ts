import { TestBed } from '@angular/core/testing';
import { TeamService } from '../team.service';

describe('TeamService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
    localStorage.clear();
  });

  it('should default to stored team id when present', () => {
    localStorage.setItem(
      'fantrax.settings',
      JSON.stringify({
        version: 1,
        selectedTeamId: '7',
        startFromSeason: null,
        topControlsExpanded: true,
      })
    );
    const service = TestBed.inject(TeamService);

    expect(service.selectedTeamId).toBe('7');
  });

  it('should migrate legacy selectedTeamId when fantrax.settings is missing', () => {
    localStorage.setItem('fantrax.selectedTeamId', '7');
    const service = TestBed.inject(TeamService);

    expect(service.selectedTeamId).toBe('7');

    const persisted = JSON.parse(localStorage.getItem('fantrax.settings') ?? '{}');
    expect(persisted.selectedTeamId).toBe('7');
  });

  it('should fall back to default team id when stored value is blank', () => {
    localStorage.setItem(
      'fantrax.settings',
      JSON.stringify({
        version: 1,
        selectedTeamId: '   ',
        startFromSeason: null,
        topControlsExpanded: true,
      })
    );
    const service = TestBed.inject(TeamService);

    expect(service.selectedTeamId).toBe('1');
  });

  it('should fall back to default team id when localStorage throws', () => {
    spyOn(localStorage, 'getItem').and.throwError('storage blocked');
    const service = TestBed.inject(TeamService);

    expect(service.selectedTeamId).toBe('1');
  });

  it('setTeamId should ignore falsy values', () => {
    const service = TestBed.inject(TeamService);

    service.setTeamId('3');
    const setItemSpy = spyOn(localStorage, 'setItem');

    service.setTeamId('');

    expect(service.selectedTeamId).toBe('3');
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('setTeamId should ignore unchanged values', () => {
    localStorage.setItem(
      'fantrax.settings',
      JSON.stringify({
        version: 1,
        selectedTeamId: '3',
        startFromSeason: null,
        topControlsExpanded: true,
      })
    );
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
    setItemSpy.calls.reset();

    service.setTeamId('9');

    expect(service.selectedTeamId).toBe('9');
    expect(values).toContain('9');
    expect(setItemSpy).toHaveBeenCalled();
    const persisted = JSON.parse(localStorage.getItem('fantrax.settings') ?? '{}');
    expect(persisted.selectedTeamId).toBe('9');

    sub.unsubscribe();
  });

  it('setTeamId should still update even if persist throws', () => {
    const service = TestBed.inject(TeamService);

    spyOn(localStorage, 'setItem').and.throwError('quota exceeded');

    service.setTeamId('11');

    expect(service.selectedTeamId).toBe('11');
  });

  it('setTeamId should clear startFromSeason to avoid cross-team stale requests', () => {
    localStorage.setItem(
      'fantrax.settings',
      JSON.stringify({
        version: 1,
        selectedTeamId: '1',
        startFromSeason: 2012,
        topControlsExpanded: true,
      })
    );

    const service = TestBed.inject(TeamService);
    service.setTeamId('2');

    const persisted = JSON.parse(localStorage.getItem('fantrax.settings') ?? '{}');
    expect(persisted.selectedTeamId).toBe('2');
    expect(persisted.startFromSeason).toBeNull();
  });
});
