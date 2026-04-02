import { StatsContext } from '@shared/types/context.types';

export type SettingsDrawerMode = 'default' | 'draft' | 'stats';

export type SettingsDrawerRouteConfig = {
  mode: SettingsDrawerMode;
  statsContext?: StatsContext;
};

export function buildSettingsDrawerRouteConfig(url: string): SettingsDrawerRouteConfig {
  const normalizedUrl = url.split('?')[0]?.split('#')[0] ?? '/';

  if (
    normalizedUrl.startsWith('/goalie-stats')
    || normalizedUrl.startsWith('/goalie/')
  ) {
    return {
      mode: 'stats',
      statsContext: 'goalie',
    };
  }

  if (
    normalizedUrl === '/'
    || normalizedUrl.startsWith('/player-stats')
    || normalizedUrl.startsWith('/player/')
  ) {
    return {
      mode: 'stats',
      statsContext: 'player',
    };
  }

  if (normalizedUrl.startsWith('/draft')) {
    return { mode: 'draft' };
  }

  return { mode: 'default' };
}
