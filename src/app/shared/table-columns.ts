// Table column definitions

const BASE_COLUMNS = ['position', 'name', 'games'];
const COMMON_COLUMNS = [
  'goals',
  'assists',
  'points',
  'penalties',
  'ppp',
  'shp',
];
const PLAYER_ONLY_COLUMNS = ['plusMinus', 'shots', 'hits', 'blocks'];
const GOALIE_ONLY_COLUMNS = ['wins', 'saves', 'shutouts'];
const GOALIE_ONLY_SEASON_COLUMNS = ['gaa', 'savePercent'];

export const PLAYER_COLUMNS = [
  ...BASE_COLUMNS,
  ...COMMON_COLUMNS,
  ...PLAYER_ONLY_COLUMNS,
];

export const GOALIE_COLUMNS = [
  ...BASE_COLUMNS,
  ...GOALIE_ONLY_COLUMNS,
  ...COMMON_COLUMNS,
];

export const GOALIE_SEASON_COLUMNS = [
  ...BASE_COLUMNS,
  ...GOALIE_ONLY_COLUMNS,
  ...GOALIE_ONLY_SEASON_COLUMNS,
  ...COMMON_COLUMNS,
];

export const STATIC_COLUMNS = ['position'];
