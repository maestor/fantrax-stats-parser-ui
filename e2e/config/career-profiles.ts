export const CAREER_PROFILES = [
  { id: '00qs7', slug: 'jamie-benn-00qs7', kind: 'player', name: 'Jamie Benn', list: 'players' },
  { id: '003vz', slug: 'carey-price-003vz', kind: 'goalie', name: 'Carey Price', list: 'goalies' },
] as const;

export const CAREER_POPUP_PROFILES = [
  CAREER_PROFILES[0],
  { id: '0457k', slug: 'jake-oettinger-0457k', kind: 'goalie', name: 'Jake Oettinger', list: 'goalies' },
] as const;
