export const CAREER_PROFILES = [
  { id: '00qs7', slug: 'jamie-benn-00qs7', kind: 'player', name: 'Jamie Benn', list: 'players' },
  { id: '003vz', slug: 'carey-price-003vz', kind: 'goalie', name: 'Carey Price', list: 'goalies' },
] as const;

export const CAREER_POPUP_PROFILES = [
  CAREER_PROFILES[0],
  { id: '0457k', slug: 'jake-oettinger-0457k', kind: 'goalie', name: 'Jake Oettinger', list: 'goalies' },
] as const;

export const CAREER_DRAFT_PROFILES = {
  entry: {
    player: { id: '0618g', kind: 'player', name: 'Cole Knuble' },
    goalie: CAREER_POPUP_PROFILES[1],
  },
  expansion: {
    player: { id: '03l0t', kind: 'player', name: 'Pavel Zacha' },
    goalie: { id: '02yjw', kind: 'goalie', name: 'Tristan Jarry' },
  },
  opening: {
    player: CAREER_PROFILES[0],
    goalie: CAREER_PROFILES[1],
  },
} as const;

export const CAREER_HISTORY_ONLY_PROFILES = [
  { id: '04dut', slug: 'juuso-hietanen-04dut', kind: 'player', name: 'Juuso Hietanen', list: 'players', position: 'D' },
  { id: '01bw4', slug: 'jarkko-immonen-01bw4', kind: 'player', name: 'Jarkko Immonen', list: 'players', position: 'F' },
  { id: '02npi', slug: 'alex-mallet-02npi', kind: 'player', name: 'Alex Mallet', list: 'players', position: 'F' },
  { id: '02o87', slug: 'francois-tremblay-02o87', kind: 'goalie', name: 'Francois Tremblay', list: 'goalies', position: 'G' },
  { id: '074qj', slug: 'hugo-pettersson-074qj', kind: 'player', name: 'Hugo Pettersson', list: 'players', position: 'F' },
] as const;
