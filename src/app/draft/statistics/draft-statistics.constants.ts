export const DRAFT_STATISTICS_CARD_IDS = [
  'total-picks',
  'own-picks',
  'traded-picks',
  'players-per-draft',
  'average-position',
  'played-in-league',
  'played-in-league-percent',
  'played-for-drafting-team-percent',
  'round-1',
  'round-2',
  'round-3',
  'round-4',
  'round-5',
] as const;

export type DraftStatisticsCardId = (typeof DRAFT_STATISTICS_CARD_IDS)[number];
