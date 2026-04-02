import { StatsContext } from '@shared/types/context.types';

export type RootRouteGroup =
  | 'player-stats'
  | 'goalie-stats'
  | 'leaderboards'
  | 'career'
  | 'draft';

export type SettingsDrawerMode = 'default' | 'team' | 'stats';

export type SettingsDrawerRouteConfig = {
  mode: SettingsDrawerMode;
  statsContext?: StatsContext;
};

type RouteGroupDefinition = {
  exactPaths?: string[];
  prefixes?: string[];
  dashboardControlsContext?: StatsContext;
  settingsDrawerRouteConfig: SettingsDrawerRouteConfig;
};

const routeGroupDefinitions: Record<RootRouteGroup, RouteGroupDefinition> = {
  'player-stats': {
    exactPaths: ['/'],
    prefixes: ['/player-stats', '/player/'],
    dashboardControlsContext: 'player',
    settingsDrawerRouteConfig: {
      mode: 'stats',
      statsContext: 'player',
    },
  },
  'goalie-stats': {
    prefixes: ['/goalie-stats', '/goalie/'],
    dashboardControlsContext: 'goalie',
    settingsDrawerRouteConfig: {
      mode: 'stats',
      statsContext: 'goalie',
    },
  },
  leaderboards: {
    prefixes: ['/leaderboards'],
    settingsDrawerRouteConfig: { mode: 'team' },
  },
  career: {
    prefixes: ['/career'],
    settingsDrawerRouteConfig: { mode: 'default' },
  },
  draft: {
    prefixes: ['/draft'],
    settingsDrawerRouteConfig: { mode: 'team' },
  },
};

const routeGroupResolutionOrder: RootRouteGroup[] = [
  'goalie-stats',
  'player-stats',
  'leaderboards',
  'career',
  'draft',
];

function normalizeUrl(url: string): string {
  const normalizedUrl = url.split('?')[0]?.split('#')[0] ?? '/';
  return normalizedUrl || '/';
}

function matchesRouteGroup(normalizedUrl: string, routeGroup: RootRouteGroup): boolean {
  const { exactPaths = [], prefixes = [] } = routeGroupDefinitions[routeGroup];

  return exactPaths.includes(normalizedUrl)
    || prefixes.some((prefix) => normalizedUrl.startsWith(prefix));
}

export function resolveRootRouteGroup(url: string): RootRouteGroup {
  const normalizedUrl = normalizeUrl(url);

  for (const routeGroup of routeGroupResolutionOrder) {
    if (matchesRouteGroup(normalizedUrl, routeGroup)) {
      return routeGroup;
    }
  }

  return 'player-stats';
}

export function getSettingsDrawerRouteConfig(routeGroup: RootRouteGroup): SettingsDrawerRouteConfig {
  return { ...routeGroupDefinitions[routeGroup].settingsDrawerRouteConfig };
}

export function buildSettingsDrawerRouteConfig(url: string): SettingsDrawerRouteConfig {
  return getSettingsDrawerRouteConfig(resolveRootRouteGroup(url));
}

export function getDashboardControlsContext(routeGroup: RootRouteGroup): StatsContext {
  return routeGroupDefinitions[routeGroup].dashboardControlsContext ?? 'player';
}
