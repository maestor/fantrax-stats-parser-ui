import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslateModule } from '@ngx-translate/core';
import { Player, Goalie, PlayerSeasonStats, GoalieSeasonStats } from '@services/api.service';

interface StatRow {
  label: string;
  value: string | number;
}

@Component({
  selector: 'app-player-card',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatTabsModule,
    TranslateModule,
  ],
  templateUrl: './player-card.component.html',
  styleUrl: './player-card.component.scss',
})
export class PlayerCardComponent {
  readonly dialogRef = inject(MatDialogRef<PlayerCardComponent>);
  readonly data = inject<Player | Goalie>(MAT_DIALOG_DATA);

  // Check if this data has seasons (combined stats)
  readonly hasSeasons = !!this.data.seasons && this.data.seasons.length > 0;

  // Track which tab is active (0 = All, 1 = By Season)
  selectedTabIndex = 0;

  // Combined stats (excluding name and seasons)
  stats: StatRow[] = this.reorderStatsForDisplay(
    Object.keys(this.data)
      .filter((key) => !key.includes('name') && key !== 'seasons')
  ).map((key) => ({
    label: `tableColumn.${key}`,
    value: key === 'season'
      ? this.formatSeasonDisplay(this.data[key as keyof typeof this.data] as number)
      : this.data[key as keyof typeof this.data] as string | number,
  }));

  // Columns for combined stats table
  displayedColumns: string[] = ['label', 'value'];

  // Columns for season breakdown table
  seasonColumns: string[] = [];
  seasonDataSource: (PlayerSeasonStats | GoalieSeasonStats)[] = [];

  constructor() {
    if (this.hasSeasons) {
      this.setupSeasonData();
    }
  }

  private setupSeasonData(): void {
    if (!this.data.seasons) return;

    // Sort seasons by year, newest first
    const sortedSeasons = [...this.data.seasons].sort((a, b) => b.season - a.season);

    // Transform season data to include formatted season display
    this.seasonDataSource = sortedSeasons.map(season => ({
      ...season,
      seasonDisplay: this.formatSeasonDisplay(season.season)
    })) as (PlayerSeasonStats | GoalieSeasonStats)[];

    // Get column names from the first season object
    if (this.data.seasons.length > 0) {
      const columns = Object.keys(this.data.seasons[0]);
      // Replace 'season' with 'seasonDisplay' for display
      let orderedColumns = columns.map(col => col === 'season' ? 'seasonDisplay' : col);

      // Reorder goalie columns: place savePercent and gaa after saves
      if (orderedColumns.includes('gaa') || orderedColumns.includes('savePercent')) {
        const savesIndex = orderedColumns.indexOf('saves');
        if (savesIndex !== -1) {
          // Remove savePercent and gaa from their current positions
          const reorderedColumns = orderedColumns.filter(col => col !== 'gaa' && col !== 'savePercent');

          // Insert them after saves (savePercent first, then gaa)
          const insertIndex = reorderedColumns.indexOf('saves') + 1;
          if (orderedColumns.includes('savePercent')) {
            reorderedColumns.splice(insertIndex, 0, 'savePercent');
          }
          if (orderedColumns.includes('gaa')) {
            reorderedColumns.splice(insertIndex + (orderedColumns.includes('savePercent') ? 1 : 0), 0, 'gaa');
          }

          orderedColumns = reorderedColumns;
        }
      }

      this.seasonColumns = orderedColumns;
    }
  }

  private formatSeasonDisplay(year: number): string {
    const nextYear = year + 1;
    const nextYearShort = String(nextYear).slice(-2);
    return `${year}-${nextYearShort}`;
  }

  private reorderStatsForDisplay(keys: string[]): string[] {
    let reorderedKeys = [...keys];

    // Move season to the top if it exists
    if (reorderedKeys.includes('season')) {
      reorderedKeys = reorderedKeys.filter(key => key !== 'season');
      reorderedKeys.unshift('season');
    }

    // Reorder goalie stats: place savePercent and gaa after saves
    if (reorderedKeys.includes('gaa') || reorderedKeys.includes('savePercent')) {
      const savesIndex = reorderedKeys.indexOf('saves');
      if (savesIndex !== -1) {
        // Remove savePercent and gaa from their current positions
        const tempKeys = reorderedKeys.filter(key => key !== 'gaa' && key !== 'savePercent');

        // Insert them after saves (savePercent first, then gaa)
        const insertIndex = tempKeys.indexOf('saves') + 1;
        if (reorderedKeys.includes('savePercent')) {
          tempKeys.splice(insertIndex, 0, 'savePercent');
        }
        if (reorderedKeys.includes('gaa')) {
          tempKeys.splice(insertIndex + (reorderedKeys.includes('savePercent') ? 1 : 0), 0, 'gaa');
        }

        reorderedKeys = tempKeys;
      }
    }

    return reorderedKeys;
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
