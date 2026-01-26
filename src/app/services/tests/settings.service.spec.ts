import { TestBed } from '@angular/core/testing';
import { SettingsService } from '../settings.service';

describe('SettingsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
    localStorage.clear();
  });

  it('should default and persist migrated settings when no keys exist', () => {
    const setItemSpy = spyOn(localStorage, 'setItem').and.callThrough();
    const service = TestBed.inject(SettingsService);

    expect(service.selectedTeamId).toBe('1');
    expect(service.startFromSeason).toBeUndefined();
    expect(service.topControlsExpanded).toBe(true);

    expect(setItemSpy).toHaveBeenCalled();
    const persisted = JSON.parse(localStorage.getItem('fantrax.settings') ?? '{}');
    expect(persisted).toEqual({
      version: 1,
      selectedTeamId: '1',
      startFromSeason: null,
      topControlsExpanded: true,
    });
  });

  it('should load from the unified key when valid and avoid migration write', () => {
    localStorage.setItem(
      'fantrax.settings',
      JSON.stringify({
        version: 1,
        selectedTeamId: '7',
        startFromSeason: 2023,
        topControlsExpanded: false,
      })
    );

    const setItemSpy = spyOn(localStorage, 'setItem').and.callThrough();
    const service = TestBed.inject(SettingsService);

    expect(service.selectedTeamId).toBe('7');
    expect(service.startFromSeason).toBe(2023);
    expect(service.topControlsExpanded).toBe(false);
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('should validate fields when unified key is present but partially invalid', () => {
    localStorage.setItem(
      'fantrax.settings',
      JSON.stringify({
        version: 1,
        selectedTeamId: '   ',
        startFromSeason: 'not-a-number',
      })
    );

    const service = TestBed.inject(SettingsService);

    expect(service.selectedTeamId).toBe('1');
    expect(service.startFromSeason).toBeUndefined();
    expect(service.topControlsExpanded).toBe(true);
  });

  it('should fall back to legacy keys when unified key has wrong version', () => {
    localStorage.setItem(
      'fantrax.settings',
      JSON.stringify({ version: 2, selectedTeamId: '99' })
    );
    localStorage.setItem('fantrax.selectedTeamId', '8');
    localStorage.setItem('fantrax.topControls.expanded', 'false');

    const service = TestBed.inject(SettingsService);

    expect(service.selectedTeamId).toBe('8');
    expect(service.topControlsExpanded).toBe(false);
    expect(service.startFromSeason).toBeUndefined();

    const persisted = JSON.parse(localStorage.getItem('fantrax.settings') ?? '{}');
    expect(persisted.selectedTeamId).toBe('8');
    expect(persisted.topControlsExpanded).toBe(false);
    expect(persisted.startFromSeason).toBeNull();
  });

  it('should fall back to legacy keys when unified key is invalid JSON', () => {
    localStorage.setItem('fantrax.settings', '{broken-json');
    localStorage.setItem('fantrax.selectedTeamId', '10');
    localStorage.setItem('fantrax.topControls.expanded', 'true');

    const service = TestBed.inject(SettingsService);

    expect(service.selectedTeamId).toBe('10');
    expect(service.topControlsExpanded).toBe(true);
  });

  it('should normalize startFromSeason and avoid persisting unchanged values', () => {
    const service = TestBed.inject(SettingsService);
    const setItemSpy = spyOn(localStorage, 'setItem').and.callThrough();
    setItemSpy.calls.reset();

    service.setStartFromSeason(undefined);
    expect(setItemSpy).not.toHaveBeenCalled();

    service.setStartFromSeason(2022);
    expect(service.startFromSeason).toBe(2022);
    expect(setItemSpy).toHaveBeenCalled();

    setItemSpy.calls.reset();
    service.setStartFromSeason(2022);
    expect(setItemSpy).not.toHaveBeenCalled();

    service.setStartFromSeason(undefined);
    expect(service.startFromSeason).toBeUndefined();
  });

  it('should still update in-memory state if persist throws', () => {
    const service = TestBed.inject(SettingsService);
    spyOn(localStorage, 'setItem').and.throwError('quota exceeded');

    service.setSelectedTeamId('12');
    service.setTopControlsExpanded(false);
    service.setStartFromSeason(2020);

    expect(service.selectedTeamId).toBe('12');
    expect(service.topControlsExpanded).toBe(false);
    expect(service.startFromSeason).toBe(2020);
  });

  it('should ignore no-op updates (empty teamId and unchanged expanded)', () => {
    const service = TestBed.inject(SettingsService);
    const setItemSpy = spyOn(localStorage, 'setItem').and.callThrough();
    setItemSpy.calls.reset();

    service.setSelectedTeamId('');
    service.setSelectedTeamId(service.selectedTeamId);
    service.setTopControlsExpanded(service.topControlsExpanded);

    expect(setItemSpy).not.toHaveBeenCalled();
  });
});
