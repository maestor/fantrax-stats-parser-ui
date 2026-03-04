/**
 * Coerces an unknown season value (number or numeric string) to a number.
 * Returns undefined for any value that cannot be interpreted as a finite number.
 */
export function toSeasonNumber(raw: unknown): number | undefined {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string') {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

/**
 * Formats a season year (e.g. 2023) into a display string (e.g. "2023-24").
 */
export function formatSeasonDisplay(year: number): string {
  return `${year}-${String(year + 1).slice(-2)}`;
}

/**
 * Formats a season year (e.g. 2023) into a short display string (e.g. "23-24").
 */
export function formatSeasonShort(year: number): string {
  const startShort = String(year).slice(-2);
  const nextYear = year + 1;
  const endShort = String(nextYear).slice(-2);
  return `${startShort}-${endShort}`;
}
