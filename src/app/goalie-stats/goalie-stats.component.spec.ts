import { fireEvent, render, screen, within } from '@testing-library/angular';

import { AppComponent } from '../app.component';
import {
  getBehaviorTestConfig,
  polyfillJsdom,
  polyfillMatchMedia,
  seedLocalStorage,
  slicedGoalies,
} from '../testing/behavior-test-utils';
import { toSlug } from '@shared/utils/slug.utils';

describe('GoalieStatsComponent — desktop user flow', { timeout: 60_000 }, () => {
  const writeTextMock = vi.fn<(_: string) => Promise<void>>();

  beforeEach(() => {
    polyfillJsdom();
    polyfillMatchMedia();
    seedLocalStorage();

    writeTextMock.mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
    });
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('supports a goalie-only stats flow from page filters to graphs-tab copy link', async () => {
    await render(
      AppComponent,
      getBehaviorTestConfig({ isMobile: false, goalies: slicedGoalies })
    );

    fireEvent.click(screen.getByRole('tab', { name: 'link.goalieStats' }));

    const goalieName = slicedGoalies[0].name;
    await screen.findByText(goalieName, {}, { timeout: 5000 });

    expect(screen.queryByText('positionFilter.label')).not.toBeInTheDocument();
    expect(screen.getByText('statsModeToggle')).toBeInTheDocument();
    expect(screen.getByText('minGamesSlider.label')).toBeInTheDocument();

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

    fireEvent.click(within(dialog).getByRole('tab', { name: 'playerCard.graphs' }));
    expect(
      await within(dialog).findByRole('button', { name: 'graphs.switchToRadar' })
    ).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'playerCard.copyLink' }));

    await vi.waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(
        `${window.location.origin}/goalie/colorado/${toSlug(goalieName)}?tab=graphs`
      );
    });
  });
});
