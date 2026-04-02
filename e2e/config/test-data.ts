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
  REPORT_TYPE: fi('reportType.selector'),
  REPORT_TYPE_REGULAR: fi('reportType.regular'),
  REPORT_TYPE_PLAYOFFS: fi('reportType.playoffs'),
  STATS_PER_GAME: fi('statsModeToggle'),
  MIN_GAMES: fi('minGamesSlider.label'),
  POSITION_ALL: fi('positionFilter.all'),
  POSITION_FORWARDS: fi('positionFilter.forwards'),
  POSITION_DEFENSE: fi('positionFilter.defensemen'),
};

export const A11Y_LABELS = {
  OPEN_SETTINGS_DRAWER: fi('a11y.openSettingsDrawer'),
  CLOSE_SETTINGS_DRAWER: fi('a11y.closeSettingsDrawer'),
  OPEN_NAV_MENU: fi('a11y.openNavMenu'),
};

export const SEARCH_LABELS = {
  PLAYER: fi('table.playerSearch'),
  CAREER_PLAYER: fi('table.careerPlayerSearch'),
};

export const ROUTE_LABELS = {
  PLAYER_STATS: fi('nav.hockeyPlayerStats'),
  PLAYER_CAREERS: fi('nav.playerCareers'),
};

export const TAB_LABELS = {
  PLAYERS: fi('link.playerStats'),
  GOALIES: fi('link.goalieStats'),
  CAREER_PLAYERS: fi('career.tabs.players'),
  CAREER_GOALIES: fi('career.tabs.goalies'),
  CAREER_HIGHLIGHTS: fi('career.tabs.highlights'),
  DRAFT_ENTRY_DRAFTS: fi('draft.tabs.entryDrafts'),
  DRAFT_OPENING_DRAFT: fi('draft.tabs.openingDraft'),
  DRAFT_STATISTICS: fi('draft.tabs.statistics'),
  PLAYER_CARD_STATS: fi('playerCard.all'),
  PLAYER_CARD_BY_SEASON: fi('playerCard.bySeason'),
  PLAYER_CARD_GRAPHS: fi('playerCard.graphs'),
  LEADERBOARD_REGULAR: fi('leaderboards.tabs.regular'),
  LEADERBOARD_PLAYOFFS: fi('leaderboards.tabs.playoffs'),
  LEADERBOARD_TRANSACTIONS: fi('leaderboards.tabs.transactions'),
};

export const CAREER_HIGHLIGHT_SECTION_LABELS = {
  ACHIEVEMENTS: fi('career.highlights.sections.achievements.title'),
  JOURNEYS: fi('career.highlights.sections.journeys.title'),
  LONG_STAYS: fi('career.highlights.sections.longStays.title'),
  TRANSACTIONS: fi('career.highlights.sections.transactions.title'),
};

export const CAREER_HIGHLIGHT_CARD_LABELS = {
  MOST_TRADES: fi('career.highlights.cards.mostTrades.title'),
  MOST_CLAIMS: fi('career.highlights.cards.mostClaims.title'),
  MOST_DROPS: fi('career.highlights.cards.mostDrops.title'),
  REUNION_KING: fi('career.highlights.cards.reunionKing.title'),
};

export const NAV_LABELS = {
  PLAYER_CAREERS: fi('nav.playerCareers'),
  DRAFTS: fi('nav.drafts'),
};

export const LEADERBOARD_LABELS = {
  REGULAR: fi('leaderboards.tabs.regular'),
  PLAYOFFS: fi('leaderboards.tabs.playoffs'),
  TRANSACTIONS: fi('leaderboards.tabs.transactions'),
};
