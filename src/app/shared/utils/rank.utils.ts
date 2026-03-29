export type TiedRankInfo = {
  readonly displayRank: number;
  readonly tieRank: boolean;
};

export function deriveTiedRanks<T>(
  entries: readonly T[],
  isTied: (left: T, right: T) => boolean,
): Array<T & TiedRankInfo> {
  const rankedEntries: Array<T & TiedRankInfo> = [];

  for (const [index, entry] of entries.entries()) {
    const previousEntry = index > 0 ? entries[index - 1] : undefined;
    const nextEntry = index + 1 < entries.length ? entries[index + 1] : undefined;
    const tiedWithPrevious = previousEntry !== undefined && isTied(entry, previousEntry);
    const tiedWithNext = nextEntry !== undefined && isTied(entry, nextEntry);

    rankedEntries.push({
      ...entry,
      displayRank: tiedWithPrevious ? rankedEntries[index - 1].displayRank : index + 1,
      tieRank: tiedWithPrevious || tiedWithNext,
    });
  }

  return rankedEntries;
}

export function formatTiedRankLabel(rank: number, tieRank: boolean): string {
  return `${tieRank ? 'T' : ''}${rank}.`;
}
