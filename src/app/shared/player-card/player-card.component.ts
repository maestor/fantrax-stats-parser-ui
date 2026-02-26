import { DOCUMENT, NgComponentOutlet } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, HostListener, Type, ViewChild, inject } from '@angular/core';
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
import { toSlug } from '@shared/utils/slug.utils';
import { take } from 'rxjs';
import { PlayerCardStatsService, StatRow } from './player-card-stats.service';
import { PlayerCardSeasonsService } from './player-card-seasons.service';
import { PlayerCardNavigationService } from './player-card-navigation.service';

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
  providers: [PlayerCardNavigationService],
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
  private statsService = inject(PlayerCardStatsService);
  private seasonsService = inject(PlayerCardSeasonsService);
  readonly navigationService = inject(PlayerCardNavigationService);

  // Copy link feedback state
  linkCopied = false;
  positionFilter: PositionFilter = 'all';
  statsPerGame = false;
  selectedTeam: Team | undefined;

  @ViewChild('closeButton', { read: ElementRef })
  closeButton?: ElementRef<HTMLButtonElement>;

  // Support both wrapped format { player, initialTab } and direct Player/Goalie
  data: Player | Goalie = this.isWrappedData(this.rawDialogData)
    ? this.rawDialogData.player
    : this.rawDialogData;
  readonly initialTab: PlayerCardTab | undefined = this.isWrappedData(this.rawDialogData)
    ? this.rawDialogData.initialTab
    : undefined;

  // Navigation state
  readonly navigationContext = this.isWrappedData(this.rawDialogData)
    ? this.rawDialogData.navigationContext
    : undefined;

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
      this.stats = this.statsService.buildStats(this.data, {
        isGoalie: this.isGoalie,
        statsPerGame: this.statsPerGame,
        positionFilter: this.positionFilter,
        viewContext: this.viewContext,
      });
      if (this.hasSeasons) {
        this.refreshSeasonData();
      }
      this.updateGraphsInputs();
    });

    // Initialize navigation service
    this.navigationService.init(
      this.navigationContext,
      this.host,
      this.cdr,
      (player, _index) => {
        this.data = player;
        this.stats = this.statsService.buildStats(this.data, {
          isGoalie: this.isGoalie,
          statsPerGame: this.statsPerGame,
          positionFilter: this.positionFilter,
          viewContext: this.viewContext,
        });
        if (this.hasSeasons) {
          this.refreshSeasonData();
        }
        this.updateGraphsInputs();
      },
    );

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

  // --- Navigation ---

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void { this.navigationService.handleKeydown(event); }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void { this.navigationService.handleTouchStart(event); }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void { this.navigationService.handleTouchEnd(event); }

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
    const newFilter: PositionFilter = checked ? ((player.position as PositionFilter) ?? 'F') : 'all';
    this.filterService.updatePlayerFilters({ positionFilter: newFilter });
    this.positionFilter = newFilter;
    this.stats = this.statsService.buildStats(this.data, {
      isGoalie: this.isGoalie,
      statsPerGame: this.statsPerGame,
      positionFilter: this.positionFilter,
      viewContext: this.viewContext,
    });
    if (this.hasSeasons) {
      this.refreshSeasonData();
    }
    this.updateGraphsInputs();
    this.cdr.detectChanges();
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
    // Update season display if already initialized
    if (this.hasSeasons && this.seasonDataSource.length > 0) {
      this.refreshSeasonData();
    }
  }

  private refreshSeasonData(): void {
    const { seasonColumns, seasonDataSource, careerBests } =
      this.seasonsService.setupSeasonData(this.data, {
        isGoalie: this.isGoalie,
        statsPerGame: this.statsPerGame,
        positionFilter: this.positionFilter,
        isMobile: this.isMobile,
      });
    this.seasonColumns = seasonColumns;
    this.seasonDataSource = seasonDataSource;
    this.careerBests = careerBests;
  }

  isCareerBest(column: string, season: number): boolean {
    return this.seasonsService.isCareerBest(this.careerBests, column, season);
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
