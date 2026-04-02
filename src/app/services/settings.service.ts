import { computed, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ReportType } from './api.service';

export type AppSettings = {
  selectedTeamId: string;
  startFromSeason: number | null;
  season: number | null;
  reportType: ReportType;
  disableDraftSelectedTeamHighlight: boolean;
};

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly storageKey = 'fantrax.settings';

  private readonly defaultTeamId = '1';

  private readonly settingsState = signal<AppSettings>(this.loadInitialSettings());
  private readonly settingsSignal = this.settingsState.asReadonly();

  readonly selectedTeamIdSignal = computed(() => this.settingsSignal().selectedTeamId);
  readonly selectedTeamId$ = toObservable(this.selectedTeamIdSignal);

  readonly startFromSeasonSignal = computed(() =>
    this.normalizeOptionalSeason(this.settingsSignal().startFromSeason)
  );
  readonly startFromSeason$ = toObservable(this.startFromSeasonSignal);

  get selectedTeamId(): string {
    return this.settingsSignal().selectedTeamId;
  }

  get startFromSeason(): number | undefined {
    return this.startFromSeasonSignal();
  }

  get season(): number | undefined {
    return this.normalizeOptionalSeason(this.settingsSignal().season);
  }

  get reportType(): ReportType {
    return this.settingsSignal().reportType;
  }

  readonly disableDraftSelectedTeamHighlightSignal = computed(
    () => this.settingsSignal().disableDraftSelectedTeamHighlight,
  );

  get disableDraftSelectedTeamHighlight(): boolean {
    return this.disableDraftSelectedTeamHighlightSignal();
  }

  setSelectedTeamId(teamId: string): void {
    if (!teamId || teamId === this.selectedTeamId) return;
    this.updateSettings({ selectedTeamId: teamId });
  }

  setStartFromSeason(season: number | undefined): void {
    const normalized = season === undefined ? null : season;
    if (normalized === this.settingsSignal().startFromSeason) return;
    this.updateSettings({ startFromSeason: normalized });
  }

  setSeason(season: number | null): void {
    if (season === this.settingsSignal().season) return;
    this.updateSettings({ season });
  }

  setReportType(reportType: ReportType): void {
    if (reportType === this.settingsSignal().reportType) return;
    this.updateSettings({ reportType });
  }

  setDisableDraftSelectedTeamHighlight(disabled: boolean): void {
    if (disabled === this.settingsSignal().disableDraftSelectedTeamHighlight) return;
    this.updateSettings({ disableDraftSelectedTeamHighlight: disabled });
  }

  private updateSettings(patch: Partial<AppSettings>): void {
    const next: AppSettings = { ...this.settingsSignal(), ...patch };
    this.settingsState.set(next);
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

        const season =
          typeof parsed.season === 'number' && Number.isFinite(parsed.season)
            ? parsed.season
            : null;

        const reportType = this.parseReportType(parsed.reportType);
        const disableDraftSelectedTeamHighlight =
          typeof parsed.disableDraftSelectedTeamHighlight === 'boolean'
            ? parsed.disableDraftSelectedTeamHighlight
            : false;

        return {
          selectedTeamId,
          startFromSeason,
          season,
          reportType,
          disableDraftSelectedTeamHighlight,
        };
      }
    } catch {
      // ignore parse errors
    }

    const defaults: AppSettings = {
      selectedTeamId: this.defaultTeamId,
      startFromSeason: null,
      season: null,
      reportType: 'regular',
      disableDraftSelectedTeamHighlight: false,
    };
    this.persist(defaults);
    return defaults;
  }

  private parseReportType(value: unknown): ReportType {
    if (value === 'regular' || value === 'playoffs' || value === 'both') return value;
    return 'regular';
  }

  private normalizeOptionalSeason(season: number | null): number | undefined {
    return season === null ? undefined : season;
  }

  private persist(settings: AppSettings): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(settings));
    } catch {
      // ignore storage errors (e.g. privacy mode)
    }
  }
}
