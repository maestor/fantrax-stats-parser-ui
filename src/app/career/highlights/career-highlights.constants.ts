export const GENERAL_CAREER_HIGHLIGHT_CARD_TYPES = [
  'most-stanley-cups',
  'regular-grinder-without-playoffs',
  'most-teams-played',
  'most-teams-owned',
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

export const CAREER_HIGHLIGHT_CARD_TYPES_BY_SECTION = {
  general: GENERAL_CAREER_HIGHLIGHT_CARD_TYPES,
  transactions: TRANSACTION_CAREER_HIGHLIGHT_CARD_TYPES,
} as const;

export const CAREER_HIGHLIGHT_CARD_TYPES = [
  ...GENERAL_CAREER_HIGHLIGHT_CARD_TYPES,
  ...TRANSACTION_CAREER_HIGHLIGHT_CARD_TYPES,
] as const;

export type CareerHighlightSection = keyof typeof CAREER_HIGHLIGHT_CARD_TYPES_BY_SECTION;
export type CareerHighlightsUiType = (typeof CAREER_HIGHLIGHT_CARD_TYPES)[number];
