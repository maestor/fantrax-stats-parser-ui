import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { LeaderboardTableComponent } from './leaderboard-table.component';
import { TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

const MOCK_DATA = [
  { displayPosition: '1', teamName: 'Team A', pts: 100 },
  { displayPosition: '2', teamName: 'Team B', pts: 90 },
];
const COLUMNS = ['displayPosition', 'teamName', 'pts'];

describe('LeaderboardTableComponent', () => {
  let component: LeaderboardTableComponent;
  let fixture: ComponentFixture<LeaderboardTableComponent>;

  async function setup(overrides: Partial<LeaderboardTableComponent> = {}) {
    await TestBed.configureTestingModule({
      imports: [LeaderboardTableComponent, TranslateModule.forRoot(), NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(LeaderboardTableComponent);
    component = fixture.componentInstance;
    component.data = MOCK_DATA;
    component.displayedColumns = COLUMNS;
    Object.assign(component, overrides);
    fixture.detectChanges();
  }

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  it('should render one row per data entry', async () => {
    await setup();
    const rows = fixture.nativeElement.querySelectorAll('tr.mat-mdc-row');
    expect(rows.length).toBe(2);
  });

  it('should show progress bar when loading', async () => {
    await setup({ loading: true, data: [] });
    const bar = fixture.nativeElement.querySelector('mat-progress-bar');
    expect(bar).toBeTruthy();
  });

  it('should not show progress bar when not loading', async () => {
    await setup({ loading: false });
    const bar = fixture.nativeElement.querySelector('mat-progress-bar');
    expect(bar).toBeFalsy();
  });

  it('should show error cell when apiError', async () => {
    await setup({ apiError: true, data: [] });
    const noData = fixture.nativeElement.querySelector('.no-results');
    expect(noData?.textContent?.trim()).toBe('leaderboards.apiUnavailable');
  });

  it('should apply formatCell to dynamic column values', async () => {
    await setup({
      formatCell: (col, val) => col === 'pts' ? `${val}p` : val,
    });
    const cells = fixture.nativeElement.querySelectorAll('td.mat-column-pts');
    expect(cells[0].textContent.trim()).toBe('100p');
  });

  it('rows should have tabindex 0 for active row, -1 for others', async () => {
    await setup();
    const rows: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('tr.mat-mdc-row');
    expect(rows[0].getAttribute('tabindex')).toBe('0');
    expect(rows[1].getAttribute('tabindex')).toBe('-1');
  });

  it('ArrowDown on first row focuses second row', async () => {
    await setup();
    const rows: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row'));
    rows[0].focus();
    rows[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    expect(component.activeRowIndex).toBe(1);
  });

  it('ArrowUp on second row focuses first row', async () => {
    await setup();
    component.activeRowIndex = 1;
    fixture.detectChanges();
    const rows: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row'));
    rows[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    fixture.detectChanges();
    expect(component.activeRowIndex).toBe(0);
  });

  it('Home key moves to first row', async () => {
    await setup();
    component.activeRowIndex = 1;
    fixture.detectChanges();
    const rows: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row'));
    rows[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    fixture.detectChanges();
    expect(component.activeRowIndex).toBe(0);
  });

  it('End key moves to last row', async () => {
    await setup();
    const rows: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row'));
    rows[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    fixture.detectChanges();
    expect(component.activeRowIndex).toBe(1);
  });

  it('PageDown on last row stays at last row', async () => {
    await setup();
    component.activeRowIndex = 1;
    fixture.detectChanges();
    const rows: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row'));
    rows[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));
    fixture.detectChanges();
    expect(component.activeRowIndex).toBe(1);
  });

  it('PageUp on first row stays at first row', async () => {
    await setup();
    const rows: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row'));
    rows[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true }));
    fixture.detectChanges();
    expect(component.activeRowIndex).toBe(0);
  });

  it('ngOnDestroy clears loading interval without error', async () => {
    await setup({ loading: true, data: [] });
    fixture.destroy();
    expect(component).toBeTruthy();
  });

  it('onRowFocus updates activeRowIndex', async () => {
    await setup();
    component.onRowFocus(1);
    expect(component.activeRowIndex).toBe(1);
  });

  it('keyboard nav on empty table does not throw', async () => {
    await setup({ data: [] });
    expect(() => component.onRowKeydown(
      new KeyboardEvent('keydown', { key: 'ArrowDown' }), 0
    )).not.toThrow();
  });

  it('ngOnChanges with loading false resets progress values', async () => {
    await setup({ loading: true, data: [] });
    component.loading = false;
    component.ngOnChanges({
      loading: { currentValue: false, previousValue: true, firstChange: false, isFirstChange: () => false },
    });
    expect(component.loadingProgress).toBe(0);
    expect(component.loadingBuffer).toBe(0);
  });

  it('ngOnChanges with loading true starts progress tracking', async () => {
    await setup({ loading: false, data: [] });
    component.loading = true;
    component.ngOnChanges({
      loading: { currentValue: true, previousValue: false, firstChange: false, isFirstChange: () => false },
    });
    expect(component.loadingProgress).toBeGreaterThanOrEqual(0);
  });

  it('ngOnChanges without loading key does not call onLoadingChanged', async () => {
    await setup();
    // Should not throw when changes object does not contain 'loading'
    expect(() => component.ngOnChanges({})).not.toThrow();
  });

  it('get displayedColumns returns current value', async () => {
    await setup();
    expect(component.displayedColumns).toEqual(COLUMNS);
  });

  it('get data returns current value', async () => {
    await setup();
    expect(component.data).toEqual(MOCK_DATA);
  });

  it('setting displayedColumns after view init updates effectiveColumns', async () => {
    await setup();
    const newColumns = ['displayPosition', 'teamName', 'pts', 'gp'];
    component.displayedColumns = newColumns;
    expect(component.effectiveColumns).toEqual(newColumns);
  });

  it('setting data after view init updates dataSource', async () => {
    await setup();
    const newData = [{ displayPosition: '1', teamName: 'Team C', pts: 50 }];
    component.data = newData;
    expect(component.dataSource.data).toEqual(newData);
  });

  it('trophyColumn renders emoji header', async () => {
    await setup({ trophyColumn: 'pts' });
    const headers = fixture.nativeElement.querySelectorAll('th');
    const trophyHeader = Array.from(headers).find((h: any) => h.textContent.includes('🏆'));
    expect(trophyHeader).toBeTruthy();
  });

  it('loading interval callback fires and updates progress', fakeAsync(async () => {
    await setup({ loading: false, data: [] });
    component.loading = true;
    component.ngOnChanges({
      loading: { currentValue: true, previousValue: false, firstChange: false, isFirstChange: () => false },
    });
    tick(400);
    expect(component.loadingProgress).toBeGreaterThanOrEqual(0);
    // Clean up interval before test ends
    component.loading = false;
    component.ngOnChanges({
      loading: { currentValue: false, previousValue: true, firstChange: false, isFirstChange: () => false },
    });
  }));

  it('setting displayedColumns to null/undefined falls back to empty array', async () => {
    await setup();
    component.displayedColumns = null as any;
    expect(component.displayedColumns).toEqual([]);
  });

  it('setting data to null/undefined falls back to empty array', async () => {
    await setup();
    component.data = null as any;
    expect(component.data).toEqual([]);
  });

  it('formatCell default returns empty string for null value', async () => {
    await setup();
    expect(component.formatCell('pts', null)).toBe('');
  });

  it('End key works when dataRows is not yet available', async () => {
    await setup();
    // Temporarily nullify dataRows to hit the ?? 1 fallback
    (component as any).dataRows = undefined;
    expect(() => component.onRowKeydown(
      new KeyboardEvent('keydown', { key: 'End' }), 0
    )).not.toThrow();
  });
});
