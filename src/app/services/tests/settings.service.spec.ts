import { TestBed } from '@angular/core/testing';
import { SettingsService } from '../settings.service';

describe('SettingsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
    localStorage.clear();
  });

  it('should default and persist settings when no key exists', () => {
    const setItemSpy = spyOn(localStorage, 'setItem').and.callThrough();
    const service = TestBed.inject(SettingsService);

    expect(service.selectedTeamId).toBe('1');
    expect(service.startFromSeason).toBeUndefined();
    expect(service.topControlsExpanded).toBe(true);
    expect(service.season).toBeUndefined();
    expect(service.reportType).toBe('regular');

    expect(setItemSpy).toHaveBeenCalled();
    const persisted = JSON.parse(localStorage.getItem('fantrax.settings') ?? '{}');
    expect(persisted).toEqual({
      selectedTeamId: '1',
      startFromSeason: null,
      topControlsExpanded: true,
      season: null,
      reportType: 'regular',
    });
  });

  it('should load all fields from stored settings', () => {
    localStorage.setItem(
      'fantrax.settings',
      JSON.stringify({
        selectedTeamId: '7',
        startFromSeason: 2023,
        topControlsExpanded: false,
        season: 2024,
        reportType: 'playoffs',
      })
    );

    const setItemSpy = spyOn(localStorage, 'setItem').and.callThrough();
    const service = TestBed.inject(SettingsService);

    expect(service.selectedTeamId).toBe('7');
    expect(service.startFromSeason).toBe(2023);
    expect(service.topControlsExpanded).toBe(false);
    expect(service.season).toBe(2024);
    expect(service.reportType).toBe('playoffs');
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('should default new fields when loading old settings without them', () => {
    localStorage.setItem(
      'fantrax.settings',
      JSON.stringify({
        selectedTeamId: '3',
        startFromSeason: null,
        topControlsExpanded: true,
      })
    );

    const service = TestBed.inject(SettingsService);

    expect(service.season).toBeUndefined();
    expect(service.reportType).toBe('regular');
  });

  it('should validate fields when unified key is present but partially invalid', () => {
    localStorage.setItem(
      'fantrax.settings',
      JSON.stringify({
        selectedTeamId: '   ',
        startFromSeason: 'not-a-number',
        season: 'bad',
        reportType: 'unknown',
      })
    );

    const service = TestBed.inject(SettingsService);

    expect(service.selectedTeamId).toBe('1');
    expect(service.startFromSeason).toBeUndefined();
    expect(service.season).toBeUndefined();
    expect(service.reportType).toBe('regular');
  });

  it('should use defaults when stored JSON is broken', () => {
    localStorage.setItem('fantrax.settings', '{broken-json');
    const service = TestBed.inject(SettingsService);

    expect(service.selectedTeamId).toBe('1');
    expect(service.season).toBeUndefined();
    expect(service.reportType).toBe('regular');
  });

  it('should remove legacy keys on load', () => {
    localStorage.setItem('fantrax.selectedTeamId', '5');
    localStorage.setItem('fantrax.topControls.expanded', 'false');

    TestBed.inject(SettingsService);

    expect(localStorage.getItem('fantrax.selectedTeamId')).toBeNull();
    expect(localStorage.getItem('fantrax.topControls.expanded')).toBeNull();
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

  it('should persist setSeason and avoid persisting unchanged values', () => {
    const service = TestBed.inject(SettingsService);
    const setItemSpy = spyOn(localStorage, 'setItem').and.callThrough();
    setItemSpy.calls.reset();

    service.setSeason(null);
    expect(setItemSpy).not.toHaveBeenCalled();

    service.setSeason(2024);
    expect(service.season).toBe(2024);
    expect(setItemSpy).toHaveBeenCalled();

    setItemSpy.calls.reset();
    service.setSeason(2024);
    expect(setItemSpy).not.toHaveBeenCalled();

    service.setSeason(null);
    expect(service.season).toBeUndefined();
  });

  it('should persist setReportType and avoid persisting unchanged values', () => {
    const service = TestBed.inject(SettingsService);
    const setItemSpy = spyOn(localStorage, 'setItem').and.callThrough();
    setItemSpy.calls.reset();

    service.setReportType('regular');
    expect(setItemSpy).not.toHaveBeenCalled();

    service.setReportType('playoffs');
    expect(service.reportType).toBe('playoffs');
    expect(setItemSpy).toHaveBeenCalled();

    setItemSpy.calls.reset();
    service.setReportType('playoffs');
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('should still update in-memory state if persist throws', () => {
    const service = TestBed.inject(SettingsService);
    spyOn(localStorage, 'setItem').and.throwError('quota exceeded');

    service.setSelectedTeamId('12');
    service.setTopControlsExpanded(false);
    service.setStartFromSeason(2020);
    service.setSeason(2024);
    service.setReportType('playoffs');

    expect(service.selectedTeamId).toBe('12');
    expect(service.topControlsExpanded).toBe(false);
    expect(service.startFromSeason).toBe(2020);
    expect(service.season).toBe(2024);
    expect(service.reportType).toBe('playoffs');
  });

  it('should ignore no-op updates', () => {
    const service = TestBed.inject(SettingsService);
    const setItemSpy = spyOn(localStorage, 'setItem').and.callThrough();
    setItemSpy.calls.reset();

    service.setSelectedTeamId('');
    service.setSelectedTeamId(service.selectedTeamId);
    service.setTopControlsExpanded(service.topControlsExpanded);
    service.setSeason(null);
    service.setReportType('regular');

    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('should emit derived observable values', () => {
    const service = TestBed.inject(SettingsService);

    const seasons: Array<number | undefined> = [];
    const reportTypes: string[] = [];

    const seasonSub = service.season$.subscribe((v) => seasons.push(v));
    const reportTypeSub = service.reportType$.subscribe((v) => reportTypes.push(v));

    expect(seasons[seasons.length - 1]).toBeUndefined();
    expect(reportTypes[reportTypes.length - 1]).toBe('regular');

    service.setSeason(2024);
    service.setReportType('playoffs');

    expect(seasons[seasons.length - 1]).toBe(2024);
    expect(reportTypes[reportTypes.length - 1]).toBe('playoffs');

    // DistinctUntilChanged should prevent no-op emissions.
    const seasonCount = seasons.length;
    const reportTypeCount = reportTypes.length;

    service.setSeason(2024);
    service.setReportType('playoffs');

    expect(seasons.length).toBe(seasonCount);
    expect(reportTypes.length).toBe(reportTypeCount);

    seasonSub.unsubscribe();
    reportTypeSub.unsubscribe();
  });
});
