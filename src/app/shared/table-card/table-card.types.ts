export interface TableCardRow {
  readonly key: string;
  readonly primaryText: string;
  readonly value: number | string;
  readonly detailHeader?: string;
  readonly detailLines: readonly string[];
  readonly detailLabel: string;
  readonly detailTooltipClass?: string;
}
