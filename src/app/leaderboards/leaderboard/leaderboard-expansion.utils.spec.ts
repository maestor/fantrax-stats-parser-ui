import { mapPlayoffLeaderboardSeasons } from './leaderboard-expansion.utils';

describe('leaderboard expansion utils', () => {
  it('maps playoff seasons with trophy emoji only for championships', () => {
    const mapped = mapPlayoffLeaderboardSeasons(
      [
        { season: 2023, round: 3, key: 'conferenceFinal' },
        { season: 2024, round: 5, key: 'championship' },
        { season: 2022, round: 0, key: 'notQualified' },
      ],
      (key) => key,
    );

    expect(mapped[0]).toMatchObject({
      seasonLabel: '2024-2025',
      primary: 'championship',
      secondary: '🏆',
    });

    expect(mapped[1]).toMatchObject({
      seasonLabel: '2023-2024',
      primary: 'conferenceFinal',
    });
    expect(mapped[1].secondary).toBeUndefined();

    expect(mapped[2]).toMatchObject({
      seasonLabel: '2022-2023',
      primary: 'notQualified',
    });
    expect(mapped[2].secondary).toBeUndefined();
  });
});
