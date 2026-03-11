import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { fireEvent, render, screen } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';

import { Column } from '@shared/column.types';
import { PlayerCardDialogData } from '@shared/player-card/player-card.component';
import {
  StatsTableComponent,
  TableRow,
  shouldSchedulePlayerCardPrefetch,
} from './stats-table.component';
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
    { field: 'name', align: 'left', initialSortDirection: 'asc' },
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

    const statsTable = view.fixture.debugElement.query(By.directive(StatsTableComponent))
      .componentInstance as StatsTableComponent;

    return { ...view, close$, open, statsTable };
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

    await vi.waitFor(() => {
      expect(open).toHaveBeenCalledTimes(1);
    }, { timeout: 5000 });

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

  it('resolves the player-card dialog service only on row interaction', async () => {
    const close$ = new Subject<void>();
    const open = vi.fn(() => ({
      afterClosed: () => close$.asObservable(),
    }));
    const dialogFactory = vi.fn(() => ({ open }));

    await render(StatsTableHostComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideDisabledMaterialAnimations(),
        { provide: MatDialog, useFactory: dialogFactory },
      ],
    });

    await screen.findByText('Alpha Center');

    expect(dialogFactory).not.toHaveBeenCalled();

    fireEvent.keyDown(getDataRows()[0], { key: 'Enter' });

    await vi.waitFor(() => {
      expect(dialogFactory).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledTimes(1);
    }, { timeout: 5000 });
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

  it('waits for desktop intent before scheduling player-card prefetch', async () => {
    const previousMatchMedia = window.matchMedia;
    const previousRequestIdleCallback = window.requestIdleCallback;
    const requestIdleCallback = vi.fn(() => 1);
    try {
      Object.defineProperty(window, 'requestIdleCallback', {
        configurable: true,
        value: requestIdleCallback,
      });
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: vi.fn((query: string) => ({
          matches: query === '(hover: hover) and (pointer: fine)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      await setup();
      await screen.findByText('Alpha Center');

      expect(requestIdleCallback).not.toHaveBeenCalled();

      fireEvent.mouseEnter(document.querySelector('.stats-table-wrapper') as HTMLElement);
      expect(requestIdleCallback).toHaveBeenCalledTimes(1);

      fireEvent.focusIn(document.querySelector('.stats-table-wrapper') as HTMLElement);
      expect(requestIdleCallback).toHaveBeenCalledTimes(1);
    } finally {
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: previousMatchMedia,
      });
      Object.defineProperty(window, 'requestIdleCallback', {
        configurable: true,
        value: previousRequestIdleCallback,
      });
    }
  });

  it('uses a timer fallback for player-card prefetch when requestIdleCallback is unavailable', async () => {
    vi.useFakeTimers();

    const previousMatchMedia = window.matchMedia;
    const previousRequestIdleCallback = window.requestIdleCallback;

    try {
      Reflect.deleteProperty(window, 'requestIdleCallback');
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: vi.fn((query: string) => ({
          matches: query === '(hover: hover) and (pointer: fine)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { statsTable } = await setup();
      await screen.findByText('Alpha Center');

      const statsTableInternal = statsTable as any;

      statsTable.onPlayerCardPrefetchIntent();
      expect(statsTableInternal.playerCardPrefetchTimerId).toBeDefined();

      vi.runOnlyPendingTimers();

      expect(statsTableInternal.playerCardPrefetchTimerId).toBeUndefined();
    } finally {
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: previousMatchMedia,
      });
      if (previousRequestIdleCallback) {
        Object.defineProperty(window, 'requestIdleCallback', {
          configurable: true,
          value: previousRequestIdleCallback,
        });
      }
    }
  });

  it('cleans up pending player-card prefetch work on destroy', async () => {
    const previousCancelIdleCallback = window.cancelIdleCallback;
    const cancelIdleCallback = vi.fn();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    try {
      Object.defineProperty(window, 'cancelIdleCallback', {
        configurable: true,
        value: cancelIdleCallback,
      });

      const { fixture, statsTable } = await setup();
      await screen.findByText('Alpha Center');

      const timerId = setTimeout(() => {}, 1500);
      const componentWithPrefetchState = statsTable as any;

      componentWithPrefetchState.playerCardPrefetchIdleId = 123;
      componentWithPrefetchState.playerCardPrefetchTimerId = timerId;

      fixture.destroy();

      expect(cancelIdleCallback).toHaveBeenCalledWith(123);
      expect(clearTimeoutSpy).toHaveBeenCalledWith(timerId);
      expect(componentWithPrefetchState.playerCardPrefetchIdleId).toBeUndefined();
      expect(componentWithPrefetchState.playerCardPrefetchTimerId).toBeUndefined();
    } finally {
      clearTimeoutSpy.mockRestore();
      if (previousCancelIdleCallback) {
        Object.defineProperty(window, 'cancelIdleCallback', {
          configurable: true,
          value: previousCancelIdleCallback,
        });
      }
    }
  });

  it('no-ops prefetch scheduling helpers when window is unavailable', async () => {
    const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
    const { statsTable } = await setup();
    await screen.findByText('Alpha Center');

    try {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: undefined,
      });

      expect(() => {
        (statsTable as any).schedulePlayerCardPrefetch();
      }).not.toThrow();

      expect(() => {
        (statsTable as any).clearPlayerCardPrefetch();
      }).not.toThrow();
    } finally {
      if (windowDescriptor) {
        Object.defineProperty(globalThis, 'window', windowDescriptor);
      }
    }
  });
});

describe('shouldSchedulePlayerCardPrefetch', () => {
  it('allows intent-based prefetch on desktop fine-pointer connections', () => {
    expect(
      shouldSchedulePlayerCardPrefetch({
        matchMedia: (query: string) =>
          ({ matches: query === '(hover: hover) and (pointer: fine)' }) as MediaQueryList,
        navigator: {},
      } as unknown as Window)
    ).toBe(true);
  });

  it('skips startup prefetch on mobile and constrained connections', () => {
    expect(
      shouldSchedulePlayerCardPrefetch({
        matchMedia: (query: string) =>
          ({ matches: query === '(max-width: 768px)' }) as MediaQueryList,
        navigator: {},
      } as unknown as Window)
    ).toBe(false);

    expect(
      shouldSchedulePlayerCardPrefetch({
        matchMedia: () => ({ matches: false }) as MediaQueryList,
        navigator: {
          connection: {
            effectiveType: '3g',
          },
        } as unknown as Navigator,
      } as unknown as Window)
    ).toBe(false);

    expect(
      shouldSchedulePlayerCardPrefetch({
        matchMedia: (query: string) =>
          ({ matches: query === '(hover: hover) and (pointer: fine)' }) as MediaQueryList,
        navigator: {
          connection: {
            saveData: true,
          },
        } as unknown as Navigator,
      } as unknown as Window)
    ).toBe(false);
  });
});
