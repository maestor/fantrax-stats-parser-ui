import { Component, signal } from '@angular/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import { Chart } from 'chart.js';
import { TranslateTestingModule } from '@testing/translate-testing';
import { Player, Goalie } from '@services/api.service';
import { PositionFilter } from '@services/filter.service';
import { slicedPlayers, slicedGoalies, polyfillJsdom, polyfillMatchMedia } from '../../../testing/behavior-test-utils';
import { PlayerCardGraphsComponent } from './player-card-graphs.component';

const players = slicedPlayers as unknown as Player[];

@Component({
  imports: [PlayerCardGraphsComponent],
  template: `<app-player-card-graphs [data]="data()" [viewContext]="context()" [positionFilter]="position()" />`,
})
class GraphHostComponent {
  readonly data = signal<Player | Goalie>(players[0]);
  readonly context = signal<'combined' | 'season'>('combined');
  readonly position = signal<PositionFilter>('all');
}

describe('Player card graph rendering', () => {
  beforeEach(() => { polyfillJsdom(); polyfillMatchMedia(); });

  it('preserves chosen metrics across chart modes and players and plots position-relative scores', async () => {
    const view = await render(GraphHostComponent, { imports: [TranslateTestingModule] });
    const chart = () => Chart.getChart(view.container.querySelector('canvas')!);
    await waitFor(() => expect(chart()?.data.datasets.length).toBe(2));
    fireEvent.click(screen.getByRole('checkbox', { name: 'tableColumn.goals' }));
    await waitFor(() => expect(chart()?.data.datasets.map((dataset) => dataset.label)).toContain('tableColumn.goals'));
    fireEvent.click(screen.getByRole('button', { name: 'graphs.switchToRadar' }));
    await waitFor(() => expect(chart()?.data.datasets[0].label).toBe(players[0].name));
    view.fixture.componentInstance.position.set('F');
    await waitFor(() => expect(chart()?.data.datasets[0].data[0]).toBe(players[0].scoresByPosition!['goals']));
    fireEvent.click(screen.getByRole('button', { name: 'graphs.switchToLine' }));
    expect(await screen.findByRole('checkbox', { name: 'tableColumn.goals', checked: true })).toBeInTheDocument();
    view.fixture.componentInstance.data.set(players[1]);
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'tableColumn.goals' })).toBeChecked());
    await waitFor(() => {
      const firstSeason = [...players[1].seasons!].sort((a, b) => a.season - b.season)[0];
      expect(chart()?.data.datasets[0].data[0]).toBe(firstSeason.scoreByPosition ?? firstSeason.score);
    });
  });

  it('renders goalie radar stats and resets metric choices when the player type changes', async () => {
    const view = await render(GraphHostComponent, { imports: [TranslateTestingModule] });
    fireEvent.click(screen.getByRole('checkbox', { name: 'tableColumn.goals' }));
    view.fixture.componentInstance.data.set(slicedGoalies[0]);
    await screen.findByRole('checkbox', { name: 'tableColumn.wins' });
    expect(screen.queryByRole('checkbox', { name: 'tableColumn.goals' })).not.toBeInTheDocument();
    view.fixture.componentInstance.context.set('season');
    expect(await screen.findByText('graphs.radarInfo')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'graphs.switchToLine' })).not.toBeInTheDocument();
    await waitFor(() => {
      const chart = Chart.getChart(view.container.querySelector('canvas')!);
      expect(chart?.data.datasets[0].label).toBe(slicedGoalies[0].name);
      expect(chart?.data.datasets[0].data.slice(0, 3)).toEqual([
        slicedGoalies[0].scores!['wins'], slicedGoalies[0].scores!['saves'], slicedGoalies[0].scores!['shutouts'],
      ]);
    });
  });
});
