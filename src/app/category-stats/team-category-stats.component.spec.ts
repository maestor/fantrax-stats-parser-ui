import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { TranslateTestingModule } from '@testing/translate-testing';
import {
  ApiService,
  CategoryDashboardResponse,
  CategoryDashboardTeam,
  CategoryDashboardValue,
} from '@services/api.service';
import { SettingsService } from '@services/settings.service';
import { TeamService } from '@services/team.service';
import { FooterVisibilityService } from '@services/footer-visibility.service';
import { TeamCategoryStatsComponent } from './team-category-stats.component';

const categoryValue = (overrides: Partial<CategoryDashboardValue> = {}): CategoryDashboardValue => ({
  total: 0,
  games: 20,
  rate: 0,
  totalRank: 1,
  rateRank: 1,
  totalEligibleTeamCount: 2,
  rateEligibleTeamCount: 2,
  totalMedian: 0,
  rateMedian: 0,
  totalGapToNext: null,
  rateGapToNext: null,
  previous: null,
  ...overrides,
});

const createTeam = (
  teamId: string,
  teamName: string,
  teamAbbr: string,
  goals: CategoryDashboardValue,
): CategoryDashboardTeam => {
  const keys: CategoryDashboardResponse['categories'][number]['key'][] = [
    'goals', 'assists', 'points', 'plusMinus', 'penalties', 'shots', 'ppp', 'shp', 'hits', 'blocks', 'wins', 'saves', 'shutouts',
  ];
  const categories = Object.fromEntries(keys.map((key) => [key, categoryValue({
    games: ['wins', 'saves', 'shutouts'].includes(key) ? 100 : 20,
  })])) as CategoryDashboardTeam['categories'];
  categories['goals'] = goals;
  categories['assists'] = categoryValue({
    total: 30,
    games: 20,
    rate: 1.5,
    totalRank: 1,
    totalMedian: 25,
    previous: {
      total: 10,
      games: 10,
      rate: 1,
      totalRank: 2,
      rateRank: 2,
      totalEligibleTeamCount: 2,
      rateEligibleTeamCount: 2,
      totalChange: 20,
      rateChange: 0.5,
      totalRankChange: 1,
      rateRankChange: 1,
    },
  });
  categories['plusMinus'] = categoryValue({ total: -3, games: 20, rate: -0.15 });
  categories['wins'] = categoryValue({ total: 50, games: 100, rate: 0.5 });
  return {
    teamId,
    teamName,
    teamAbbr,
    participation: 'reported',
    skaterGames: 20,
    goalieGames: 100,
    categories,
    players: [{
      id: `${teamId}-player`, name: `${teamName} Player`, position: 'F', games: 20,
      goals: teamId === '1' ? 10 : 12, assists: 0, points: 0, plusMinus: -3,
      penalties: 0, shots: 0, ppp: 0, shp: 0, hits: 0, blocks: 0,
    }],
    goalies: [{
      id: `${teamId}-goalie`, name: `${teamName} Goalie`, games: 100, wins: 50, saves: 900, shutouts: 5,
    }],
  };
};

const createDashboard = (season = 2025): CategoryDashboardResponse => ({
  season,
  scope: 'regular',
  availableSeasons: [2025, 2024],
  lastModified: '2026-09-20T12:00:00.000Z',
  seasonHasCreditedGames: true,
  coverage: {
    status: 'partial', expectedTeamCount: 30, participatingTeamCount: 2,
    reportedTeamCount: 2, missingReportTeamIds: ['3'], unknownTeamIds: [],
  },
  categories: [
    ...(['goals', 'assists', 'points', 'plusMinus', 'penalties', 'shots', 'ppp', 'shp', 'hits', 'blocks'] as const)
      .map((key) => ({ key, group: 'skater' as const, higherIsBetter: true })),
    ...(['wins', 'saves', 'shutouts'] as const)
      .map((key) => ({ key, group: 'goalie' as const, higherIsBetter: true })),
  ],
  teams: [
    createTeam('1', 'Colorado Avalanche', 'COL', categoryValue({
      total: 10, games: 20, rate: 0.5, totalRank: 2, rateRank: 1,
      totalMedian: 11.5, rateMedian: 0.4, totalGapToNext: 2, rateGapToNext: null,
      previous: {
        total: 30, games: 10, rate: 3, totalRank: 1, rateRank: 1,
        totalEligibleTeamCount: 2, rateEligibleTeamCount: 2,
        totalChange: -20, rateChange: -2.5, totalRankChange: -1, rateRankChange: 0,
      },
    })),
    createTeam('2', 'Carolina Hurricanes', 'CAR', categoryValue({
      total: 12, games: 40, rate: 0.3, totalRank: 1, rateRank: 2,
      totalMedian: 11, rateMedian: 0.4, totalGapToNext: null, rateGapToNext: 0.2,
    })),
  ],
});

describe('TeamCategoryStatsComponent', () => {
  async function setup(options: { getCategoryDashboard?: ReturnType<typeof vi.fn> } = {}) {
    localStorage.setItem('fantrax.settings', JSON.stringify({
      selectedTeamId: '1', startFromSeason: null, season: 2012, reportType: 'playoffs',
      disableSelectedTeamHighlight: false,
    }));
    const getCategoryDashboard = options.getCategoryDashboard
      ?? vi.fn((season?: number) => of(createDashboard(season ?? 2025)));
    const markReady = vi.fn();
    await render(TeamCategoryStatsComponent, {
      imports: [TranslateTestingModule],
      providers: [
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
        { provide: ApiService, useValue: { getCategoryDashboard } },
        { provide: FooterVisibilityService, useValue: { currentCycle: () => 3, markReady } },
        { provide: MatDialog, useValue: { open: vi.fn() } },
      ],
    });
    return {
      getCategoryDashboard,
      markReady,
      settingsService: TestBed.inject(SettingsService),
      teamService: TestBed.inject(TeamService),
    };
  }

  it('uses the resolved regular season without changing shared stats filters', async () => {
    const { getCategoryDashboard, settingsService, markReady } = await setup();
    expect(getCategoryDashboard).toHaveBeenCalledOnce();
    expect(getCategoryDashboard).toHaveBeenCalledWith(undefined);
    expect(settingsService.season).toBe(2012);
    expect(settingsService.reportType).toBe('playoffs');
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.queryByText('Colorado Avalanche')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'categoryStats.seasonLabel' })).toHaveTextContent('2025–26');
    expect(screen.getByRole('table')).toBeInTheDocument();
    const disclaimer = screen.getByText((_, element) => element?.tagName === 'P'
      && Boolean(element.textContent?.includes('categoryStats.regularSeasonDisclaimer')));
    expect(disclaimer).toHaveTextContent('categoryStats.regularSeasonDisclaimer');
    expect(disclaimer).toHaveTextContent('categoryStats.goalieRateDisclaimer');
    expect(screen.getByText('categoryStats.coveragePartial')).toBeInTheDocument();
    expect(markReady).toHaveBeenCalledWith(3);
  });

  it('switches comparison using Material controls and follows shared team selection', async () => {
    const { getCategoryDashboard, teamService } = await setup();
    const table = await screen.findByRole('table');
    const comparison = screen.getByRole('combobox', { name: 'categoryStats.comparisonLabel' });
    fireEvent.click(comparison);
    fireEvent.click(await screen.findByRole('option', { name: 'Carolina Hurricanes' }));
    expect(table).toHaveTextContent('12 (−2)');
    expect(screen.getByRole('columnheader', { name: 'tableColumnShort.comparison (CAR)' })).toBeInTheDocument();
    expect(table).not.toHaveTextContent('CAR:');
    expect(table.querySelector('td.mat-column-comparison .stats-table-delta-negative')).toHaveTextContent('−2');

    teamService.setTeamId('2');
    await waitFor(() => expect(table).not.toHaveTextContent('CAR:'));
    expect(table).toHaveTextContent('12');
    expect(getCategoryDashboard).toHaveBeenCalledOnce();
  });

  it('changes only the local Material season selector', async () => {
    const getCategoryDashboard = vi.fn((season?: number) => of(createDashboard(season ?? 2025)));
    const { settingsService } = await setup({ getCategoryDashboard });
    const seasonSelect = await screen.findByRole('combobox', { name: 'categoryStats.seasonLabel' });
    fireEvent.click(seasonSelect);
    fireEvent.click(await screen.findByRole('option', { name: '2024–25' }));
    expect(getCategoryDashboard).toHaveBeenNthCalledWith(2, 2024);
    expect(settingsService.season).toBe(2012);
    expect(settingsService.reportType).toBe('playoffs');
  });

  it('combines prior-season total and rank changes into their current values', async () => {
    await setup();
    const table = await screen.findByRole('table');
    expect(table).toHaveTextContent('10 (−20)');
    expect(table).toHaveTextContent('12 (−2)');
    expect(table).toHaveTextContent('2. (−1)');
    expect(screen.getAllByRole('columnheader')).toHaveLength(4);
    const goalsAmount = table.querySelector('td.mat-column-value')!;
    expect(goalsAmount).not.toHaveClass('stats-table-delta-negative');
    expect(goalsAmount.querySelector('.stats-table-delta-negative')).toHaveTextContent('−20');
    const assistsRow = document.querySelector('tr[data-row-key="assists"]')!;
    expect(assistsRow.querySelector('td.mat-column-value .stats-table-delta-positive')).toHaveTextContent('+20');
    expect(assistsRow.querySelector('td.mat-column-median .stats-table-delta-positive')).toHaveTextContent('+5');
    const goalRow = Array.from(document.querySelectorAll<HTMLElement>('tr[mat-row][data-row-index]'))
      .find((row) => row.textContent?.includes('tableColumn.goals'))!;
    goalRow.focus();
    fireEvent.keyDown(goalRow, { key: 'Enter' });
    expect(goalRow).toHaveAttribute('aria-expanded', 'true');
    expect(await screen.findByText('Colorado Avalanche Player')).toBeInTheDocument();
    expect(document.querySelector('.expanded-season-primary')).toHaveTextContent('10');
    expect(screen.getByText('100 %')).toBeInTheDocument();
  });

  it('shows the empty state for categories without contributors and expands goalie contributions', async () => {
    await setup();
    await screen.findByRole('table');

    const blocksRow = document.querySelector<HTMLElement>('tr[data-row-key="blocks"]')!;
    blocksRow.focus();
    fireEvent.keyDown(blocksRow, { key: 'Enter' });
    expect(await screen.findByText('categoryStats.noContributions')).toBeInTheDocument();

    fireEvent.keyDown(blocksRow, { key: 'Enter' });
    const winsRow = document.querySelector<HTMLElement>('tr[data-row-key="wins"]')!;
    winsRow.focus();
    fireEvent.keyDown(winsRow, { key: 'Enter' });
    expect(await screen.findByText('Colorado Avalanche Goalie')).toBeInTheDocument();
  });

  it('reports unknown coverage and an unavailable team when the selected team has no dashboard row', async () => {
    const dashboard = createDashboard();
    dashboard.coverage.status = 'unknown';
    const { teamService } = await setup({ getCategoryDashboard: vi.fn(() => of(dashboard)) });
    await screen.findByRole('table');

    teamService.setTeamId('unavailable');
    expect(await screen.findByText('categoryStats.coverageUnknown')).toBeInTheDocument();
    expect(screen.getByText('categoryStats.teamUnavailable')).toBeInTheDocument();
  });

  it('shows a retryable error and recovers on retry', async () => {
    const getCategoryDashboard = vi.fn()
      .mockReturnValueOnce(throwError(() => new Error('unavailable')))
      .mockReturnValueOnce(of(createDashboard()));
    await setup({ getCategoryDashboard });
    expect(await screen.findByRole('alert')).toHaveTextContent('categoryStats.apiUnavailable');
    fireEvent.click(screen.getByRole('button', { name: 'categoryStats.retry' }));
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(getCategoryDashboard).toHaveBeenCalledTimes(2);
  });

  it('announces loading until the regular season response arrives', async () => {
    const pending = new Subject<CategoryDashboardResponse>();
    await setup({ getCategoryDashboard: vi.fn(() => pending.asObservable()) });
    expect(screen.getByRole('status')).toHaveTextContent('categoryStats.loading');
    pending.next(createDashboard());
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });

  it('shows a missing-report state for a team without imported regular stats', async () => {
    const missing = createDashboard();
    missing.teams[0].participation = 'missing-report';
    await setup({ getCategoryDashboard: vi.fn(() => of(missing)) });
    expect(await screen.findByText('categoryStats.missingReport')).toBeInTheDocument();
  });

  it('shows a no-credited-games state when the selected team has zero exposure', async () => {
    const zeroGames = createDashboard();
    zeroGames.teams[0].skaterGames = 0;
    zeroGames.teams[0].goalieGames = 0;
    await setup({ getCategoryDashboard: vi.fn(() => of(zeroGames)) });
    expect(await screen.findByText('categoryStats.noCreditedGames')).toBeInTheDocument();
  });

  it('shows an empty state when no regular-season rows are available', async () => {
    const noSeasons = createDashboard();
    noSeasons.availableSeasons = [];
    await setup({ getCategoryDashboard: vi.fn(() => of(noSeasons)) });
    expect(await screen.findByText('categoryStats.noSeasons')).toBeInTheDocument();
  });
});
