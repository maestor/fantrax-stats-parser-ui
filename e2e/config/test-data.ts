/**
 * Shared test constants and configuration
 */

import { fi } from './i18n';

export const DEFAULT_TEAM = 'Colorado Avalanche';

export const MOBILE_VIEWPORT = {
  width: 390,
  height: 844,
};

export const DESKTOP_VIEWPORT = {
  width: 1280,
  height: 720,
};

export const WAIT_TIMEOUT = 10000;

export const FILTER_LABELS = {
  TEAM: fi('team.selector'),
  SEASON: fi('season.selector'),
  START_FROM: fi('startFromSeason.selector'),
  REPORT_TYPE_REGULAR: fi('reportType.regular'),
  REPORT_TYPE_PLAYOFFS: fi('reportType.playoffs'),
  STATS_PER_GAME: fi('statsModeToggle'),
  MIN_GAMES: fi('minGamesSlider.label'),
  POSITION_ALL: fi('positionFilter.all'),
  POSITION_FORWARDS: fi('positionFilter.forwards'),
  POSITION_DEFENSE: fi('positionFilter.defensemen'),
};

export const TAB_LABELS = {
  PLAYERS: fi('link.playerStats'),
  GOALIES: fi('link.goalieStats'),
  CAREER_PLAYERS: fi('career.tabs.players'),
  CAREER_GOALIES: fi('career.tabs.goalies'),
  CAREER_HIGHLIGHTS: fi('career.tabs.highlights'),
  PLAYER_CARD_STATS: fi('playerCard.all'),
  PLAYER_CARD_BY_SEASON: fi('playerCard.bySeason'),
  PLAYER_CARD_GRAPHS: fi('playerCard.graphs'),
  LEADERBOARD_REGULAR: fi('leaderboards.tabs.regular'),
  LEADERBOARD_PLAYOFFS: fi('leaderboards.tabs.playoffs'),
  LEADERBOARD_TRANSACTIONS: fi('leaderboards.tabs.transactions'),
};

export const CAREER_HIGHLIGHT_SECTION_LABELS = {
  GENERAL: fi('career.highlights.sections.general'),
  TRANSACTIONS: fi('career.highlights.sections.transactions'),
};

export const CAREER_HIGHLIGHT_CARD_LABELS = {
  MOST_TRADES: fi('career.highlights.cards.mostTrades.title'),
  MOST_CLAIMS: fi('career.highlights.cards.mostClaims.title'),
  MOST_DROPS: fi('career.highlights.cards.mostDrops.title'),
  REUNION_KING: fi('career.highlights.cards.reunionKing.title'),
};

export const NAV_LABELS = {
  PLAYER_CAREERS: fi('nav.playerCareers'),
};

export const LEADERBOARD_LABELS = {
  REGULAR: fi('leaderboards.tabs.regular'),
  PLAYOFFS: fi('leaderboards.tabs.playoffs'),
  TRANSACTIONS: fi('leaderboards.tabs.transactions'),
};
