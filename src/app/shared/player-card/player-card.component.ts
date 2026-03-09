import { DOCUMENT, NgComponentOutlet } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  Type,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { fromEvent, take } from 'rxjs';
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
  host: {
    '(keydown)': 'onKeydown($event)',
    '(touchstart)': 'onTouchStart($event)',
    '(touchend)': 'onTouchEnd($event)',
  },
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
export class PlayerCardComponent implements AfterViewInit {
  readonly dialogRef = inject(MatDialogRef<PlayerCardComponent>);
  private readonly rawDialogData = inject<Player | Goalie | PlayerCardDialogData>(MAT_DIALOG_DATA);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly apiService = inject(ApiService);
  private readonly teamService = inject(TeamService);
  private readonly filterService = inject(FilterService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly statsService = inject(PlayerCardStatsService);
  private readonly seasonsService = inject(PlayerCardSeasonsService);
  readonly navigationService = inject(PlayerCardNavigationService);

  @ViewChild('closeButton', { read: ElementRef })
  closeButton?: ElementRef<HTMLButtonElement>;

  private readonly initialData = this.unwrapDialogData(this.rawDialogData);
  private readonly dataState = signal<Player | Goalie>(this.initialData);
  private readonly positionFilterState = signal<PositionFilter>('all');
  private readonly statsPerGameState = signal(false);
  private readonly selectedTeamState = signal<Team | undefined>(undefined);
  private readonly isMobileState = signal(false);
  private readonly filtersHydratedState = signal(false);
  private readonly closeButtonElementState = signal<HTMLButtonElement | undefined>(undefined);

  private readonly isGoalieState = computed(() => 'wins' in this.dataState());
  private readonly hasSeasonsState = computed(() => Boolean(this.dataState().seasons?.length));
  private readonly viewContextState = computed<'combined' | 'season'>(() =>
    this.hasSeasonsState() ? 'combined' : 'season',
  );
  private readonly showGraphsTabState = computed(() => {
    const data = this.dataState();
    const seasons = data.seasons ?? [];

    return seasons.length > 1 || (seasons.length === 0 && Boolean(data.scores));
  });

  readonly initialTab: PlayerCardTab | undefined = this.isWrappedData(this.rawDialogData)
    ? this.rawDialogData.initialTab
    : undefined;

  readonly navigationContext = this.isWrappedData(this.rawDialogData)
    ? this.rawDialogData.navigationContext
    : undefined;

  readonly graphsInputs = computed<Record<string, unknown>>(() => ({
    data: this.dataState(),
    viewContext: this.viewContextState(),
    positionFilter: this.positionFilterState(),
    closeButtonEl: this.closeButtonElementState(),
    requestFocusTabHeader: () => this.focusActiveTabHeader(),
  }));

  linkCopied = false;
  selectedTabIndex = 0;
  stats: StatRow[] = [];
  displayedColumns: string[] = ['label', 'value'];
  seasonColumns: string[] = [];
  seasonDataSource: (PlayerSeasonStats | GoalieSeasonStats)[] = [];
  careerBests: Map<string, Set<number>> = new Map();
  graphsComponent: Type<unknown> | null = null;
  graphsLoading = false;
  graphsLoadPromise: Promise<void> | null = null;

  constructor() {
    this.checkScreenSize();

    const defaultView = this.document.defaultView;
    if (defaultView) {
      fromEvent(defaultView, 'resize')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.checkScreenSize());
    }

    this.apiService.getTeams()
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((teams) => {
        this.selectedTeamState.set(teams.find((t) => t.id === this.teamService.selectedTeamId));
      });

    const filterObservable = this.isGoalie
      ? this.filterService.goalieFilters$
      : this.filterService.playerFilters$;

    filterObservable
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((filters) => {
        this.statsPerGameState.set(filters.statsPerGame);
        if (!this.isGoalie) {
          this.positionFilterState.set(filters.positionFilter);
        }
        this.filtersHydratedState.set(true);
      });

    effect(() => {
      if (!this.filtersHydratedState()) {
        return;
      }

      this.stats = this.statsService.buildStats(this.dataState(), {
        isGoalie: this.isGoalieState(),
        statsPerGame: this.statsPerGameState(),
        positionFilter: this.positionFilterState(),
        viewContext: this.viewContextState(),
      });
    });

    effect(() => {
      if (!this.filtersHydratedState()) {
        return;
      }

      if (!this.hasSeasonsState()) {
        this.seasonColumns = [];
        this.seasonDataSource = [];
        this.careerBests = new Map();
        return;
      }

      const { seasonColumns, seasonDataSource, careerBests } =
        this.seasonsService.setupSeasonData(this.dataState(), {
          isGoalie: this.isGoalieState(),
          statsPerGame: this.statsPerGameState(),
          positionFilter: this.positionFilterState(),
          isMobile: this.isMobileState(),
        });

      this.seasonColumns = seasonColumns;
      this.seasonDataSource = seasonDataSource;
      this.careerBests = careerBests;
    });

    this.navigationService.init(
      this.navigationContext,
      this.host,
      this.cdr,
      (player) => {
        this.dataState.set(player);
      },
    );

    if (this.initialTab) {
      this.selectedTabIndex = this.getTabIndexFromName(this.initialTab);
      const graphsTabIndex = this.hasSeasons ? 2 : 1;
      if (this.selectedTabIndex === graphsTabIndex && this.showGraphsTab) {
        this.graphsLoadPromise = this.ensureGraphsLoaded();
        void this.graphsLoadPromise;
      }
    }
  }

  ngAfterViewInit(): void {
    this.closeButtonElementState.set(this.closeButton?.nativeElement);
  }

  get data(): Player | Goalie {
    return this.dataState();
  }

  get positionFilter(): PositionFilter {
    return this.positionFilterState();
  }

  get statsPerGame(): boolean {
    return this.statsPerGameState();
  }

  get selectedTeam(): Team | undefined {
    return this.selectedTeamState();
  }

  get isMobile(): boolean {
    return this.isMobileState();
  }

  get isGoalie(): boolean {
    return this.isGoalieState();
  }

  get hasSeasons(): boolean {
    return this.hasSeasonsState();
  }

  get viewContext(): 'combined' | 'season' {
    return this.viewContextState();
  }

  get showGraphsTab(): boolean {
    return this.showGraphsTabState();
  }

  onKeydown(event: KeyboardEvent): void { this.navigationService.handleKeydown(event); }

  onTouchStart(event: TouchEvent): void { this.navigationService.handleTouchStart(event); }

  onTouchEnd(event: TouchEvent): void { this.navigationService.handleTouchEnd(event); }

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

  get positionSwitchLabel(): string {
    if (this.isGoalie) return '';
    const player = this.data as Player;
    return player.position === 'D'
      ? 'playerCardPositionFilter.defensemen'
      : 'playerCardPositionFilter.forwards';
  }

  get isPositionFilterEnabled(): boolean {
    return this.positionFilter !== 'all';
  }

  onPositionFilterToggle(checked: boolean): void {
    if (this.isGoalie) return;
    const player = this.data as Player;
    const newFilter: PositionFilter = checked ? ((player.position as PositionFilter) ?? 'F') : 'all';
    this.filterService.updatePlayerFilters({ positionFilter: newFilter });
    this.positionFilterState.set(newFilter);
  }

  isCareerBest(column: string, season: number): boolean {
    return this.seasonsService.isCareerBest(this.careerBests, column, season);
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;

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

    const season = (this.data as { season?: number }).season;
    const seasonPath = season !== undefined ? `/${season}` : '';

    const tabName = this.getCurrentTabName();
    const queryString = tabName !== 'all' ? `?tab=${tabName}` : '';

    const url = `${this.document.location.origin}/${type}/${teamSlug}/${playerSlug}${seasonPath}${queryString}`;

    navigator.clipboard.writeText(url).then(() => {
      this.linkCopied = true;
      tooltip?.show();
      setTimeout(() => {
        this.linkCopied = false;
        tooltip?.hide();
      }, 2000);
    });
  }

  private isWrappedData(data: Player | Goalie | PlayerCardDialogData): data is PlayerCardDialogData {
    return 'player' in data && (data as PlayerCardDialogData).player !== undefined;
  }

  private unwrapDialogData(data: Player | Goalie | PlayerCardDialogData): Player | Goalie {
    return this.isWrappedData(data) ? data.player : data;
  }

  private getTabIndexFromName(tabName: PlayerCardTab): number {
    switch (tabName) {
      case 'all':
        return 0;
      case 'by-season':
        return this.hasSeasons ? 1 : 0;
      case 'graphs':
        if (!this.showGraphsTab) return 0;
        return this.hasSeasons ? 2 : 1;
      default:
        return 0;
    }
  }

  private checkScreenSize(): void {
    const viewportWidth = this.document.defaultView?.innerWidth ?? 1024;
    this.isMobileState.set(viewportWidth <= 768);
  }

  private getCurrentTabName(): PlayerCardTab {
    if (this.hasSeasons) {
      switch (this.selectedTabIndex) {
        case 1: return 'by-season';
        case 2: return 'graphs';
        default: return 'all';
      }
    }

    return this.selectedTabIndex === 1 ? 'graphs' : 'all';
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

  private focusActiveTabHeader(): void {
    const root = this.host.nativeElement;
    const activeTab = root.querySelector(
      '.mat-mdc-tab-header .mdc-tab--active',
    ) as HTMLElement | null;

    if (activeTab) {
      activeTab.focus();
      return;
    }

    const anyTabHeader = this.document.querySelector(
      '.mat-mdc-tab-header .mdc-tab',
    ) as HTMLElement | null;
    anyTabHeader?.focus();
  }
}
