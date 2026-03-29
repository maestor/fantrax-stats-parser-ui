import { TestBed } from '@angular/core/testing';
import { fireEvent, render, screen } from '@testing-library/angular';
import { Router } from '@angular/router';

import { AppComponent } from './app.component';
import {
  entryDraftsFixture,
  getBehaviorTestConfig,
  openingDraftsFixture,
  polyfillJsdom,
  seedLocalStorage,
} from './testing/behavior-test-utils';

describe('AppComponent — mobile browse routes', { timeout: 60_000 }, () => {
  beforeEach(() => {
    polyfillJsdom();
    seedLocalStorage();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders the career browse routes and highlights navigation on mobile', async () => {
    await render(AppComponent, getBehaviorTestConfig({ isMobile: true }));

    const router = TestBed.inject(Router);
    await router.navigateByUrl('/career/players');

    expect(await screen.findByRole('tab', { name: 'career.tabs.players' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'career.tabs.goalies' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'career.tabs.highlights' })).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByLabelText('table.careerPlayerSearch')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'career.tabs.highlights' }));
    await vi.waitFor(() => {
      expect(router.url).toBe('/career/highlights');
    }, { timeout: 15_000 });

    expect(
      await screen.findByRole(
        'heading',
        { name: 'career.highlights.cards.mostTeamsPlayed.title' },
        { timeout: 15_000 },
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'career.highlights.sections.achievements.title' })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'career.tabs.goalies' }));
    await vi.waitFor(() => {
      expect(router.url).toBe('/career/goalies');
    }, { timeout: 15_000 });

    expect(
      await screen.findByLabelText('table.playerSearch', {}, { timeout: 15_000 })
    ).toBeInTheDocument();
  });

  it('renders the draft browse routes and switches between draft tabs on mobile', async () => {
    await render(AppComponent, getBehaviorTestConfig({ isMobile: true }));

    const router = TestBed.inject(Router);
    await router.navigateByUrl('/draft');

    expect(await screen.findByRole('tab', { name: 'draft.tabs.entryDrafts' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'draft.tabs.openingDraft' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'draft.tabs.statistics' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'draft.tabs.entryDrafts' })).toBeInTheDocument();
    expect(await screen.findByText(entryDraftsFixture[0].team.name)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'draft.tabs.openingDraft' }));
    await vi.waitFor(() => {
      expect(router.url).toBe('/draft/opening-draft');
    }, { timeout: 5_000 });
    expect(
      await screen.findByRole('heading', { name: 'draft.tabs.openingDraft' }, { timeout: 5_000 })
    ).toBeInTheDocument();
    expect(
      await screen.findByText(openingDraftsFixture[0].team.name, {}, { timeout: 5_000 })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'draft.tabs.statistics' }));
    await vi.waitFor(() => {
      expect(router.url).toBe('/draft/statistics');
    }, { timeout: 5_000 });
    expect(
      await screen.findByRole('heading', { name: 'draft.tabs.statistics' }, { timeout: 5_000 })
    ).toBeInTheDocument();
    expect(screen.getByText('draft.statistics.cards.totalPicks.title')).toBeInTheDocument();
  });
});
