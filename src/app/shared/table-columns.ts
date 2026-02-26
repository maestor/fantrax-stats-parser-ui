import { Column } from './column.types';

const BASE_COLUMNS: Column[] = [
  { field: 'name' },
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
  { field: 'gaa' },
  { field: 'savePercent' },
  { field: 'shutouts' },
];

export const PLAYER_COLUMNS: Column[] = [...BASE_COLUMNS, ...COMMON_COLUMNS, ...PLAYER_ONLY_COLUMNS];
export const GOALIE_COLUMNS: Column[] = [...BASE_COLUMNS, ...GOALIE_ONLY_COMBINED_COLUMNS, ...COMMON_COLUMNS];
export const GOALIE_SEASON_COLUMNS: Column[] = [...BASE_COLUMNS, ...GOALIE_ONLY_SEASON_COLUMNS, ...COMMON_COLUMNS];

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
