import { Component } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';

import { Column } from '@shared/column.types';
import { PlayerCardDialogData } from '@shared/player-card/player-card.component';
import { StatsTableComponent, TableRow } from './stats-table.component';
import {
  polyfillJsdom,
  provideDisabledMaterialAnimations,
} from '../../testing/behavior-test-utils';

@Component({
  standalone: true,
  imports: [StatsTableComponent],
  template: `
    <app-stats-table
      [data]="data"
      [columns]="columns"
      [defaultSortColumn]="defaultSortColumn"
      [loading]="loading"
      [apiError]="apiError"
      [clickable]="clickable"
      [searchLabelKey]="searchLabelKey"
    />
  `,
})
class StatsTableHostComponent {
  apiError = false;
  loading = false;
  clickable = true;
  defaultSortColumn: 'score' | 'scoreAdjustedByGames' = 'score';
  searchLabelKey = 'table.playerSearch';

  readonly columns: Column[] = [
    { field: 'name', align: 'left' },
    { field: 'score', align: 'left', initialSortDirection: 'desc' },
    { field: 'scoreAdjustedByGames', align: 'left', initialSortDirection: 'desc' },
  ];

  data = [
    {
      name: 'Alpha Center',
      games: 82,
      score: 100,
      scoreAdjustedByGames: 2,
    },
    {
      name: 'Beta Blueliner',
      games: 60,
      score: 95,
      scoreAdjustedByGames: 5,
    },
    {
      name: 'Gamma Grinder',
      games: 30,
      score: 50,
      scoreAdjustedByGames: 1,
    },
  ] as unknown as TableRow[];
}

describe('StatsTableComponent — user behavior', () => {
  beforeEach(() => {
    polyfillJsdom();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function setup(componentProperties: Partial<StatsTableHostComponent> = {}) {
    const close$ = new Subject<void>();
    const open = vi.fn(() => ({
      afterClosed: () => close$.asObservable(),
    }));

    const view = await render(StatsTableHostComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideDisabledMaterialAnimations(),
        { provide: MatDialog, useValue: { open } },
      ],
      componentProperties,
    });

    return { ...view, close$, open };
  }

  function getDataRows(): HTMLElement[] {
    return Array.from(
      document.querySelectorAll<HTMLElement>('tr[mat-row][data-row-index]')
    );
  }

  function getFirstRowText(): string {
    return getDataRows()[0]?.textContent ?? '';
  }

  it('filters visible rows and shows the no-results message', async () => {
    await setup();

    await screen.findByText('Alpha Center');

    const searchInput = screen.getByLabelText('table.playerSearch');
    fireEvent.input(searchInput, { target: { value: 'Beta' } });

    await vi.waitFor(() => {
      expect(screen.queryByText('Alpha Center')).not.toBeInTheDocument();
      expect(screen.getByText('Beta Blueliner')).toBeInTheDocument();
    });

    fireEvent.input(searchInput, { target: { value: 'zzz' } });

    expect(await screen.findByText('table.noSearchResults')).toBeInTheDocument();
    expect(screen.queryByText('Beta Blueliner')).not.toBeInTheDocument();
  });

  it('shows the API unavailable message when the table is empty because of an error', async () => {
    await setup({ apiError: true, data: [] });

    expect(await screen.findByText('table.apiUnavailable')).toBeInTheDocument();
  });

  it('supports custom search labels and read-only keyboard instructions when rows are not clickable', async () => {
    const { open } = await setup({
      clickable: false,
      searchLabelKey: 'table.careerPlayerSearch',
    });

    await screen.findByText('Alpha Center');

    expect(screen.getByLabelText('table.careerPlayerSearch')).toBeInTheDocument();
    expect(screen.getByText('a11y.tableNavigationHintReadOnly')).toBeInTheDocument();

    const firstRow = getDataRows()[0];
    fireEvent.click(firstRow);
    fireEvent.keyDown(firstRow, { key: 'Enter' });

    expect(open).not.toHaveBeenCalled();
  });

  it('supports keyboard navigation, opens the dialog on Enter, and restores focus to the navigated row on close', async () => {
    const { close$, open } = await setup();

    await screen.findByText('Alpha Center');

    const searchInput = screen.getByLabelText('table.playerSearch');
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });

    const rows = getDataRows();
    expect(document.activeElement).toBe(rows[0]);

    fireEvent.keyDown(rows[0], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(rows[1]);

    fireEvent.keyDown(rows[1], { key: 'ArrowUp' });
    expect(document.activeElement).toBe(rows[0]);

    fireEvent.keyDown(rows[0], { key: 'PageDown' });
    expect(document.activeElement).toBe(rows[2]);

    fireEvent.keyDown(rows[2], { key: 'PageUp' });
    expect(document.activeElement).toBe(rows[0]);

    fireEvent.keyDown(rows[0], { key: 'End' });
    expect(document.activeElement).toBe(rows[2]);

    fireEvent.keyDown(rows[2], { key: 'Home' });
    expect(document.activeElement).toBe(rows[0]);

    fireEvent.keyDown(rows[0], { key: 'Enter' });

    expect(open).toHaveBeenCalledTimes(1);

    const dialogCall = open.mock.calls[0] as unknown as [
      unknown,
      { data: PlayerCardDialogData },
    ];
    const dialogData = dialogCall[1].data;
    dialogData.navigationContext?.onNavigate?.(2);

    close$.next();
    close$.complete();

    await vi.waitFor(() => {
      expect(document.activeElement).toBe(getDataRows()[2]);
    });
  });

  it('shows loading feedback for delayed loads and clears it when rows arrive', async () => {
    vi.useFakeTimers();

    const view = await setup({ loading: true, data: [] });

    expect(await screen.findByText('table.loading')).toBeInTheDocument();
    expect(document.querySelector('.loading-bar')).not.toBeNull();

    vi.advanceTimersByTime(600);

    view.fixture.componentInstance.loading = false;
    view.fixture.componentInstance.data = [
      {
        name: 'Alpha Center',
        games: 82,
        score: 100,
        scoreAdjustedByGames: 2,
      },
    ] as unknown as TableRow[];
    view.fixture.detectChanges();

    await vi.waitFor(() => {
      expect(screen.getByText('Alpha Center')).toBeInTheDocument();
      expect(screen.queryByText('table.loading')).not.toBeInTheDocument();
      expect(document.querySelector('.loading-bar')).toBeNull();
    });
  });

  it('clamps the active row after filtering reduces the result set and lets the header move focus back to search', async () => {
    await setup();

    await screen.findByText('Alpha Center');

    const searchInput = screen.getByLabelText('table.playerSearch');
    const headerRow = document.querySelector<HTMLElement>('tr[mat-header-row]');
    expect(headerRow).not.toBeNull();

    fireEvent.keyDown(headerRow!, { key: 'ArrowDown' });
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(getDataRows()[0]);
    });

    headerRow!.focus();
    fireEvent.keyDown(headerRow!, { key: 'ArrowUp' });
    expect(searchInput).toHaveFocus();

    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });

    const rows = getDataRows();
    fireEvent.keyDown(rows[0], { key: 'End' });
    expect(document.activeElement).toBe(rows[2]);

    fireEvent.input(searchInput, { target: { value: 'Alpha' } });

    await vi.waitFor(() => {
      expect(screen.queryByText('Beta Blueliner')).not.toBeInTheDocument();
      expect(getDataRows()).toHaveLength(1);
    });
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });

    await vi.waitFor(() => {
      expect(document.activeElement).toBe(getDataRows()[0]);
    });
  });

  it('changes the default visible row order when the default sort column changes', async () => {
    const view = await setup();

    await vi.waitFor(() => {
      expect(getFirstRowText()).toContain('Alpha Center');
    });

    view.fixture.componentInstance.defaultSortColumn = 'scoreAdjustedByGames';
    view.fixture.componentInstance.data = [...view.fixture.componentInstance.data];
    view.fixture.detectChanges();

    await vi.waitFor(() => {
      expect(getFirstRowText()).toContain('Beta Blueliner');
    });
  });

  it('uses descending first-click sorting for numeric headers', async () => {
    await setup();

    await screen.findByText('Alpha Center');

    fireEvent.click(screen.getByText('tableColumnShort.scoreAdjustedByGames'));

    await vi.waitFor(() => {
      expect(getFirstRowText()).toContain('Beta Blueliner');
    });
  });
});
