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

export const DRAFT_STATISTICS_SECTIONS = [
  {
    id: 'pick-volume',
    titleKey: 'draft.statistics.sections.pickVolume.title',
    descriptionKey: 'draft.statistics.sections.pickVolume.description',
    cardIds: [
      'total-picks',
      'own-picks',
      'traded-picks',
      'players-per-draft',
    ],
  },
  {
    id: 'outcomes',
    titleKey: 'draft.statistics.sections.outcomes.title',
    descriptionKey: 'draft.statistics.sections.outcomes.description',
    cardIds: [
      'average-position',
      'played-in-league',
      'played-in-league-percent',
      'played-for-drafting-team-percent',
    ],
  },
  {
    id: 'rounds',
    titleKey: 'draft.statistics.sections.rounds.title',
    descriptionKey: 'draft.statistics.sections.rounds.description',
    cardIds: [
      'round-1',
      'round-2',
      'round-3',
      'round-4',
      'round-5',
    ],
  },
] as const satisfies readonly {
  readonly id: string;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly cardIds: readonly DraftStatisticsCardId[];
}[];

export type DraftStatisticsSectionId = (typeof DRAFT_STATISTICS_SECTIONS)[number]['id'];
