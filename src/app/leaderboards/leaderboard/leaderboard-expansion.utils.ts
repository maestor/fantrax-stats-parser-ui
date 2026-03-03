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
): ExpandedRowViewModel[] {
  return [...seasons]
    .sort((a, b) => b.season - a.season)
    .map((season: RegularSeason) => ({
      seasonLabel: formatSeasonLabel(season.season),
      primary: `${season.points} p | ${season.wins}-${season.losses}-${season.ties} | P-${formatPercent(season.pointsPercent)} | V-${formatPercent(season.winPercent)}`,
      secondary: season.regularTrophy ? '🏆' : undefined,
    }));
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
