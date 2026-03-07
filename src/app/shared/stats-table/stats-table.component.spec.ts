import { Component } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { fireEvent, render, screen } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';

import { Column } from '@shared/column.types';
import { PlayerCardDialogData } from '@shared/player-card/player-card.component';
import { StatsTableComponent, TableRow } from './stats-table.component';
import { polyfillJsdom } from '../../testing/behavior-test-utils';

@Component({
  standalone: true,
  imports: [StatsTableComponent],
  template: `
    <app-stats-table
      [data]="data"
      [columns]="columns"
      [defaultSortColumn]="defaultSortColumn"
      [apiError]="apiError"
    />
  `,
})
class StatsTableHostComponent {
  apiError = false;
  defaultSortColumn: 'score' | 'scoreAdjustedByGames' = 'score';

  readonly columns: Column[] = [
    { field: 'name', align: 'left' },
    { field: 'score', align: 'left' },
    { field: 'scoreAdjustedByGames', align: 'left' },
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

  async function setup(componentProperties: Partial<StatsTableHostComponent> = {}) {
    const close$ = new Subject<void>();
    const open = vi.fn(() => ({
      afterClosed: () => close$.asObservable(),
    }));

    const view = await render(StatsTableHostComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideNoopAnimations(),
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
});
