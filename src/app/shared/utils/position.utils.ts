export function derivePositions<T extends { tieRank: boolean }>(
  entries: T[]
): (T & { displayPosition: string })[] {
  let counter = 1;
  return entries.map((entry) => {
    if (entry.tieRank) {
      const result = { ...entry, displayPosition: '' };
      counter++;
      return result;
    }
    const result = { ...entry, displayPosition: String(counter) };
    counter++;
    return result;
  });
}
