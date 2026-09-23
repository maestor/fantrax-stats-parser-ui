export interface ColumnIcon {
  name: string;
  type: 'emoji' | 'material';
}

export interface Column {
  field: string;
  icon?: ColumnIcon;
  headerLabel?: string;
  headerTooltip?: string;
  cellDelta?: (row: unknown) => { text: string; className?: string } | undefined;
  align?: 'left' | 'center'; // default: center
  sortable?: boolean;         // default: true
  initialSortDirection?: 'asc' | 'desc';
}
