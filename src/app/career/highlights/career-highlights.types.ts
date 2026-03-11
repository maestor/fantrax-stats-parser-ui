import { TableCardRow } from '@shared/table-card/table-card.types';
import { CareerHighlightType } from '@services/api.service';

export interface CareerHighlightCardState {
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly valueColumnLabelKey: string;
  readonly activated: boolean;
  readonly rows: readonly TableCardRow[];
  readonly loading: boolean;
  readonly apiError: boolean;
  readonly skip: number;
  readonly take: number;
  readonly total: number;
}

export interface CareerHighlightCardView {
  readonly type: CareerHighlightType;
  readonly state: CareerHighlightCardState;
}
