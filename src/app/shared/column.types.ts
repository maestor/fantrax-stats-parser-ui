export interface ColumnIcon {
  name: string;
  type: 'emoji' | 'material';
}

export interface Column {
  field: string;
  icon?: ColumnIcon;
}
