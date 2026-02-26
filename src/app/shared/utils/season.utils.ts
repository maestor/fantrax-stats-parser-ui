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
