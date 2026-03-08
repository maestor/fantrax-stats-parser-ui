import { Component } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { fireEvent, render, screen } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';

import { Column } from '@shared/column.types';
import { polyfillJsdom } from '../../testing/behavior-test-utils';
import { TableRow } from './stats-table.component';
import { VirtualTableComponent } from './virtual-table.component';

@Component({
  standalone: true,
  imports: [VirtualTableComponent],
  template: `
    <app-virtual-table
      [data]="data"
      [columns]="columns"
      [defaultSortColumn]="defaultSortColumn"
      [loading]="loading"
      [apiError]="apiError"
      [searchLabelKey]="searchLabelKey"
      [formatCell]="formatCell"
    />
  `,
})
class VirtualTableHostComponent {
  loading = false;
  apiError = false;
  defaultSortColumn: 'score' | 'name' = 'score';
  searchLabelKey = 'table.careerPlayerSearch';

  readonly columns: Column[] = [
    { field: 'name', align: 'left' },
    { field: 'score', initialSortDirection: 'desc' },
    { field: 'regularGames', initialSortDirection: 'desc' },
  ];

  readonly formatCell = (_row: unknown, column: string, value: number | string | undefined): string => {
    if (column === 'score' && typeof value === 'number') {
      return `${value} pts`;
    }

    return String(value ?? '-');
  };

  data = [
    { id: 'a', name: 'Alpha Center', score: 80, regularGames: 300 },
    { id: 'b', name: 'Beta Blueliner', score: 95, regularGames: 250 },
    { id: 'c', name: 'Gamma Grinder', score: 40, regularGames: 180 },
  ] as unknown as TableRow[];
}

describe('VirtualTableComponent — user behavior', () => {
  beforeEach(() => {
    polyfillJsdom();
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      return window.setTimeout(() => callback(performance.now()), 0);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function setup(componentProperties: Partial<VirtualTableHostComponent> = {}) {
    return render(VirtualTableHostComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [provideNoopAnimations()],
      componentProperties,
    });
  }

  function getRows(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>('.virtual-table-row[data-row-index]'));
  }

  it('sorts by default column, formats custom cells, and filters rows via search', async () => {
    await setup();

    await screen.findByText('Beta Blueliner');

    expect(getRows()[0]).toHaveTextContent('Beta Blueliner');
    expect(getRows()[0]).toHaveTextContent('95 pts');
    expect(screen.getByLabelText('table.careerPlayerSearch')).toBeInTheDocument();

    fireEvent.input(screen.getByLabelText('table.careerPlayerSearch'), {
      target: { value: 'Gamma' },
    });

    await vi.waitFor(() => {
      expect(screen.getByText('Gamma Grinder')).toBeInTheDocument();
      expect(screen.queryByText('Beta Blueliner')).not.toBeInTheDocument();
    });
  });

  it('uses descending first-click sorting for numeric headers', async () => {
    await setup();

    await screen.findByText('Beta Blueliner');

    fireEvent.click(screen.getByText('tableColumnShort.regularGames'));

    await vi.waitFor(() => {
      expect(getRows()[0]).toHaveTextContent('Alpha Center');
      expect(getRows()[1]).toHaveTextContent('Beta Blueliner');
      expect(getRows()[2]).toHaveTextContent('Gamma Grinder');
    });
  });

  it('supports keyboard navigation from search to header to rows and shows empty states', async () => {
    const view = await setup();

    await screen.findByText('Beta Blueliner');

    const searchInput = screen.getByLabelText('table.careerPlayerSearch');
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });

    await vi.waitFor(() => {
      expect(document.activeElement).toBe(getRows()[0]);
    });

    fireEvent.keyDown(getRows()[0], { key: 'ArrowDown' });
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(getRows()[1]);
    });

    fireEvent.keyDown(getRows()[1], { key: 'End' });
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(getRows()[2]);
    });

    const headerRow = document.querySelector<HTMLElement>('.virtual-header-row');
    expect(headerRow).not.toBeNull();
    headerRow!.focus();
    fireEvent.keyDown(headerRow!, { key: 'ArrowUp' });
    expect(searchInput).toHaveFocus();

    fireEvent.input(searchInput, { target: { value: 'zzz' } });
    expect(await screen.findByText('table.noSearchResults')).toBeInTheDocument();

    view.fixture.componentInstance.apiError = true;
    view.fixture.detectChanges();
    expect(await screen.findByText('table.apiUnavailable')).toBeInTheDocument();

    view.fixture.componentInstance.apiError = false;
    view.fixture.componentInstance.loading = true;
    view.fixture.detectChanges();
    expect(await screen.findByText('table.loading')).toBeInTheDocument();
  });

  it('covers the remaining keyboard and resize paths used by the career table', async () => {
    const view = await setup();
    const table = view.fixture.debugElement.children[0].componentInstance as VirtualTableComponent;

    await screen.findByText('Beta Blueliner');

    const searchInput = screen.getByLabelText('table.careerPlayerSearch');
    searchInput.focus();
    fireEvent.keyDown(searchInput, { key: 'Enter' });
    expect(searchInput).toHaveFocus();

    const headerRow = document.querySelector<HTMLElement>('.virtual-header-row');
    expect(headerRow).not.toBeNull();

    headerRow!.focus();
    fireEvent.keyDown(headerRow!, { key: 'ArrowDown' });
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(getRows()[0]);
    });

    table.onHeaderKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(document.activeElement).toBe(getRows()[0]);

    fireEvent.keyDown(getRows()[0], { key: 'PageDown' });
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(getRows()[2]);
    });

    fireEvent.keyDown(getRows()[2], { key: 'PageUp' });
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(getRows()[0]);
    });

    fireEvent.keyDown(getRows()[1], { key: 'ArrowUp' });
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(getRows()[0]);
    });

    fireEvent.keyDown(getRows()[2], { key: 'Home' });
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(getRows()[0]);
    });

    fireEvent.keyDown(getRows()[0], { key: 'Tab' });
    expect(document.activeElement).toBe(getRows()[0]);

    const detectChangesSpy = vi.spyOn((table as any).cdr, 'detectChanges');
    table.viewportElementRef = {
      nativeElement: { offsetWidth: 140, clientWidth: 120 } as HTMLElement,
    };
    table.onWindowResize();

    expect(table.headerScrollbarOffset).toBe(20);
    expect(detectChangesSpy).toHaveBeenCalled();
  });

  it('supports name sorting while keeping the running-number column visible', async () => {
    await setup({ defaultSortColumn: 'name' });

    await screen.findByText('Alpha Center');

    expect(screen.getByLabelText('table.careerPlayerSearch')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(4);
    expect(getRows()[0]).toHaveTextContent('Gamma Grinder');
  });

  it('covers helper methods and internal branches used by the career tables', async () => {
    const view = await setup({ data: [] as unknown as TableRow[] });
    const table = view.fixture.debugElement.children[0].componentInstance as VirtualTableComponent;

    expect(table.getCellClass({ field: 'name', align: 'left' })).toEqual({
      'col-left': true,
      'col-center': false,
    });
    expect(table.getCellClass({ field: 'score' })).toEqual({
      'col-left': false,
      'col-center': true,
    });

    expect(table.trackRow(1, { id: 'row-1' } as unknown as TableRow)).toBe('row-1');
    expect(table.trackRow(3, {} as TableRow)).toBe('3');

    expect((table as any).compareValues(undefined, undefined)).toBe(0);
    expect((table as any).compareValues(undefined, 'value')).toBe(1);
    expect((table as any).compareValues('value', undefined)).toBe(-1);
    expect((table as any).compareValues('2', '10')).toBe(-8);
    expect((table as any).compareValues('Beta', 'Alpha')).toBeGreaterThan(0);

    expect((table as any).resolveColumnTrack('firstSeason')).toEqual({
      minWidth: 72,
      track: 'minmax(72px, 0.9fr)',
    });
    expect((table as any).resolveColumnTrack('regularGames')).toEqual({
      minWidth: 88,
      track: 'minmax(88px, 1.05fr)',
    });
    expect((table as any).resolveColumnTrack('unknown')).toEqual({
      minWidth: 80,
      track: 'minmax(80px, 1fr)',
    });

    table.headerScrollbarOffset = 7;
    table.viewportElementRef = undefined;
    (table as any).syncViewportMetrics();
    expect(table.headerScrollbarOffset).toBe(0);
  });
});
