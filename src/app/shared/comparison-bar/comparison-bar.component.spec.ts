import { fireEvent, render, screen } from '@testing-library/angular';

import { AppComponent } from '../../app.component';
import {
  getBehaviorTestConfig,
  polyfillJsdom,
  seedLocalStorage,
  slicedGoalies,
  slicedPlayers,
} from '../../testing/behavior-test-utils';
import type { Goalie } from '@services/api.service';

describe('Comparison flow — desktop user behavior', { timeout: 150_000 }, () => {
  const extendedGoalies = slicedGoalies.slice(0, 2).map((goalie, index) => ({
    ...goalie,
    gaa: index === 0 ? '2.10' : '2.48',
    savePercent: index === 0 ? '0.921' : '0.914',
    scores: {
      ...(goalie.scores ?? {}),
      gaa: index === 0 ? 100 : 88,
      savePercent: index === 0 ? 97 : 91,
    },
  })) as unknown as Goalie[];

  beforeEach(() => {
    polyfillJsdom();
    seedLocalStorage();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('shows selection progression and opens the player comparison dialog', async () => {
    await render(AppComponent, getBehaviorTestConfig({ isMobile: false }));

    await screen.findByText(slicedPlayers[0].name, {}, { timeout: 5000 });

    const [firstCheckbox, secondCheckbox] = screen.getAllByRole('checkbox');

    fireEvent.click(firstCheckbox);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'comparison.compare' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'comparison.clear' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'comparison.clear' }));
    await vi.waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    fireEvent.click(firstCheckbox);
    fireEvent.click(secondCheckbox);

    await vi.waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(slicedPlayers[0].name);
      expect(screen.getByRole('status')).toHaveTextContent(slicedPlayers[1].name);
    });

    fireEvent.click(screen.getByRole('button', { name: 'comparison.compare' }));

    const closeButton = await screen.findByRole('button', {
      name: 'a11y.closeComparisonDialog',
    }, {
      timeout: 15000,
    });
    expect(screen.getByText('comparison.playerTitle')).toBeInTheDocument();
    expect(
      screen.getByText('tableColumn.name', { selector: '.stat-label' })
    ).toBeInTheDocument();
    expect(screen.queryByText('graphs.radarInfo')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'comparison.graphsTab' }));
    expect(await screen.findByText('graphs.radarInfo')).toBeInTheDocument();

    fireEvent.click(closeButton);

    await vi.waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'a11y.closeComparisonDialog' })
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  it('clears selection on context switch and supports goalie comparison with extended stats', async () => {
    await render(
      AppComponent,
      getBehaviorTestConfig({
        isMobile: false,
        goalies: extendedGoalies,
      })
    );

    await screen.findByText(slicedPlayers[0].name, {}, { timeout: 5000 });

    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    expect(screen.getByRole('status')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'link.goalieStats' }));
    await screen.findByText(extendedGoalies[0].name, {}, { timeout: 5000 });

    await vi.waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    const [firstGoalieCheckbox, secondGoalieCheckbox] = screen.getAllByRole('checkbox');
    fireEvent.click(firstGoalieCheckbox);
    fireEvent.click(secondGoalieCheckbox);
    fireEvent.click(screen.getByRole('button', { name: 'comparison.compare' }));

    await screen.findByRole('button', { name: 'a11y.closeComparisonDialog' }, { timeout: 15000 });
    expect(screen.getByText('tableColumn.gaa')).toBeInTheDocument();
    expect(screen.getByText('tableColumn.savePercent')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'comparison.graphsTab' }));
    expect(await screen.findByText('graphs.radarInfo')).toBeInTheDocument();
  });

  it('shows stats-only comparison content when stats-per-game is enabled', async () => {
    await render(AppComponent, getBehaviorTestConfig({ isMobile: false }));

    await screen.findByText(slicedPlayers[0].name, {}, { timeout: 5000 });

    fireEvent.click(screen.getByRole('button', { name: /settingsPanel\.settings/ }));
    const statsModeToggle = await screen.findByRole('switch', { name: 'statsModeToggle' });
    fireEvent.click(statsModeToggle);

    await vi.waitFor(() => {
      expect(statsModeToggle).toHaveAttribute('aria-checked', 'true');
    });

    const [firstCheckbox, secondCheckbox] = screen.getAllByRole('checkbox');
    fireEvent.click(firstCheckbox);
    fireEvent.click(secondCheckbox);
    fireEvent.click(screen.getByRole('button', { name: 'comparison.compare' }));

    await screen.findByRole('button', { name: 'a11y.closeComparisonDialog' }, { timeout: 15000 });
    expect(screen.getByText('comparison.playerTitle')).toBeInTheDocument();
    expect(
      screen.queryByRole('tab', { name: 'comparison.graphsTab' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('tableColumn.scoreAdjustedByGames', { selector: '.stat-label' })
    ).toBeInTheDocument();
  });
});
