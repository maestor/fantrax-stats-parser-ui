// Table column definitions

const BASE_COLUMNS = ['position', 'name', 'score', 'scoreAdjustedByGames', 'games'];

const COMMON_COLUMNS = [
  'goals',
  'assists',
  'points',
  'penalties',
  'ppp',
  'shp',
];
const PLAYER_ONLY_COLUMNS = ['plusMinus', 'shots', 'hits', 'blocks'];
const GOALIE_ONLY_COLUMNS = ['wins', 'saves'];
const GOALIE_ONLY_COMBINED_COLUMNS = [...GOALIE_ONLY_COLUMNS, 'shutouts'];
const GOALIE_ONLY_SEASON_COLUMNS = [
  ...GOALIE_ONLY_COLUMNS,
  'gaa',
  'savePercent',
  'shutouts',
];

export const PLAYER_COLUMNS = [
  ...BASE_COLUMNS,
  ...COMMON_COLUMNS,
  ...PLAYER_ONLY_COLUMNS,
];

export const GOALIE_COLUMNS = [
  ...BASE_COLUMNS,
  ...GOALIE_ONLY_COMBINED_COLUMNS,
  ...COMMON_COLUMNS,
];

export const GOALIE_SEASON_COLUMNS = [
  ...BASE_COLUMNS,
  ...GOALIE_ONLY_SEASON_COLUMNS,
  ...COMMON_COLUMNS,
];

export const STATIC_COLUMNS = ['position'];
