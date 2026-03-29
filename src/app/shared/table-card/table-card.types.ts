export interface TableCardRankLabel {
  readonly text: string;
  readonly ariaLabel?: string;
}

export interface TableCardRow {
  readonly key: string;
  readonly rank?: TableCardRankLabel;
  readonly primaryText: string;
  readonly value: number | string;
  readonly emphasized?: boolean;
  readonly detailHeader?: string;
  readonly detailLines?: readonly string[];
  readonly detailLabel?: string;
  readonly detailTooltipClass?: string;
}
