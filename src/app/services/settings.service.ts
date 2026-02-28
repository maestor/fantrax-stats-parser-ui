import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, map } from 'rxjs';
import { ReportType } from './api.service';

export type AppSettings = {
  selectedTeamId: string;
  startFromSeason: number | null;
  topControlsExpanded: boolean;
  season: number | null;
  reportType: ReportType;
};

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly storageKey = 'fantrax.settings';

  private readonly defaultTeamId = '1';
  private readonly defaultTopControlsExpanded = true;

  private readonly settingsSubject = new BehaviorSubject<AppSettings>(
    this.loadInitialSettings()
  );

  readonly settings$ = this.settingsSubject.asObservable();

  readonly selectedTeamId$ = this.settings$.pipe(
    map((s) => s.selectedTeamId),
    distinctUntilChanged()
  );

  readonly startFromSeason$ = this.settings$.pipe(
    map((s) => (s.startFromSeason === null ? undefined : s.startFromSeason)),
    distinctUntilChanged()
  );

  readonly topControlsExpanded$ = this.settings$.pipe(
    map((s) => s.topControlsExpanded),
    distinctUntilChanged()
  );

  readonly season$ = this.settings$.pipe(
    map((s) => (s.season === null ? undefined : s.season)),
    distinctUntilChanged()
  );

  readonly reportType$ = this.settings$.pipe(
    map((s) => s.reportType),
    distinctUntilChanged()
  );

  get selectedTeamId(): string {
    return this.settingsSubject.value.selectedTeamId;
  }

  get startFromSeason(): number | undefined {
    return this.settingsSubject.value.startFromSeason === null
      ? undefined
      : this.settingsSubject.value.startFromSeason;
  }

  get topControlsExpanded(): boolean {
    return this.settingsSubject.value.topControlsExpanded;
  }

  get season(): number | undefined {
    return this.settingsSubject.value.season === null
      ? undefined
      : this.settingsSubject.value.season;
  }

  get reportType(): ReportType {
    return this.settingsSubject.value.reportType;
  }

  setSelectedTeamId(teamId: string): void {
    if (!teamId || teamId === this.selectedTeamId) return;
    this.updateSettings({ selectedTeamId: teamId });
  }

  setStartFromSeason(season: number | undefined): void {
    const normalized = season === undefined ? null : season;
    if (normalized === this.settingsSubject.value.startFromSeason) return;
    this.updateSettings({ startFromSeason: normalized });
  }

  setTopControlsExpanded(expanded: boolean): void {
    if (expanded === this.topControlsExpanded) return;
    this.updateSettings({ topControlsExpanded: expanded });
  }

  setSeason(season: number | null): void {
    if (season === this.settingsSubject.value.season) return;
    this.updateSettings({ season });
  }

  setReportType(reportType: ReportType): void {
    if (reportType === this.settingsSubject.value.reportType) return;
    this.updateSettings({ reportType });
  }

  private updateSettings(patch: Partial<AppSettings>): void {
    const next: AppSettings = { ...this.settingsSubject.value, ...patch };
    this.settingsSubject.next(next);
    this.persist(next);
  }

  private loadInitialSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<AppSettings & { version?: unknown }>;

        const selectedTeamId =
          typeof parsed.selectedTeamId === 'string' && parsed.selectedTeamId.trim().length > 0
            ? parsed.selectedTeamId
            : this.defaultTeamId;

        const startFromSeason =
          typeof parsed.startFromSeason === 'number' && Number.isFinite(parsed.startFromSeason)
            ? parsed.startFromSeason
            : null;

        const topControlsExpanded =
          typeof parsed.topControlsExpanded === 'boolean'
            ? parsed.topControlsExpanded
            : this.defaultTopControlsExpanded;

        const season =
          typeof parsed.season === 'number' && Number.isFinite(parsed.season)
            ? parsed.season
            : null;

        const reportType = this.parseReportType(parsed.reportType);

        return { selectedTeamId, startFromSeason, topControlsExpanded, season, reportType };
      }
    } catch {
      // ignore parse errors
    }

    const defaults: AppSettings = {
      selectedTeamId: this.defaultTeamId,
      startFromSeason: null,
      topControlsExpanded: this.defaultTopControlsExpanded,
      season: null,
      reportType: 'regular',
    };
    this.persist(defaults);
    return defaults;
  }

  private parseReportType(value: unknown): ReportType {
    if (value === 'regular' || value === 'playoffs' || value === 'both') return value;
    return 'regular';
  }

  private persist(settings: AppSettings): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(settings));
    } catch {
      // ignore storage errors (e.g. privacy mode)
    }
  }
}
