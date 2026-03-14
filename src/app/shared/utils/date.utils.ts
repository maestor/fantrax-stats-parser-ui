const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

export function formatDateForLocale(
  value: string | number | Date,
  locale: string,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  },
): string | null {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const formatterKey = `${locale}:${JSON.stringify(options)}`;
  let formatter = dateFormatterCache.get(formatterKey);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    dateFormatterCache.set(formatterKey, formatter);
  }

  return formatter.format(date);
}
