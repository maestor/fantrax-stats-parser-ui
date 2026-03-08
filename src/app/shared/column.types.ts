export interface ColumnIcon {
  name: string;
  type: 'emoji' | 'material';
}

export interface Column {
  field: string;
  icon?: ColumnIcon;
  align?: 'left' | 'center'; // default: center
  sortable?: boolean;         // default: true
  initialSortDirection?: 'asc' | 'desc';
}
