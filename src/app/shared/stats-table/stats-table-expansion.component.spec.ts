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
  function findDataRowByText(text: string): HTMLElement {
    const rows = Array.from(document.querySelectorAll<HTMLElement>('tr[mat-row]'));
    const row = rows.find((candidate) => candidate.textContent?.includes(text));
    if (!row) {
      throw new Error(`Could not find row containing "${text}"`);
    }

    return row;
  }

  it('toggles expanded details, supports multiple open rows, and handles keyboard', async () => {
    await render(StatsTableExpansionHostComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [provideNoopAnimations()],
    });

    await screen.findByText('Colorado Avalanche');

    const firstRow = findDataRowByText('Colorado Avalanche');
    const secondRow = findDataRowByText('Vegas Golden Knights');

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

  it('supports space-key expansion and blurs collapsed rows after mouse close', async () => {
    await render(StatsTableExpansionHostComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [provideNoopAnimations()],
    });

    await screen.findByText('Colorado Avalanche');

    const firstRow = findDataRowByText('Vegas Golden Knights');

    fireEvent.keyDown(firstRow, { key: ' ' });
    await screen.findByText(/Detail /);
    expect(firstRow).toHaveAttribute('aria-expanded', 'true');

    firstRow.focus();
    fireEvent.click(firstRow);

    await vi.waitFor(() => {
      expect(firstRow).toHaveAttribute('aria-expanded', 'false');
    });
    expect(firstRow).not.toHaveFocus();
  });
});
