export interface TableCardRow {
  readonly key: string;
  readonly primaryText: string;
  readonly value: number | string;
  readonly detailLines: readonly string[];
  readonly detailLabel: string;
}
