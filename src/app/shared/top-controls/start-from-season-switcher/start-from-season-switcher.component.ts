import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
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
import { TeamService } from '@services/team.service';
import { SettingsService } from '@services/settings.service';
import { toApiTeamId } from '@shared/utils/api.utils';
import { toSeasonNumber } from '@shared/utils/season.utils';

@Component({
  selector: 'app-start-from-season-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatSelectModule, TranslateModule],
  templateUrl: './start-from-season-switcher.component.html',
  styleUrl: './start-from-season-switcher.component.scss',
})
export class StartFromSeasonSwitcherComponent {
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

  changeStartFrom(event: MatSelectChange): void {
    const value = toSeasonNumber(event.value);
    if (value === undefined) return;

    this.settingsService.setStartFromSeason(value);
  }

  private normalizeAndSortSeasons(data: Season[]): Season[] {
    const normalized = [...data].map((season) => {
      const normalizedSeason = toSeasonNumber(season.season);
      return normalizedSeason === undefined
        ? season
        : { ...season, season: normalizedSeason };
    });

    // User intent is selecting a "starting" season, so present oldest -> newest.
    return normalized.sort((a, b) => {
      const aSeason = toSeasonNumber(a.season);
      const bSeason = toSeasonNumber(b.season);
      if (aSeason === undefined || bSeason === undefined) return 0;
      return aSeason - bSeason;
    });
  }
}
