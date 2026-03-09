import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  auditTime,
  catchError,
  distinctUntilChanged,
  map,
  of,
  scan,
  switchMap,
} from 'rxjs';

import { ApiService, Season } from '@services/api.service';
import { SettingsService } from '@services/settings.service';
import { TeamService } from '@services/team.service';
import { toApiTeamId } from '@shared/utils/api.utils';
import { toSeasonNumber } from '@shared/utils/season.utils';

@Injectable({
  providedIn: 'root',
})
export class StartFromSeasonSyncService {
  private readonly apiService = inject(ApiService);
  private readonly teamService = inject(TeamService);
  private readonly settingsService = inject(SettingsService);

  readonly seasons = signal<Season[]>([]);
  readonly selectedStartFrom = signal<number | undefined>(
    toSeasonNumber(this.settingsService.startFromSeason)
  );
  readonly selectedStartFromText = computed(() => {
    const selectedStartFrom = this.selectedStartFrom();
    if (selectedStartFrom === undefined) {
      return undefined;
    }

    return this.seasons().find((season) => season.season === selectedStartFrom)?.text;
  });

  constructor() {
    this.settingsService.startFromSeason$
      .pipe(
        map((season) => toSeasonNumber(season)),
        distinctUntilChanged(),
        takeUntilDestroyed()
      )
      .subscribe((season) => {
        this.selectedStartFrom.set(season);
      });

    this.teamService.selectedTeamId$
      .pipe(
        auditTime(0),
        map((teamId) => toApiTeamId(teamId)),
        distinctUntilChanged(),
        scan(
          (state, teamId) => ({
            prevTeamId: state.teamId,
            teamId,
            initialized: true,
            teamChanged: state.initialized && state.teamId !== teamId,
          }),
          {
            prevTeamId: undefined as string | undefined,
            teamId: undefined as string | undefined,
            initialized: false,
            teamChanged: false,
          }
        ),
        switchMap(({ teamId, teamChanged }) => {
          const seasons$ = teamId
            ? this.apiService.getSeasons('regular', teamId)
            : this.apiService.getSeasons('regular');

          return seasons$.pipe(
            map((data) => ({ data, teamChanged })),
            catchError(() => of({ data: [] as Season[], teamChanged }))
          );
        }),
        takeUntilDestroyed()
      )
      .subscribe(({ data, teamChanged }) => {
        const seasons = this.normalizeAndSortSeasons(data);
        this.seasons.set(seasons);

        const oldestSeason = seasons[0]?.season;
        const selectedStartFrom = this.selectedStartFrom();
        if (teamChanged || selectedStartFrom === undefined) {
          this.settingsService.setStartFromSeason(oldestSeason);
          return;
        }

        if (!seasons.some((season) => season.season === selectedStartFrom)) {
          this.settingsService.setStartFromSeason(oldestSeason);
        }
      });
  }

  setSelectedStartFrom(value: unknown): void {
    const season = toSeasonNumber(value);
    if (season === undefined) {
      return;
    }

    this.settingsService.setStartFromSeason(season);
  }

  private normalizeAndSortSeasons(data: Season[]): Season[] {
    const normalized = [...data].map((season) => {
      const normalizedSeason = toSeasonNumber(season.season);
      return normalizedSeason === undefined
        ? season
        : { ...season, season: normalizedSeason };
    });

    return normalized.sort((a, b) => {
      const aSeason = toSeasonNumber(a.season);
      const bSeason = toSeasonNumber(b.season);
      if (aSeason === undefined || bSeason === undefined) return 0;
      return aSeason - bSeason;
    });
  }
}
