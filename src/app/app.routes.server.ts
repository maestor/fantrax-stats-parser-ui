import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'player-stats',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'goalie-stats',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'career',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'career/players',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'career/goalies',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'career/highlights',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'draft',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'draft/entry-drafts',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'draft/opening-draft',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'draft/statistics',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'leaderboards',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'leaderboards/regular',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'leaderboards/playoffs',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'leaderboards/transactions',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'player/:teamSlug/:playerSlug/:season',
    renderMode: RenderMode.Client,
  },
  {
    path: 'player/:teamSlug/:playerSlug',
    renderMode: RenderMode.Client,
  },
  {
    path: 'goalie/:teamSlug/:goalieSlug/:season',
    renderMode: RenderMode.Client,
  },
  {
    path: 'goalie/:teamSlug/:goalieSlug',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
