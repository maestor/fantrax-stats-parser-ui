import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { fireEvent, render, screen, within } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';

import { AppComponent } from '../../../app.component';
import {
  getBehaviorTestConfig,
  openDashboardSettingsDrawer,
  polyfillJsdom,
  provideDisabledMaterialAnimations,
  seedLocalStorage,
  slicedPlayers,
} from '../../../testing/behavior-test-utils';
import type { Player } from '@services/api.service';
import { FilterService } from '@services/filter.service';
import { MinGamesSliderComponent } from './min-games-slider.component';

@Component({
  imports: [MinGamesSliderComponent],
  template: `<app-min-games-slider context="player" [maxGames]="maxGames" />`,
})
class MinGamesSliderHostComponent {
  maxGames = 10;
}

describe('MinGamesSliderComponent — player stats user flow', { timeout: 60_000 }, () => {
  const highGamesPlayer = {
    ...slicedPlayers[0],
    id: 'high-games-player',
    name: 'High Games Player',
    games: 10,
  } as unknown as Player;
  const lowGamesPlayer = {
    ...slicedPlayers[1],
    id: 'low-games-player',
    name: 'Low Games Player',
    games: 6,
  } as unknown as Player;

  beforeEach(() => {
    polyfillJsdom();
    seedLocalStorage();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('filters the player table when the minimum games threshold increases', async () => {
    const { fixture } = await render(
      AppComponent,
      getBehaviorTestConfig({
        isMobile: false,
        players: [highGamesPlayer, lowGamesPlayer],
      })
    );

    const playerTable = await screen.findByRole('table');
    await screen.findByText(highGamesPlayer.name, {}, { timeout: 5000 });
    expect(within(playerTable).getByText(lowGamesPlayer.name)).toBeInTheDocument();

    await openDashboardSettingsDrawer();

    const minGamesSlider = await screen.findByRole('slider', {
      name: 'minGamesSlider.ariaLabel',
    });

    fireEvent.input(minGamesSlider, { target: { value: '7' } });
    fireEvent.change(minGamesSlider, { target: { value: '7' } });

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(minGamesSlider).toHaveValue('7');
      expect(within(playerTable).getByText(highGamesPlayer.name)).toBeInTheDocument();
      expect(within(playerTable).queryByText(lowGamesPlayer.name)).not.toBeInTheDocument();
    });
  });

  it('clamps an impossible minimum games filter to the current maximum', async () => {
    const { fixture } = await render(MinGamesSliderHostComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [provideDisabledMaterialAnimations()],
    });
    const filterService = TestBed.inject(FilterService);

    filterService.updatePlayerFilters({ minGames: 12 });
    fixture.detectChanges();

    const minGamesSlider = await screen.findByRole('slider', {
      name: 'minGamesSlider.ariaLabel',
    });

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(minGamesSlider).toHaveValue('10');
      expect(filterService.playerFiltersSignal().minGames).toBe(10);
    });
  });
});
