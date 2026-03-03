import { PlayoffLeaderboardEntry, RegularLeaderboardEntry } from '@services/api.service';
import { ExpandedRowViewModel } from '@shared/table-row-expansion.types';

type PlayoffSeason = PlayoffLeaderboardEntry['seasons'][number];
type RegularSeason = RegularLeaderboardEntry['seasons'][number];

export const PLAYOFF_ROUND_TRANSLATION_KEY: Record<PlayoffSeason['key'], string> = {
  championship: 'leaderboards.round.championship',
  final: 'leaderboards.round.final',
  conferenceFinal: 'leaderboards.round.conferenceFinal',
  secondRound: 'leaderboards.round.secondRound',
  firstRound: 'leaderboards.round.firstRound',
  notQualified: 'leaderboards.round.notQualified',
};

export function formatSeasonLabel(season: number): string {
  return `${season}-${season + 1}`;
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1).replace('.', ',')}%`;
}

export function mapRegularLeaderboardSeasons(
  seasons: RegularLeaderboardEntry['seasons'],
  regularTrophies = 0,
): ExpandedRowViewModel[] {
  const sorted = [...seasons].sort((a, b) => b.season - a.season);
  const explicitWinners = new Set<number>(
    sorted
      .filter(isRegularSeasonWinner)
      .map((season) => season.season),
  );
  const neededFallbackWinners = Math.max(0, regularTrophies - explicitWinners.size);
  const fallbackWinnerYears = new Set<number>(
    [...sorted]
      .sort((a, b) =>
        b.points - a.points ||
        b.winPercent - a.winPercent ||
        b.pointsPercent - a.pointsPercent ||
        b.season - a.season,
      )
      .filter((season) => !explicitWinners.has(season.season))
      .slice(0, neededFallbackWinners)
      .map((season) => season.season),
  );

  return sorted.map((season: RegularSeason) => {
    const isWinner = explicitWinners.has(season.season) || fallbackWinnerYears.has(season.season);
    return {
      seasonLabel: formatSeasonLabel(season.season),
      primary: `${season.points} p | ${season.wins}-${season.losses}-${season.ties} | P-${formatPercent(season.pointsPercent)} | V-${formatPercent(season.winPercent)}`,
      secondary: isWinner ? '🏆' : undefined,
    };
  });
}

export function mapPlayoffLeaderboardSeasons(
  seasons: PlayoffLeaderboardEntry['seasons'],
  roundLabel: (key: PlayoffSeason['key']) => string,
): ExpandedRowViewModel[] {
  return [...seasons]
    .sort((a, b) => b.season - a.season)
    .map((season: PlayoffSeason) => ({
      seasonLabel: formatSeasonLabel(season.season),
      primary: roundLabel(season.key),
      secondary: season.key === 'championship' ? '🏆' : undefined,
    }));
}

function isRegularSeasonWinner(season: RegularSeason): boolean {
  const data = season as unknown as Record<string, unknown>;
  return data['winner'] === true || data['regularTrophy'] === true || data['rank'] === 1;
}
