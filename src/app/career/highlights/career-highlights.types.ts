import { CareerHighlightType } from '@services/api.service';
import { TableCardRow } from '@shared/table-card/table-card.types';

export type CareerHighlightsUiType = CareerHighlightType;
export type CareerHighlightSection = 'general' | 'transactions';
export type HighlightDescriptionParams = Readonly<Record<string, number | string>>;

export interface CareerHighlightCardState {
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly descriptionRequiresParams: boolean;
  readonly descriptionParams?: HighlightDescriptionParams;
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
  readonly type: CareerHighlightsUiType;
  readonly state: CareerHighlightCardState;
}
