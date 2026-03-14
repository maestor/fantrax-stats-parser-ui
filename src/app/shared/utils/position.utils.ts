type DerivePositionsOptions = {
  blankTieRanks?: boolean;
};

export function derivePositions<T extends { tieRank: boolean }>(
  entries: T[],
  options: DerivePositionsOptions = {},
): (T & { displayPosition: string })[] {
  const blankTieRanks = options.blankTieRanks ?? true;
  let counter = 1;
  return entries.map((entry) => {
    if (entry.tieRank && blankTieRanks) {
      const result = { ...entry, displayPosition: '' };
      counter++;
      return result;
    }
    const result = { ...entry, displayPosition: String(counter) };
    counter++;
    return result;
  });
}
