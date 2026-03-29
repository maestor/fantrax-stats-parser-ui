export const ACHIEVEMENTS_CAREER_HIGHLIGHT_CARD_TYPES = [
  'most-stanley-cups',
  'regular-grinder-without-playoffs',
] as const;

export const JOURNEYS_CAREER_HIGHLIGHT_CARD_TYPES = [
  'most-teams-played',
  'most-teams-owned',
] as const;

export const LONG_STAYS_CAREER_HIGHLIGHT_CARD_TYPES = [
  'same-team-seasons-played',
  'same-team-seasons-owned',
  'stash-king',
] as const;

export const TRANSACTION_CAREER_HIGHLIGHT_CARD_TYPES = [
  'most-trades',
  'most-claims',
  'most-drops',
  'reunion-king',
] as const;

export const GENERAL_CAREER_HIGHLIGHT_CARD_TYPES = [
  ...ACHIEVEMENTS_CAREER_HIGHLIGHT_CARD_TYPES,
  ...JOURNEYS_CAREER_HIGHLIGHT_CARD_TYPES,
  ...LONG_STAYS_CAREER_HIGHLIGHT_CARD_TYPES,
] as const;

export const CAREER_HIGHLIGHT_CARD_TYPES = [
  ...ACHIEVEMENTS_CAREER_HIGHLIGHT_CARD_TYPES,
  ...TRANSACTION_CAREER_HIGHLIGHT_CARD_TYPES,
  ...LONG_STAYS_CAREER_HIGHLIGHT_CARD_TYPES,
  ...JOURNEYS_CAREER_HIGHLIGHT_CARD_TYPES,
] as const;

export type CareerHighlightsUiType = (typeof CAREER_HIGHLIGHT_CARD_TYPES)[number];

export const CAREER_HIGHLIGHT_SECTIONS = [
  {
    id: 'achievements',
    titleKey: 'career.highlights.sections.achievements.title',
    descriptionKey: 'career.highlights.sections.achievements.description',
    cardTypes: ACHIEVEMENTS_CAREER_HIGHLIGHT_CARD_TYPES,
  },
  {
    id: 'transactions',
    titleKey: 'career.highlights.sections.transactions.title',
    descriptionKey: 'career.highlights.sections.transactions.description',
    cardTypes: TRANSACTION_CAREER_HIGHLIGHT_CARD_TYPES,
  },
  {
    id: 'long-stays',
    titleKey: 'career.highlights.sections.longStays.title',
    descriptionKey: 'career.highlights.sections.longStays.description',
    cardTypes: LONG_STAYS_CAREER_HIGHLIGHT_CARD_TYPES,
  },
  {
    id: 'journeys',
    titleKey: 'career.highlights.sections.journeys.title',
    descriptionKey: 'career.highlights.sections.journeys.description',
    cardTypes: JOURNEYS_CAREER_HIGHLIGHT_CARD_TYPES,
  },
] as const satisfies readonly {
  readonly id: string;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly cardTypes: readonly CareerHighlightsUiType[];
}[];

export type CareerHighlightSectionId = (typeof CAREER_HIGHLIGHT_SECTIONS)[number]['id'];
