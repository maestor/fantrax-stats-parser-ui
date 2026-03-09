import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslateModule } from '@ngx-translate/core';
import {
  auditTime,
  catchError,
  combineLatest,
  distinctUntilChanged,
  map,
  of,
  scan,
  switchMap,
} from 'rxjs';
import { ApiService, ReportType, Season } from '@services/api.service';
import { FilterService } from '@services/filter.service';
import { TeamService } from '@services/team.service';
import { SettingsService } from '@services/settings.service';
import { toApiTeamId } from '@shared/utils/api.utils';
import { toSeasonNumber } from '@shared/utils/season.utils';
import { StatsContext } from '@shared/types/context.types';

@Component({
  selector: 'app-season-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    TranslateModule
  ],
  templateUrl: './season-switcher.component.html',
  styleUrl: './season-switcher.component.scss',
})
export class SeasonSwitcherComponent {
  readonly context = input.required<StatsContext>();

  private readonly apiService = inject(ApiService);
  private readonly filterService = inject(FilterService);
  private readonly teamService = inject(TeamService);
  private readonly settingsService = inject(SettingsService);
  private readonly filterState = computed(() =>
    this.context() === 'goalie'
      ? this.filterService.goalieFiltersSignal()
      : this.filterService.playerFiltersSignal()
  );
  readonly reportType = computed(() => this.filterState().reportType);
  readonly selectedSeason = computed<number | 'all'>(() =>
    this.normalizeSelectedSeason(this.filterState().season)
  );
  private readonly seasonState = toSignal(
    combineLatest([
      toObservable(this.reportType).pipe(distinctUntilChanged()),
      this.teamService.selectedTeamId$.pipe(distinctUntilChanged()),
      this.settingsService.startFromSeason$.pipe(distinctUntilChanged()),
    ]).pipe(
      auditTime(0),
      map(([reportType, teamId, startFrom]) => ({
        reportType,
        teamId: toApiTeamId(teamId),
        startFrom,
      })),
      scan(
        (state, next) => ({
          prevTeamId: state.teamId,
          ...next,
          initialized: true,
          teamChanged: state.initialized && state.teamId !== next.teamId,
        }),
        {
          prevTeamId: undefined as string | undefined,
          reportType: 'regular' as ReportType,
          teamId: undefined as string | undefined,
          startFrom: undefined as number | undefined,
          initialized: false,
          teamChanged: false,
        }
      ),
      distinctUntilChanged(
        (a, b) =>
          a.reportType === b.reportType &&
          a.teamId === b.teamId &&
          a.startFrom === b.startFrom
      ),
      switchMap(({ reportType, teamId, startFrom }) => {
        const seasons$ = startFrom === undefined
          ? teamId
            ? this.apiService.getSeasons(reportType, teamId)
            : this.apiService.getSeasons(reportType)
          : teamId
            ? this.apiService.getSeasons(reportType, teamId, startFrom)
            : this.apiService.getSeasons(reportType, undefined, startFrom);

        return seasons$.pipe(
          map((data) => ({
            loaded: true,
            data: [...data]
              .reverse()
              .map((season) => {
                const normalizedSeason = toSeasonNumber(season.season);
                return normalizedSeason === undefined
                  ? season
                  : { ...season, season: normalizedSeason };
              }),
          })),
          catchError(() => of({ loaded: true, data: [] as Season[] }))
        );
      })
    ),
    { initialValue: { loaded: false, data: [] as Season[] } }
  );
  readonly seasons = computed(() => this.seasonState().data);
  readonly selectedSeasonText = computed<string | undefined>(() => {
    const selectedSeason = this.selectedSeason();
    if (selectedSeason === 'all') {
      return undefined;
    }

    return this.seasons().find((season) => season.season === selectedSeason)?.text;
  });

  constructor() {
    effect(() => {
      const seasonState = this.seasonState();
      const selectedSeason = this.selectedSeason();

      if (!seasonState.loaded || selectedSeason === 'all') {
        return;
      }

      if (!seasonState.data.some((season) => season.season === selectedSeason)) {
        queueMicrotask(() => this.updateSeason(undefined));
      }
    });
  }

  private normalizeSelectedSeason(raw: unknown): number | 'all' {
    return toSeasonNumber(raw) ?? 'all';
  }

  changeSeason(event: MatSelectChange): void {
    const value =
      event.value === 'all' ? 'all' : this.normalizeSelectedSeason(event.value);

    this.updateSeason(value === 'all' ? undefined : value);
  }

  private updateSeason(season: number | undefined): void {
    this.context() === 'goalie'
      ? this.filterService.updateGoalieFilters({ season })
      : this.filterService.updatePlayerFilters({ season });
  }
}
