import { CareerReunionHighlightItem } from '@services/api.service';
import { formatDateForLocale } from '@shared/utils/date.utils';

type ReunionType = CareerReunionHighlightItem['reunions'][number]['type'];

export type ReunionTypeLabels = Readonly<Record<ReunionType, string>>;

export function formatReunionDetailLines(
  reunions: ReadonlyArray<CareerReunionHighlightItem['reunions'][number]>,
  reunionTypeLabels: ReunionTypeLabels,
  locale: string,
): string[] {
  return reunions.map(
    (reunion, index) => {
      const formattedDate = formatDateForLocale(reunion.date, locale) ?? reunion.date;
      return `${index + 1}. ${formattedDate} ${reunionTypeLabels[reunion.type]}`;
    },
  );
}
