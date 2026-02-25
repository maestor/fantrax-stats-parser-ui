import { ComponentFixture, TestBed } from '@angular/core/testing';
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
    expect(noData?.textContent).toContain('');
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
});
