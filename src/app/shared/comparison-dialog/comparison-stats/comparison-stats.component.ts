import { Component, Input, OnInit, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import type { Player, Goalie } from '@services/api.service';
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

  @Input({ required: true }) playerA!: Player | Goalie;
  @Input({ required: true }) playerB!: Player | Goalie;
  @Input() isMobile = false;

  statRows: StatRow[] = [];

  get isGoalie(): boolean {
    return 'wins' in this.playerA;
  }

  ngOnInit(): void {
    this.buildStatRows();
  }

  private buildStatRows(): void {
    const columns = this.getStatColumns();

    this.statRows = columns.map((key) => {
      const valueA = this.getStatValue(this.playerA, key);
      const valueB = this.getStatValue(this.playerB, key);
      const label = this.translateService.instant(`tableColumn.${key}`);
      const { boldA, boldB } = this.computeBold(key, valueA, valueB);

      return { key, label, valueA, valueB, boldA, boldB };
    });
  }

  private getStatColumns(): string[] {
    if (!this.isGoalie) {
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
