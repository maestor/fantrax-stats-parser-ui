export interface ExpandedRowViewModel {
  seasonLabel: string;
  seasonLink?: string;
  seasonLinkQueryParams?: Readonly<Record<string, string>>;
  primary: string;
  secondary?: string;
  tooltip?: string;
}
