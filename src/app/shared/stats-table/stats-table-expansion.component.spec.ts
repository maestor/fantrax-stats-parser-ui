import { Component } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { fireEvent, render, screen } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';

import { Column } from '@shared/column.types';
import { StatsTableComponent, TableRow } from './stats-table.component';

type LeaderboardRow = {
  teamId: string;
  teamName: string;
  displayPosition: string;
  tieRank: boolean;
};

@Component({
  standalone: true,
  imports: [StatsTableComponent],
  template: `
    <app-stats-table
      [data]="data"
      [columns]="columns"
      [showSearch]="false"
      [showPositionColumn]="false"
      [clickable]="false"
      [expandable]="true"
      [rowKey]="rowKey"
      [isRowExpandable]="isRowExpandable"
      [expandedRowsFor]="expandedRowsFor"
      [expandToggleAriaLabel]="expandToggleAriaLabel"
    />
  `,
})
class StatsTableExpansionHostComponent {
  readonly columns: Column[] = [
    { field: 'displayPosition', align: 'left', sortable: false },
    { field: 'teamName', align: 'left' },
  ];

  readonly data: TableRow[] = [
    { teamId: '1', teamName: 'Colorado Avalanche', displayPosition: '1', tieRank: false },
    { teamId: '2', teamName: 'Vegas Golden Knights', displayPosition: '2', tieRank: false },
  ] as unknown as TableRow[];

  readonly rowKey = (row: TableRow) => (row as unknown as LeaderboardRow).teamId;
  readonly isRowExpandable = () => true;
  readonly expandedRowsFor = (row: TableRow) => [{
    seasonLabel: '2024-2025',
    primary: `Detail ${(row as unknown as LeaderboardRow).teamName}`,
  }];
  readonly expandToggleAriaLabel = (row: TableRow, expanded: boolean) => {
    const typed = row as unknown as LeaderboardRow;
    return expanded ? `Collapse ${typed.teamName}` : `Expand ${typed.teamName}`;
  };
}

describe('StatsTableComponent expansion', () => {
  it('toggles expanded details, supports multiple open rows, and handles keyboard', async () => {
    await render(StatsTableExpansionHostComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [provideNoopAnimations()],
    });

    await screen.findByText('Colorado Avalanche');

    const rows = document.querySelectorAll('tr[mat-row]');
    const firstRow = rows[0] as HTMLElement;
    const secondRow = rows[1] as HTMLElement;

    expect(firstRow).toHaveAttribute('aria-expanded', 'false');
    expect(secondRow).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(firstRow);
    await screen.findByText('Detail Colorado Avalanche');
    expect(firstRow).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(secondRow);
    await vi.waitFor(() => {
      expect(firstRow).toHaveAttribute('aria-expanded', 'true');
      expect(secondRow).toHaveAttribute('aria-expanded', 'true');
    });

    fireEvent.keyDown(firstRow, { key: 'Enter' });
    await vi.waitFor(() => {
      expect(firstRow).toHaveAttribute('aria-expanded', 'false');
    });
  });
});
