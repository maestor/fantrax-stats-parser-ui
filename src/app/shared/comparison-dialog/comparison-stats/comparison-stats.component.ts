import { Component, Input, OnInit, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import type { Player, Goalie } from '@services/api.service';
import { FilterService } from '@services/filter.service';
import { take } from 'rxjs';
import {
  PLAYER_STAT_COLUMNS,
  GOALIE_STAT_COLUMNS,
  GOALIE_SEASON_STAT_COLUMNS,
} from '@shared/table-columns';

export type StatRow = {
  key: string;
  label: string;
  valueA: number | string;
  valueB: number | string;
  boldA: boolean;
  boldB: boolean;
};

@Component({
  selector: 'app-comparison-stats',
  imports: [TranslateModule],
  templateUrl: './comparison-stats.component.html',
  styleUrl: './comparison-stats.component.scss',
})
export class ComparisonStatsComponent implements OnInit {
  private translateService = inject(TranslateService);

  @Input() context: 'player' | 'goalie' = 'player';
  @Input({ required: true }) playerA!: Player | Goalie;
  @Input({ required: true }) playerB!: Player | Goalie;
  @Input() isMobile = false;

  private filterService = inject(FilterService);

  statsPerGame = false;
  statRows: StatRow[] = [];

  ngOnInit(): void {
    const filters$ = this.context === 'goalie'
      ? this.filterService.goalieFilters$
      : this.filterService.playerFilters$;

    filters$.pipe(take(1)).subscribe((filters) => {
      this.statsPerGame = filters.statsPerGame;
    });
    this.buildStatRows();
  }

  private getShortName(fullName: string): string {
    const parts = fullName.split(' ');
    return parts[0].charAt(0) + '. ' + parts[parts.length - 1];
  }

  private buildStatRows(): void {
    let columns = this.getStatColumns();

    if (this.statsPerGame) {
      // Remove score from columns
      columns = columns.filter(column => column !== 'score');
    }

    console.info('Building stat rows with columns:', columns);

    const nameRow: StatRow = {
      key: 'name',
      label: this.translateService.instant('tableColumn.name'),
      valueA: this.isMobile ? this.getShortName(this.playerA.name) : this.playerA.name,
      valueB: this.isMobile ? this.getShortName(this.playerB.name) : this.playerB.name,
      boldA: true,
      boldB: false
    };

    this.statRows = [
      nameRow,
      ...columns.map((key) => {
        const valueA = this.getStatValue(this.playerA, key);
        const valueB = this.getStatValue(this.playerB, key);
        const label = this.translateService.instant(`tableColumn.${key}`);
        const { boldA, boldB } = this.computeBold(key, valueA, valueB);

        return { key, label, valueA, valueB, boldA, boldB };
      })];
  }

  private getStatColumns(): string[] {
    if (this.context === 'player') {
      return PLAYER_STAT_COLUMNS;
    }

    // Check if goalie has season-specific stats (gaa, savePercent)
    const hasSeasonStats = 'gaa' in this.playerA && this.playerA.gaa !== undefined;
    return hasSeasonStats ? GOALIE_SEASON_STAT_COLUMNS : GOALIE_STAT_COLUMNS;
  }

  private getStatValue(player: Player | Goalie, key: string): number | string {
    const value = (player as Record<string, unknown>)[key];
    if (value === undefined || value === null) return '-';
    return value as number | string;
  }

  private computeBold(
    key: string,
    valueA: number | string,
    valueB: number | string,
  ): { boldA: boolean; boldB: boolean } {
    const numA = typeof valueA === 'number' ? valueA : parseFloat(String(valueA));
    const numB = typeof valueB === 'number' ? valueB : parseFloat(String(valueB));

    if (isNaN(numA) || isNaN(numB) || numA === numB) {
      return { boldA: false, boldB: false };
    }

    // GAA: lower is better
    if (key === 'gaa') {
      return { boldA: numA < numB, boldB: numB < numA };
    }

    // All other stats: higher is better
    return { boldA: numA > numB, boldB: numB > numA };
  }
}
