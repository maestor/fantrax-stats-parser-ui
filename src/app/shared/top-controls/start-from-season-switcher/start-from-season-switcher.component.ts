import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import {
  Subject,
  auditTime,
  catchError,
  distinctUntilChanged,
  map,
  of,
  scan,
  switchMap,
  takeUntil,
} from 'rxjs';
import { ApiService, Season } from '@services/api.service';
import { TeamService } from '@services/team.service';
import { SettingsService } from '@services/settings.service';

@Component({
  selector: 'app-start-from-season-switcher',
  imports: [MatFormFieldModule, MatSelectModule, TranslateModule],
  templateUrl: './start-from-season-switcher.component.html',
  styleUrl: './start-from-season-switcher.component.scss',
})
export class StartFromSeasonSwitcherComponent implements OnInit, OnDestroy {
  seasons: Season[] = [];
  selectedStartFrom?: number;
  selectedStartFromText?: string;

  private apiService = inject(ApiService);
  private teamService = inject(TeamService);
  private settingsService = inject(SettingsService);
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.settingsService.startFromSeason$
      .pipe(takeUntil(this.destroy$))
      .subscribe((season) => {
        this.selectedStartFrom = this.toSeasonNumber(season);
        this.updateSelectedSeasonText();
      });

    this.teamService.selectedTeamId$
      .pipe(
        // Team switch + filter reset can happen in the same tick.
        auditTime(0),
        map((teamId) => this.toApiTeamId(teamId)),
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
        takeUntil(this.destroy$)
      )
      .subscribe(({ data, teamChanged }) => {
        const normalized = [...data].map((s) => {
          const normalizedSeason = this.toSeasonNumber((s as any).season);
          return normalizedSeason === undefined ? s : { ...s, season: normalizedSeason };
        });

        // User intent is selecting a "starting" season, so present oldest → newest.
        this.seasons = normalized.sort((a, b) => {
          const aSeason = this.toSeasonNumber((a as any).season);
          const bSeason = this.toSeasonNumber((b as any).season);
          if (aSeason === undefined || bSeason === undefined) return 0;
          return aSeason - bSeason;
        });

        this.updateSelectedSeasonText();

        const oldestSeason = this.seasons[0]?.season;
        if (typeof oldestSeason !== 'number' || !Number.isFinite(oldestSeason)) {
          // If the API returns an unexpected format, don't attempt to persist anything.
          return;
        }

        // Always reset the filter on team changes to avoid carrying over another team's range.
        if (teamChanged) {
          this.settingsService.setStartFromSeason(oldestSeason);
          return;
        }

        if (this.selectedStartFrom === undefined) {
          this.settingsService.setStartFromSeason(oldestSeason);
          return;
        }

        if (!this.seasons.some((s) => s.season === this.selectedStartFrom)) {
          this.settingsService.setStartFromSeason(oldestSeason);
        }
      });
  }

  changeStartFrom(event: MatSelectChange): void {
    const value = this.toSeasonNumber(event.value);
    if (value === undefined) return;

    this.selectedStartFrom = value;
    this.updateSelectedSeasonText();

    this.settingsService.setStartFromSeason(value);
  }

  private updateSelectedSeasonText(): void {
    if (this.selectedStartFrom === undefined) {
      this.selectedStartFromText = undefined;
      return;
    }

    this.selectedStartFromText = this.seasons.find((s) => s.season === this.selectedStartFrom)?.text;
  }

  private toSeasonNumber(raw: unknown): number | undefined {
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
    if (typeof raw === 'string') {
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  }

  private toApiTeamId(teamId: string): string | undefined {
    return teamId === '1' ? undefined : teamId;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
