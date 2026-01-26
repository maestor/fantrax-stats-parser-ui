import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, map } from 'rxjs';

export type AppSettingsV1 = {
  version: 1;
  selectedTeamId: string;
  startFromSeason: number | null;
  topControlsExpanded: boolean;
};

export type AppSettings = AppSettingsV1;

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly storageKey = 'fantrax.settings';

  private readonly legacySelectedTeamIdKey = 'fantrax.selectedTeamId';
  private readonly legacyTopControlsExpandedKey = 'fantrax.topControls.expanded';

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

  private updateSettings(patch: Partial<Omit<AppSettingsV1, 'version'>>): void {
    const next: AppSettings = {
      ...this.settingsSubject.value,
      ...patch,
      version: 1,
    };

    this.settingsSubject.next(next);
    this.persist(next);
  }

  private loadInitialSettings(): AppSettings {
    const fromNew = this.tryLoadFromNewKey();
    if (fromNew) return fromNew;

    const selectedTeamId = this.loadLegacySelectedTeamId();
    const topControlsExpanded = this.loadLegacyTopControlsExpanded();

    // Persist migrated settings so future loads use the unified key.
    const migrated: AppSettings = {
      version: 1,
      selectedTeamId,
      startFromSeason: null,
      topControlsExpanded,
    };

    this.persist(migrated);
    return migrated;
  }

  private tryLoadFromNewKey(): AppSettings | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return null;

      const parsed = JSON.parse(stored) as Partial<AppSettingsV1> | null;
      if (!parsed || parsed.version !== 1) return null;

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

      return {
        version: 1,
        selectedTeamId,
        startFromSeason,
        topControlsExpanded,
      };
    } catch {
      return null;
    }
  }

  private loadLegacySelectedTeamId(): string {
    try {
      const stored = localStorage.getItem(this.legacySelectedTeamIdKey);
      return stored && stored.trim().length > 0 ? stored : this.defaultTeamId;
    } catch {
      return this.defaultTeamId;
    }
  }

  private loadLegacyTopControlsExpanded(): boolean {
    try {
      const stored = localStorage.getItem(this.legacyTopControlsExpandedKey);
      if (stored === null) return this.defaultTopControlsExpanded;
      return stored === 'true';
    } catch {
      return this.defaultTopControlsExpanded;
    }
  }

  private persist(settings: AppSettings): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(settings));
    } catch {
      // ignore storage errors (e.g. privacy mode)
    }
  }
}
