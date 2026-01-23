import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, combineLatest, distinctUntilChanged, map, takeUntil } from 'rxjs';
import { ApiService, ReportType, Season } from '@services/api.service';
import { FilterService, FilterState } from '@services/filter.service';
import { TeamService } from '@services/team.service';

@Component({
  selector: 'app-season-switcher',
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    FormsModule,
    TranslateModule
],
  templateUrl: './season-switcher.component.html',
  styleUrl: './season-switcher.component.scss',
})
export class SeasonSwitcherComponent implements OnInit, OnDestroy {
  @Input() context: 'player' | 'goalie' = 'player';
  seasons: Season[] = [];
  selectedSeason: number | 'all' = 'all';
  selectedSeasonText?: string;

  apiService = inject(ApiService);
  filterService = inject(FilterService);
  teamService = inject(TeamService);
  destroy$ = new Subject<void>();

  ngOnInit() {
    const filters$ =
      this.context === 'goalie'
        ? this.filterService.goalieFilters$
        : this.filterService.playerFilters$;

    const reportType$ = filters$.pipe(
      map((filters: FilterState) => filters.reportType),
      distinctUntilChanged()
    );

    const season$ = filters$.pipe(
      map((filters: FilterState) => filters.season),
      distinctUntilChanged()
    );

    season$
      .pipe(takeUntil(this.destroy$))
      .subscribe((season: number | undefined) => {
        this.selectedSeason = this.normalizeSelectedSeason(season);
        this.updateSelectedSeasonText();
      });

    combineLatest([
      reportType$,
      this.teamService.selectedTeamId$.pipe(distinctUntilChanged()),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([reportType, teamId]) => {
        const apiTeamId = this.toApiTeamId(teamId);
        this.loadSeasons(reportType, apiTeamId);
      });
  }

  private loadSeasons(reportType: ReportType, teamId?: string) {
    const seasons$ = teamId
      ? this.apiService.getSeasons(reportType, teamId)
      : this.apiService.getSeasons(reportType);

    seasons$.subscribe({
      next: (data) => {
        this.seasons = [...data]
          .reverse()
          .map((s) => {
            const normalizedSeason = this.toSeasonNumber((s as any).season);
            return normalizedSeason === undefined ? s : { ...s, season: normalizedSeason };
          });

        this.updateSelectedSeasonText();

        if (this.selectedSeason !== 'all') {
          const selectedSeason = this.selectedSeason;
          if (!this.seasons.some((s) => s.season === selectedSeason)) {
            this.context === 'goalie'
              ? this.filterService.updateGoalieFilters({ season: undefined })
              : this.filterService.updatePlayerFilters({ season: undefined });
          }
        }
      },
      error: () => {
        this.seasons = [];
        this.updateSelectedSeasonText();
      },
    });
  }

  private updateSelectedSeasonText(): void {
    if (this.selectedSeason === 'all') {
      this.selectedSeasonText = undefined;
      return;
    }

    this.selectedSeasonText = this.seasons.find(
      (s) => s.season === this.selectedSeason
    )?.text;
  }

  private toSeasonNumber(raw: unknown): number | undefined {
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
    if (typeof raw === 'string') {
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  }

  private normalizeSelectedSeason(raw: unknown): number | 'all' {
    return this.toSeasonNumber(raw) ?? 'all';
  }

  private toApiTeamId(teamId: string): string | undefined {
    return teamId === '1' ? undefined : teamId;
  }

  changeSeason(event: MatSelectChange): void {
    const value =
      event.value === 'all' ? 'all' : this.normalizeSelectedSeason(event.value);

    this.selectedSeason = value;
    this.updateSelectedSeasonText();

    const season = value === 'all' ? undefined : value;
    this.context === 'goalie'
      ? this.filterService.updateGoalieFilters({ season })
      : this.filterService.updatePlayerFilters({ season });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
