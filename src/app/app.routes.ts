import { Routes } from '@angular/router';
import { RouteSeoData } from '@shared/utils/seo.utils';

const careerSeo: RouteSeoData = {
  sectionKey: 'nav.playerCareers',
};

const leaderboardsSeo: RouteSeoData = {
  sectionKey: 'nav.leaderboards',
};

const draftSeo: RouteSeoData = {
  sectionKey: 'nav.drafts',
};

const playerStatsSeo: RouteSeoData = {
  sectionKey: 'nav.hockeyPlayerStats',
  tabKey: 'link.playerStats',
};

const goalieStatsSeo: RouteSeoData = {
  sectionKey: 'nav.hockeyPlayerStats',
  tabKey: 'link.goalieStats',
};

export const routes: Routes = [
  {
    path: 'leaderboards',
    data: {
      seo: leaderboardsSeo,
    },
    loadComponent: () =>
      import('./leaderboards/leaderboards.component').then(
        (m) => m.LeaderboardsComponent
      ),
    children: [
      {
        path: '',
        redirectTo: 'regular',
        pathMatch: 'full',
      },
      {
        path: 'regular',
        data: {
          seo: {
            tabKey: 'leaderboards.tabs.regular',
          } satisfies RouteSeoData,
        },
        loadComponent: () =>
          import('./leaderboards/regular/leaderboard-regular.component').then(
            (m) => m.LeaderboardRegularComponent
          ),
      },
      {
        path: 'playoffs',
        data: {
          seo: {
            tabKey: 'leaderboards.tabs.playoffs',
          } satisfies RouteSeoData,
        },
        loadComponent: () =>
          import('./leaderboards/playoffs/leaderboard-playoffs.component').then(
            (m) => m.LeaderboardPlayoffsComponent
          ),
      },
      {
        path: 'transactions',
        data: {
          seo: {
            tabKey: 'leaderboards.tabs.transactions',
          } satisfies RouteSeoData,
        },
        loadComponent: () =>
          import('./leaderboards/transactions/leaderboard-transactions.component').then(
            (m) => m.LeaderboardTransactionsComponent
          ),
      },
    ],
  },
  {
    path: 'career',
    data: {
      seo: careerSeo,
    },
    loadComponent: () => import('./career/career.component').then((m) => m.CareerComponent),
    children: [
      {
        path: '',
        redirectTo: 'players',
        pathMatch: 'full',
      },
      {
        path: 'players',
        data: {
          seo: {
            tabKey: 'career.tabs.players',
          } satisfies RouteSeoData,
        },
        loadComponent: () =>
          import('./career/players/career-players.component').then(
            (m) => m.CareerPlayersComponent
          ),
      },
      {
        path: 'goalies',
        data: {
          seo: {
            tabKey: 'career.tabs.goalies',
          } satisfies RouteSeoData,
        },
        loadComponent: () =>
          import('./career/goalies/career-goalies.component').then(
            (m) => m.CareerGoaliesComponent
          ),
      },
      {
        path: 'highlights',
        data: {
          seo: {
            tabKey: 'career.tabs.highlights',
          } satisfies RouteSeoData,
        },
        loadComponent: () =>
          import('./career/highlights/career-highlights.component').then(
            (m) => m.CareerHighlightsComponent
          ),
      },
    ],
  },
  {
    path: 'draft',
    data: {
      seo: draftSeo,
    },
    loadComponent: () => import('./draft/draft.component').then((m) => m.DraftComponent),
    children: [
      {
        path: '',
        redirectTo: 'entry-drafts',
        pathMatch: 'full',
      },
      {
        path: 'entry-drafts',
        data: {
          seo: {
            tabKey: 'draft.tabs.entryDrafts',
          } satisfies RouteSeoData,
        },
        loadComponent: () =>
          import('./draft/entry-drafts/entry-drafts.component').then(
            (m) => m.EntryDraftsComponent
          ),
      },
      {
        path: 'opening-draft',
        data: {
          seo: {
            tabKey: 'draft.tabs.openingDraft',
          } satisfies RouteSeoData,
        },
        loadComponent: () =>
          import('./draft/opening-draft/opening-draft.component').then(
            (m) => m.OpeningDraftComponent
          ),
      },
      {
        path: 'statistics',
        data: {
          seo: {
            tabKey: 'draft.tabs.statistics',
          } satisfies RouteSeoData,
        },
        loadComponent: () =>
          import('./draft/statistics/draft-statistics.component').then(
            (m) => m.DraftStatisticsComponent
          ),
      },
    ],
  },
  {
    path: '',
    loadComponent: () =>
      import('./dashboard-shell/dashboard-shell.component').then(
        (m) => m.DashboardShellComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./player-stats/player-stats.component').then(
            (m) => m.PlayerStatsComponent
          ),
        pathMatch: 'full',
      },
      {
        path: 'player-stats',
        data: {
          seo: playerStatsSeo,
        },
        loadComponent: () =>
          import('./player-stats/player-stats.component').then(
            (m) => m.PlayerStatsComponent
          ),
      },
      {
        path: 'goalie-stats',
        data: {
          seo: goalieStatsSeo,
        },
        loadComponent: () =>
          import('./goalie-stats/goalie-stats.component').then(
            (m) => m.GoalieStatsComponent
          ),
      },
      {
        path: 'player/:teamSlug/:playerSlug/:season',
        data: {
          seo: playerStatsSeo,
        },
        loadComponent: () =>
          import('./player-route/player-route.component').then(
            (m) => m.PlayerRouteComponent
          ),
      },
      {
        path: 'player/:teamSlug/:playerSlug',
        data: {
          seo: playerStatsSeo,
        },
        loadComponent: () =>
          import('./player-route/player-route.component').then(
            (m) => m.PlayerRouteComponent
          ),
      },
      {
        path: 'goalie/:teamSlug/:goalieSlug/:season',
        data: {
          seo: goalieStatsSeo,
        },
        loadComponent: () =>
          import('./goalie-route/goalie-route.component').then(
            (m) => m.GoalieRouteComponent
          ),
      },
      {
        path: 'goalie/:teamSlug/:goalieSlug',
        data: {
          seo: goalieStatsSeo,
        },
        loadComponent: () =>
          import('./goalie-route/goalie-route.component').then(
            (m) => m.GoalieRouteComponent
          ),
      },
      {
        path: '**',
        redirectTo: '',
        pathMatch: 'full',
      },
    ],
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
