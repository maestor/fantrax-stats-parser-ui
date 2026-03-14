import {
  PlayoffLeaderboardEntry,
  RegularLeaderboardEntry,
  TransactionLeaderboardEntry,
} from '@services/api.service';
import { ExpandedRowViewModel } from '@shared/table-row-expansion.types';
import { formatSeasonDisplay, formatSeasonShort } from '@shared/utils/season.utils';

type PlayoffSeason = PlayoffLeaderboardEntry['seasons'][number];
type RegularSeason = RegularLeaderboardEntry['seasons'][number];
type TransactionSeason = TransactionLeaderboardEntry['seasons'][number];
type SeasonLabelOptions = { shortSeasonLabel?: boolean };

export const PLAYOFF_ROUND_TRANSLATION_KEY: Record<PlayoffSeason['key'], string> = {
  championship: 'leaderboards.round.championship',
  final: 'leaderboards.round.final',
  conferenceFinal: 'leaderboards.round.conferenceFinal',
  secondRound: 'leaderboards.round.secondRound',
  firstRound: 'leaderboards.round.firstRound',
  notQualified: 'leaderboards.round.notQualified',
};

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1).replace('.', ',')}`;
}

export function mapRegularLeaderboardSeasons(
  seasons: RegularLeaderboardEntry['seasons'],
  options: SeasonLabelOptions = {},
): ExpandedRowViewModel[] {
  const formatSeason = options.shortSeasonLabel ? formatSeasonShort : formatSeasonDisplay;
  return [...seasons]
    .sort((a, b) => b.season - a.season)
    .map((season: RegularSeason) => ({
      seasonLabel: formatSeason(season.season),
      primary: `${season.points} p | ${season.wins}-${season.losses}-${season.ties} | P%: ${formatPercent(season.pointsPercent)} | V%: ${formatPercent(season.winPercent)}`,
      secondary: season.regularTrophy ? '🏆' : undefined,
    }));
}

export function mapPlayoffLeaderboardSeasons(
  seasons: PlayoffLeaderboardEntry['seasons'],
  roundLabel: (key: PlayoffSeason['key']) => string,
  options: SeasonLabelOptions = {},
): ExpandedRowViewModel[] {
  const formatSeason = options.shortSeasonLabel ? formatSeasonShort : formatSeasonDisplay;
  return [...seasons]
    .sort((a, b) => b.season - a.season)
    .map((season: PlayoffSeason) => ({
      seasonLabel: formatSeason(season.season),
      primary: roundLabel(season.key),
      secondary: season.key === 'championship' ? '🏆' : undefined,
    }));
}

export function mapTransactionLeaderboardSeasons(
  seasons: TransactionLeaderboardEntry['seasons'],
  options: SeasonLabelOptions = {},
): ExpandedRowViewModel[] {
  const formatSeason = options.shortSeasonLabel ? formatSeasonShort : formatSeasonDisplay;
  return [...seasons]
    .sort((a, b) => b.season - a.season)
    .map((season: TransactionSeason) => ({
      seasonLabel: formatSeason(season.season),
      primary: `🤝 ${season.trades} | 🟢 ${season.claims} | 🔴 ${season.drops}`,
    }));
}
