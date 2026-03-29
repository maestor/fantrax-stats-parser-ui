import { TableCardRow } from '@shared/table-card/table-card.types';
import type { CareerHighlightsUiType } from './career-highlights.constants';

export type {
  CareerHighlightSectionId,
  CareerHighlightsUiType,
} from './career-highlights.constants';
export type HighlightDescriptionParams = Readonly<Record<string, number | string>>;

export interface CareerHighlightCardState {
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly descriptionRequiresParams: boolean;
  readonly descriptionParams?: HighlightDescriptionParams;
  readonly valueColumnLabelKey: string;
  readonly valueColumnTooltipKey?: string;
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

export interface CareerHighlightSectionView {
  readonly id: string;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly anchorId: string;
  readonly headingId: string;
  readonly cards: readonly CareerHighlightCardView[];
}
