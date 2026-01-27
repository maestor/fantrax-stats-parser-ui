import { DOCUMENT, NgComponentOutlet } from '@angular/common';
import { Component, ElementRef, Type, ViewChild, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslateModule } from '@ngx-translate/core';
import {
  Player,
  Goalie,
  PlayerSeasonStats,
  GoalieSeasonStats,
} from '@services/api.service';
import { MatTooltipModule } from '@angular/material/tooltip';

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
    MatTooltipModule,
    TranslateModule,
    NgComponentOutlet,
  ],
  templateUrl: './player-card.component.html',
  styleUrl: './player-card.component.scss',
})
export class PlayerCardComponent {
  readonly dialogRef = inject(MatDialogRef<PlayerCardComponent>);
  readonly data = inject<Player | Goalie>(MAT_DIALOG_DATA);
  private document = inject(DOCUMENT);
  private host = inject(ElementRef<HTMLElement>);

  @ViewChild('closeButton', { read: ElementRef })
  closeButton?: ElementRef<HTMLButtonElement>;

  readonly isGoalie = 'wins' in this.data;

  // Check if this data has seasons (combined stats)
  readonly hasSeasons = !!this.data.seasons && this.data.seasons.length > 0;

  // Determine view context (combined vs season)
  readonly viewContext: 'combined' | 'season' = this.hasSeasons && this.data.seasons!.length > 1 ? 'combined' : 'season';

  // Show Graphs tab if combined data with multiple seasons OR season data with scores
  readonly showGraphsTab = (this.hasSeasons && this.data.seasons!.length > 1) || (!this.hasSeasons && !!this.data.scores);

  // Track which tab is active (0 = All, 1 = By Season)
  selectedTabIndex = 0;

  // Track screen size for season format
  isMobile = false;

  // Combined stats
  excludedColumns = ['name', 'seasons', 'scores'];
  stats: StatRow[] = this.reorderStatsForDisplay(
    Object.keys(this.data).filter((key) => !this.excludedColumns.includes(key))
  ).map((key) => ({
    label: `tableColumn.${key}`,
    value:
      key === 'season'
        ? this.formatSeasonDisplay(
            this.data[key as keyof typeof this.data] as number
          )
        : (this.data[key as keyof typeof this.data] as string | number),
  }));

  // Columns for combined stats table
  displayedColumns: string[] = ['label', 'value'];

  // Columns for season breakdown table
  seasonColumns: string[] = [];
  seasonDataSource: (PlayerSeasonStats | GoalieSeasonStats)[] = [];
  graphsComponent: Type<unknown> | null = null;
  graphsLoading = false;
  graphsLoadPromise: Promise<void> | null = null;
  // Exposed mainly so tests can await the dynamic import deterministically.

  // Keep inputs as a TS-visible field (so it isn't considered "template-only" usage).
  graphsInputs: Record<string, unknown> = {
    data: this.data,
    viewContext: this.viewContext,
    closeButtonEl: undefined,
    requestFocusTabHeader: () => this.focusActiveTabHeader(),
  };

  constructor() {
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());

    if (this.hasSeasons) {
      this.setupSeasonData();
    }
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
    // Update season display if already initialized
    if (this.hasSeasons && this.seasonDataSource.length > 0) {
      this.setupSeasonData();
    }
  }

  private setupSeasonData(): void {
    if (!this.data.seasons) return;

    // Sort seasons by year, newest first
    const sortedSeasons = [...this.data.seasons].sort(
      (a, b) => b.season - a.season
    );

    // Transform season data to include formatted season display (short on mobile, full on desktop)
    this.seasonDataSource = sortedSeasons.map((season) => ({
      ...season,
      seasonDisplay: this.isMobile
        ? this.formatSeasonShort(season.season)
        : this.formatSeasonDisplay(season.season),
    })) as (PlayerSeasonStats | GoalieSeasonStats)[];

    // Get column names from the first season object
    if (this.data.seasons.length > 0) {
      const columns = Object.keys(this.data.seasons[0]);
      const excludedSeasonColumns = ['scores'];

      // Replace 'season' with 'seasonDisplay' for display and drop internal columns
      let orderedColumns = columns
        .filter((col) => !excludedSeasonColumns.includes(col))
        .map((col) => (col === 'season' ? 'seasonDisplay' : col));

      // Reorder goalie columns: place savePercent and gaa after saves
      if (
        orderedColumns.includes('gaa') ||
        orderedColumns.includes('savePercent')
      ) {
        const savesIndex = orderedColumns.indexOf('saves');
        if (savesIndex !== -1) {
          // Remove savePercent and gaa from their current positions
          const reorderedColumns = orderedColumns.filter(
            (col) => col !== 'gaa' && col !== 'savePercent'
          );

          // Insert them after saves (savePercent first, then gaa)
          const insertIndex = reorderedColumns.indexOf('saves') + 1;
          if (orderedColumns.includes('savePercent')) {
            reorderedColumns.splice(insertIndex, 0, 'savePercent');
          }
          if (orderedColumns.includes('gaa')) {
            reorderedColumns.splice(
              insertIndex + (orderedColumns.includes('savePercent') ? 1 : 0),
              0,
              'gaa'
            );
          }

          orderedColumns = reorderedColumns;
        }
      }

      // Ensure seasonDisplay first, then score columns (FR, FR/O) in the season table
      const priorityColumns = ['seasonDisplay', 'score', 'scoreAdjustedByGames'];
      const prioritizedColumns = [
        ...priorityColumns.filter((col) => orderedColumns.includes(col)),
        ...orderedColumns.filter((col) => !priorityColumns.includes(col)),
      ];

      this.seasonColumns = prioritizedColumns;
    }
  }


  private formatSeasonDisplay(year: number): string {
    const nextYear = year + 1;
    const nextYearShort = String(nextYear).slice(-2);
    return `${year}-${nextYearShort}`;
  }

  private formatSeasonShort(year: number): string {
    const startShort = String(year).slice(-2);
    const nextYear = year + 1;
    const endShort = String(nextYear).slice(-2);
    return `${startShort}-${endShort}`;
  }

  private reorderStatsForDisplay(keys: string[]): string[] {
    let reorderedKeys = [...keys];

    // Move score after name if it exists
    if (reorderedKeys.includes('score')) {
      reorderedKeys = reorderedKeys.filter((key) => key !== 'score');
      const nameIndex = reorderedKeys.indexOf('name');
      reorderedKeys.splice(nameIndex + 1, 0, 'score');
    }

    // Move scoreAdjustedByGames after score if it exists
    if (reorderedKeys.includes('scoreAdjustedByGames')) {
      reorderedKeys = reorderedKeys.filter(
        (key) => key !== 'scoreAdjustedByGames'
      );
      const scoreIndex = reorderedKeys.indexOf('score');
      reorderedKeys.splice(scoreIndex + 1, 0, 'scoreAdjustedByGames');
    }

    // Move season to the top if it exists
    if (reorderedKeys.includes('season')) {
      reorderedKeys = reorderedKeys.filter((key) => key !== 'season');
      reorderedKeys.unshift('season');
    }

    // Reorder goalie stats: place savePercent and gaa after saves
    if (
      reorderedKeys.includes('gaa') ||
      reorderedKeys.includes('savePercent')
    ) {
      const savesIndex = reorderedKeys.indexOf('saves');
      if (savesIndex !== -1) {
        // Remove savePercent and gaa from their current positions
        const tempKeys = reorderedKeys.filter(
          (key) => key !== 'gaa' && key !== 'savePercent'
        );

        // Insert them after saves (savePercent first, then gaa)
        const insertIndex = tempKeys.indexOf('saves') + 1;
        if (reorderedKeys.includes('savePercent')) {
          tempKeys.splice(insertIndex, 0, 'savePercent');
        }
        if (reorderedKeys.includes('gaa')) {
          tempKeys.splice(
            insertIndex + (reorderedKeys.includes('savePercent') ? 1 : 0),
            0,
            'gaa'
          );
        }

        reorderedKeys = tempKeys;
      }
    }

    return reorderedKeys;
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    this.updateGraphsInputs();

    // Graphs tab is heavy (Chart.js). Lazy-load it to keep the initial bundle small.
    // Tab index: 0=All, 1=By Season (if hasSeasons), 2=Graphs (if hasSeasons) OR 1=Graphs (if !hasSeasons)
    const graphsTabIndex = this.hasSeasons ? 2 : 1;
    if (index === graphsTabIndex) {
      this.graphsLoadPromise = this.ensureGraphsLoaded();
      void this.graphsLoadPromise;
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  private async ensureGraphsLoaded(): Promise<void> {
    if (this.graphsComponent || this.graphsLoading) {
      return this.graphsLoadPromise ?? Promise.resolve();
    }

    this.graphsLoading = true;

    this.graphsLoadPromise = (async () => {
      const module = await import('./player-card-graphs/player-card-graphs.component');
      this.graphsComponent = module.PlayerCardGraphsComponent;
    })()
      .finally(() => {
        this.graphsLoading = false;
      });

    return this.graphsLoadPromise;
  }

  private updateGraphsInputs(): void {
    this.graphsInputs = {
      data: this.data,
      viewContext: this.viewContext,
      closeButtonEl: this.closeButton?.nativeElement,
      requestFocusTabHeader: () => this.focusActiveTabHeader(),
    };
  }

  private focusActiveTabHeader(): void {
    // Angular Material tabs render the header within the component DOM.
    // Prefer focusing the active tab label so users can move between tabs.
    const root = this.host.nativeElement;
    const activeTab = root.querySelector(
      '.mat-mdc-tab-header .mdc-tab--active'
    ) as HTMLElement | null;

    if (activeTab) {
      activeTab.focus();
      return;
    }

    // Fallback: if the component isn't fully rendered yet.
    const anyTabHeader = this.document.querySelector(
      '.mat-mdc-tab-header .mdc-tab'
    ) as HTMLElement | null;
    anyTabHeader?.focus();
  }
}
