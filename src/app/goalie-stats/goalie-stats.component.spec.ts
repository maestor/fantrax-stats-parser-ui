import { fireEvent, render, screen, within } from '@testing-library/angular';

import { AppComponent } from '../app.component';
import {
  getBehaviorTestConfig,
  polyfillJsdom,
  polyfillMatchMedia,
  seedLocalStorage,
  slicedGoalies,
} from '../testing/behavior-test-utils';
describe('GoalieStatsComponent — desktop user flow', { timeout: 60_000 }, () => {
  beforeEach(() => {
    polyfillJsdom();
    polyfillMatchMedia();
    seedLocalStorage();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('supports a goalie-only stats flow from page filters to the player card graphs tab', async () => {
    await render(
      AppComponent,
      getBehaviorTestConfig({ isMobile: false, goalies: slicedGoalies })
    );

    const goalieStatsTab = await screen.findByRole(
      'tab',
      { name: 'link.goalieStats' },
      { timeout: 5000 }
    );
    fireEvent.click(goalieStatsTab);

    const goalieName = slicedGoalies[0].name;
    await screen.findByText(goalieName, {}, { timeout: 5000 });

    expect(screen.queryByText('positionFilter.label')).not.toBeInTheDocument();

    const reportCombobox = screen.getByRole('combobox', { name: /reportType\.selector/ });
    fireEvent.click(reportCombobox);
    fireEvent.click(await screen.findByRole('option', { name: 'reportType.playoffs' }));

    await vi.waitFor(() => {
      expect(reportCombobox).toHaveTextContent('reportType.playoffs');
    });

    const seasonCombobox = screen.getByRole('combobox', { name: /season\.selector/ });
    fireEvent.click(seasonCombobox);
    fireEvent.click(await screen.findByRole('option', { name: '2023-2024' }));

    await vi.waitFor(() => {
      expect(seasonCombobox).toHaveTextContent('2023-2024');
    });

    fireEvent.click(screen.getByRole('button', { name: /settingsPanel\.settings/ }));
    const statsModeToggle = screen.getByRole('switch', { name: 'statsModeToggle' });
    fireEvent.click(statsModeToggle);

    await vi.waitFor(() => {
      expect(statsModeToggle).toHaveAttribute('aria-checked', 'true');
      expect(screen.queryByText('tableColumnShort.score')).not.toBeInTheDocument();
      expect(screen.getByText('tableColumnShort.scoreAdjustedByGames')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('table.playerSearch');
    fireEvent.input(searchInput, { target: { value: goalieName } });

    await vi.waitFor(() => {
      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(2);
    });

    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });

    await vi.waitFor(() => {
      expect(document.activeElement?.textContent).toContain(goalieName);
    });

    fireEvent.keyDown(document.activeElement as Element, { key: 'Enter' });

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).queryByRole('switch', { name: /playerCardPositionFilter\./ })
    ).not.toBeInTheDocument();
    expect(within(dialog).getByRole('tab', { name: 'playerCard.bySeason' })).toBeInTheDocument();
    expect(within(dialog).getByRole('tab', { name: 'playerCard.graphs' })).toBeInTheDocument();

    const graphsTab = within(dialog).getByRole('tab', { name: 'playerCard.graphs' });
    fireEvent.click(graphsTab);

    await vi.waitFor(() => {
      expect(graphsTab).toHaveAttribute('aria-selected', 'true');
    });
  });
});
