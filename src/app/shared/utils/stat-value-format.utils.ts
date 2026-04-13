const FIXED_DECIMAL_STAT_DIGITS: Record<string, number> = {
  gaa: 2,
  savePercent: 3,
};

export function formatStatDisplayValue(
  field: string,
  value: number | string | undefined,
): string {
  if (value === undefined) {
    return '-';
  }

  const fractionDigits = FIXED_DECIMAL_STAT_DIGITS[field];
  if (fractionDigits === undefined) {
    return String(value);
  }

  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue)
    ? numericValue.toFixed(fractionDigits)
    : String(value);
}
