import { Column } from './column.types';

const BASE_COLUMNS: Column[] = [
  { field: 'name', align: 'left', initialSortDirection: 'asc' },
  { field: 'score' },
  { field: 'scoreAdjustedByGames' },
  { field: 'games' },
];
// NOTE: 'position' is intentionally NOT in the columns array anymore.
// It is controlled by stats-table's showPositionColumn input.

const COMMON_COLUMNS: Column[] = [
  { field: 'goals' },
  { field: 'assists' },
  { field: 'points' },
  { field: 'penalties' },
  { field: 'ppp' },
  { field: 'shp' },
];
const PLAYER_ONLY_COLUMNS: Column[] = [
  { field: 'plusMinus' },
  { field: 'shots' },
  { field: 'hits' },
  { field: 'blocks' },
];
const GOALIE_ONLY_COLUMNS: Column[] = [{ field: 'wins' }, { field: 'saves' }];
const GOALIE_ONLY_COMBINED_COLUMNS: Column[] = [...GOALIE_ONLY_COLUMNS, { field: 'shutouts' }];
const GOALIE_ONLY_SEASON_COLUMNS: Column[] = [
  ...GOALIE_ONLY_COLUMNS,
  { field: 'gaa', initialSortDirection: 'asc' },
  { field: 'savePercent' },
  { field: 'shutouts' },
];

export const PLAYER_COLUMNS: Column[] = [...BASE_COLUMNS, ...COMMON_COLUMNS, ...PLAYER_ONLY_COLUMNS];
export const GOALIE_COLUMNS: Column[] = [...BASE_COLUMNS, ...GOALIE_ONLY_COMBINED_COLUMNS, ...COMMON_COLUMNS];
export const GOALIE_SEASON_COLUMNS: Column[] = [...BASE_COLUMNS, ...GOALIE_ONLY_SEASON_COLUMNS, ...COMMON_COLUMNS];

const CAREER_COMMON_COLUMNS: Column[] = [
  { field: 'seasonsOwned' },
  { field: 'seasonsPlayedRegular' },
  { field: 'seasonsPlayedPlayoffs' },
  { field: 'teamsOwned' },
  { field: 'teamsPlayedRegular' },
  { field: 'teamsPlayedPlayoffs' },
  { field: 'regularGames' },
  { field: 'playoffGames' },
  { field: 'firstSeason', initialSortDirection: 'asc' },
  { field: 'lastSeason' },
];

export const CAREER_PLAYER_COLUMNS: Column[] = [
  { field: 'name', align: 'left', initialSortDirection: 'asc' },
  ...CAREER_COMMON_COLUMNS,
];

export const CAREER_GOALIE_COLUMNS: Column[] = [
  { field: 'name', align: 'left', initialSortDirection: 'asc' },
  ...CAREER_COMMON_COLUMNS,
];

// These remain string[] because comparison-stats iterates field names only
export const PLAYER_STAT_COLUMNS: string[] = PLAYER_COLUMNS
  .filter(c => c.field !== 'name')
  .map(c => c.field);
export const GOALIE_STAT_COLUMNS: string[] = GOALIE_COLUMNS
  .filter(c => c.field !== 'name')
  .map(c => c.field);
export const GOALIE_SEASON_STAT_COLUMNS: string[] = GOALIE_SEASON_COLUMNS
  .filter(c => c.field !== 'name')
  .map(c => c.field);
