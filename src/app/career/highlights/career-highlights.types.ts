import { TableCardRow } from '@shared/table-card/table-card.types';

export interface CareerHighlightCardState {
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly valueColumnLabelKey: string;
  readonly rows: readonly TableCardRow[];
  readonly loading: boolean;
  readonly apiError: boolean;
  readonly skip: number;
  readonly take: number;
  readonly total: number;
}
