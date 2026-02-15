import { DOCUMENT, NgComponentOutlet } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, Type, ViewChild, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslateModule } from '@ngx-translate/core';
import {
  Player,
  Goalie,
  PlayerSeasonStats,
  GoalieSeasonStats,
  ApiService,
  Team,
} from '@services/api.service';
import { FilterService, PositionFilter } from '@services/filter.service';
import { TeamService } from '@services/team.service';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { toSlug } from '../../utils/slug.utils';
import { take } from 'rxjs';

export type PlayerCardTab = 'all' | 'by-season' | 'graphs';

export type PlayerCardDialogData = {
  player: Player | Goalie;
  initialTab?: PlayerCardTab;
  navigationContext?: {
    allPlayers: (Player | Goalie)[];
    currentIndex: number;
    onNavigate?: (newIndex: number) => void;
  };
};

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
    MatSlideToggleModule,
    MatTooltipModule,
    TranslateModule,
    NgComponentOutlet,
  ],
  templateUrl: './player-card.component.html',
  styleUrl: './player-card.component.scss',
})
export class PlayerCardComponent {
  readonly dialogRef = inject(MatDialogRef<PlayerCardComponent>);
  private rawDialogData = inject<Player | Goalie | PlayerCardDialogData>(MAT_DIALOG_DATA);
  private document = inject(DOCUMENT);
  private host = inject(ElementRef<HTMLElement>);
  private apiService = inject(ApiService);
  private teamService = inject(TeamService);
  private filterService = inject(FilterService);
  private cdr = inject(ChangeDetectorRef);

  // Copy link feedback state
  linkCopied = false;
  positionFilter: PositionFilter = 'all';
  statsPerGame = false;
  selectedTeam: Team | undefined;

  @ViewChild('closeButton', { read: ElementRef })
  closeButton?: ElementRef<HTMLButtonElement>;

  // Support both wrapped format { player, initialTab } and direct Player/Goalie
  readonly data: Player | Goalie = this.isWrappedData(this.rawDialogData)
    ? this.rawDialogData.player
    : this.rawDialogData;
  readonly initialTab: PlayerCardTab | undefined = this.isWrappedData(this.rawDialogData)
    ? this.rawDialogData.initialTab
    : undefined;

  // Navigation state
  readonly navigationContext = this.isWrappedData(this.rawDialogData)
    ? this.rawDialogData.navigationContext
    : undefined;

  currentIndex: number = this.navigationContext?.currentIndex ?? 0;
  allPlayers: (Player | Goalie)[] = this.navigationContext?.allPlayers ?? [];

  readonly isGoalie = 'wins' in this.data;

  private isWrappedData(data: Player | Goalie | PlayerCardDialogData): data is PlayerCardDialogData {
    return 'player' in data && (data as PlayerCardDialogData).player !== undefined;
  }

  // Check if this data has seasons (combined stats)
  readonly hasSeasons = !!this.data.seasons && this.data.seasons.length > 0;

  // Determine view context (combined vs season)
  readonly viewContext: 'combined' | 'season' = this.hasSeasons ? 'combined' : 'season';

  // Show Graphs tab if combined data with multiple seasons OR season data with scores
  readonly showGraphsTab = (this.hasSeasons && this.data.seasons!.length > 1) || (!this.hasSeasons && !!this.data.scores);

  // Track which tab is active (0 = All, 1 = By Season)
  selectedTabIndex = 0;

  // Track screen size for season format
  isMobile = false;

  // Base excluded columns (always excluded)
  private baseExcludedColumns = [
    'name',
    'seasons',
    'scores',
    'position',
    'scoresByPosition',
    'scoreByPosition',
    'scoreByPositionAdjustedByGames',
    '_originalScore',
    '_originalScoreAdjustedByGames',
  ];

  // Getter for excluded columns (for compatibility/testing)
  get excludedColumns(): string[] {
    const excluded = [...this.baseExcludedColumns];
    if (this.statsPerGame) {
      excluded.push('score');
    }
    return excluded;
  }

  // Combined stats - will be populated in constructor after getting filter state
  stats: StatRow[] = [];

  // Columns for combined stats table
  displayedColumns: string[] = ['label', 'value'];

  // Columns for season breakdown table
  seasonColumns: string[] = [];
  seasonDataSource: (PlayerSeasonStats | GoalieSeasonStats)[] = [];
  careerBests: Map<string, Set<number>> = new Map();
  graphsComponent: Type<unknown> | null = null;
  graphsLoading = false;
  graphsLoadPromise: Promise<void> | null = null;
  // Exposed mainly so tests can await the dynamic import deterministically.

  // Keep inputs as a TS-visible field (so it isn't considered "template-only" usage).
  graphsInputs: Record<string, unknown> = {
    data: this.data,
    viewContext: this.viewContext,
    positionFilter: this.positionFilter,
    closeButtonEl: undefined,
    requestFocusTabHeader: () => this.focusActiveTabHeader(),
  };

  constructor() {
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());

    // Fetch selected team once
    this.apiService.getTeams().pipe(take(1)).subscribe((teams) => {
      this.selectedTeam = teams.find((t) => t.id === this.teamService.selectedTeamId);
    });

    // Get filter state for proper column display
    const filterObservable = this.isGoalie
      ? this.filterService.goalieFilters$
      : this.filterService.playerFilters$;

    filterObservable.pipe(take(1)).subscribe((f) => {
      this.statsPerGame = f.statsPerGame;
      if (!this.isGoalie) {
        this.positionFilter = f.positionFilter;
      }
      this.buildStats();
      if (this.hasSeasons) {
        this.setupSeasonData();
      }
      this.updateGraphsInputs();
    });

    // Set initial tab from dialog data if provided
    if (this.initialTab) {
      this.selectedTabIndex = this.getTabIndexFromName(this.initialTab);
      // Pre-load graphs if that's the initial tab
      const graphsTabIndex = this.hasSeasons ? 2 : 1;
      if (this.selectedTabIndex === graphsTabIndex && this.showGraphsTab) {
        this.graphsLoadPromise = this.ensureGraphsLoaded();
        void this.graphsLoadPromise;
      }
    }
  }

  private getTabIndexFromName(tabName: PlayerCardTab): number {
    switch (tabName) {
      case 'all':
        return 0;
      case 'by-season':
        // Only valid if hasSeasons, otherwise fall back to 0
        return this.hasSeasons ? 1 : 0;
      case 'graphs':
        // Graphs is at index 2 if hasSeasons, otherwise index 1
        if (!this.showGraphsTab) return 0;
        return this.hasSeasons ? 2 : 1;
      default:
        return 0;
    }
  }

  private buildStats(): void {
    // Build excluded columns based on current filter state
    const excludedColumns = [...this.baseExcludedColumns];
    if (this.statsPerGame) {
      excludedColumns.push('score');
    }

    if (this.viewContext === 'combined') {
      excludedColumns.push('season');
    }

    // Determine if we should use position-based scores
    const usePositionScores = !this.isGoalie && this.positionFilter !== 'all';
    const player = this.data as Player;

    this.stats = this.reorderStatsForDisplay(
      Object.keys(this.data).filter((key) => !excludedColumns.includes(key))
    ).map((key) => {
      let value: string | number;

      if (key === 'season') {
        value = this.formatSeasonDisplay(
          this.data[key as keyof typeof this.data] as number
        );
      } else if (usePositionScores && key === 'score' && player.scoreByPosition != null) {
        value = player.scoreByPosition;
      } else if (usePositionScores && key === 'scoreAdjustedByGames' && player.scoreByPositionAdjustedByGames != null) {
        value = player.scoreByPositionAdjustedByGames;
      } else if (!usePositionScores && key === 'score' && player._originalScore != null) {
        // Use preserved original score when filter is 'all' (data may have been transformed)
        value = player._originalScore;
      } else if (!usePositionScores && key === 'scoreAdjustedByGames' && player._originalScoreAdjustedByGames != null) {
        // Use preserved original per-game score when filter is 'all'
        value = player._originalScoreAdjustedByGames;
      } else {
        value = this.data[key as keyof typeof this.data] as string | number;
      }

      return {
        label: `tableColumn.${key}`,
        value,
      };
    });
  }

  get positionAbbreviation(): string {
    if (this.isGoalie) return 'M';
    const player = this.data as Player;
    return player.position === 'D' ? 'P' : 'H';
  }

  get positionTooltip(): string {
    if (this.isGoalie) return 'Maalivahti';
    const player = this.data as Player;
    return player.position === 'D' ? 'Puolustaja' : 'Hyökkääjä';
  }

  // Getter for position filter switch label
  get positionSwitchLabel(): string {
    if (this.isGoalie) return '';
    const player = this.data as Player;
    return player.position === 'D'
      ? 'playerCardPositionFilter.defensemen'
      : 'playerCardPositionFilter.forwards';
  }

  // Check if position filter is enabled (specific position selected, not 'all')
  get isPositionFilterEnabled(): boolean {
    return this.positionFilter !== 'all';
  }

  // Toggle position filter between player's position and 'all'
  onPositionFilterToggle(checked: boolean): void {
    if (this.isGoalie) return;
    const player = this.data as Player;
    const newFilter: PositionFilter = checked ? (player.position ?? 'F') : 'all';
    this.filterService.updatePlayerFilters({ positionFilter: newFilter });
    this.positionFilter = newFilter;
    this.buildStats();
    if (this.hasSeasons) {
      this.setupSeasonData();
    }
    this.updateGraphsInputs();
    this.cdr.detectChanges();
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
    // Determine if we should use position-based scores for seasons
    const usePositionScores = !this.isGoalie && this.positionFilter !== 'all';

    this.seasonDataSource = sortedSeasons.map((season) => {
      const seasonData = {
        ...season,
        seasonDisplay: this.isMobile
          ? this.formatSeasonShort(season.season)
          : this.formatSeasonDisplay(season.season),
      };

      // Transform score values when position filter is active
      if (usePositionScores) {
        const playerSeason = season as PlayerSeasonStats;
        if (playerSeason.scoreByPosition != null) {
          (seasonData as any).score = playerSeason.scoreByPosition;
        }
        if (playerSeason.scoreByPositionAdjustedByGames != null) {
          (seasonData as any).scoreAdjustedByGames = playerSeason.scoreByPositionAdjustedByGames;
        }
      }

      return seasonData;
    }) as (PlayerSeasonStats | GoalieSeasonStats)[];

    // Get column names from the first season object
    if (this.data.seasons.length > 0) {
      const columns = Object.keys(this.data.seasons[0]);
      const excludedSeasonColumns = [
        'position',
        'scores',
        'scoresByPosition',
        'scoreByPosition',
        'scoreByPositionAdjustedByGames',
      ];

      // Also exclude 'score' in statsPerGame mode
      if (this.statsPerGame) {
        excludedSeasonColumns.push('score');
      }

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

    this.computeCareerBests();
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

  private parseStatValue(value: unknown): number | null {
    if (value === '' || value === '-' || value === null || value === undefined) {
      return null;
    }
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    return isNaN(num) ? null : num;
  }

  private computeCareerBests(): void {
    this.careerBests.clear();

    if (this.seasonDataSource.length < 2) return;

    const statColumns = this.seasonColumns.filter(col => col !== 'seasonDisplay');

    for (const column of statColumns) {
      const values = this.seasonDataSource.map(s => ({
        season: s.season,
        value: this.parseStatValue((s as Record<string, unknown>)[column])
      })).filter(v => v.value !== null) as { season: number; value: number }[];

      // Skip if no valid values or all zeros
      if (values.length === 0 || values.every(v => v.value === 0)) continue;

      // Find best value (min for GAA, max for others)
      const bestValue = column === 'gaa'
        ? Math.min(...values.map(v => v.value))
        : Math.max(...values.map(v => v.value));

      // Store all seasons with the best value
      const bestSeasons = values
        .filter(v => v.value === bestValue)
        .map(v => v.season);

      this.careerBests.set(column, new Set(bestSeasons));
    }
  }

  isCareerBest(column: string, season: number): boolean {
    return this.careerBests.get(column)?.has(season) ?? false;
  }

  private reorderStatsForDisplay(keys: string[]): string[] {
    let reorderedKeys = [...keys];

    // Define the priority order for score-related columns
    // Order should be: season (if exists), score, scoreAdjustedByGames, games, then rest
    const priorityColumns = ['season', 'score', 'scoreAdjustedByGames', 'games'];

    // Extract priority columns that exist in the keys
    const existingPriorityColumns = priorityColumns.filter((col) =>
      reorderedKeys.includes(col)
    );

    // Get remaining columns (not in priority list)
    const remainingColumns = reorderedKeys.filter(
      (key) => !priorityColumns.includes(key)
    );

    // Combine: priority columns first, then remaining
    reorderedKeys = [...existingPriorityColumns, ...remainingColumns];

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

  copyLinkToClipboard(tooltip?: MatTooltip): void {
    if (!this.selectedTeam) return;

    const teamSlug = toSlug(this.selectedTeam.name);
    const playerSlug = toSlug(this.data.name);
    const type = this.isGoalie ? 'goalie' : 'player';

    // Build path - season is now in path for better SEO
    const season = (this.data as { season?: number }).season;
    const seasonPath = season !== undefined ? `/${season}` : '';

    // Tab stays as query param (UI detail)
    const tabName = this.getCurrentTabName();
    const queryString = tabName !== 'all' ? `?tab=${tabName}` : '';

    const url = `${this.document.location.origin}/${type}/${teamSlug}/${playerSlug}${seasonPath}${queryString}`;

    navigator.clipboard.writeText(url).then(() => {
      this.linkCopied = true;
      // Show the tooltip with the "copied" message
      tooltip?.show();
      setTimeout(() => {
        this.linkCopied = false;
        tooltip?.hide();
      }, 2000);
    });
  }

  private getCurrentTabName(): PlayerCardTab {
    if (this.hasSeasons) {
      // Tabs: 0=all, 1=by-season, 2=graphs
      switch (this.selectedTabIndex) {
        case 1: return 'by-season';
        case 2: return 'graphs';
        default: return 'all';
      }
    } else {
      // Tabs: 0=all, 1=graphs (no by-season tab)
      return this.selectedTabIndex === 1 ? 'graphs' : 'all';
    }
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
      positionFilter: this.positionFilter,
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
