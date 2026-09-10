import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import { TranslateTestingModule } from '@testing/translate-testing';

import { LeaderboardsComponent } from './leaderboards.component';
import { CareerComponent } from '../career/career.component';
import { DraftComponent } from '../draft/draft.component';

@Component({ template: '<p>Route content</p>' })
class RouteContentComponent {}

describe.each([
  {
    name: 'leaderboards', component: LeaderboardsComponent, paths: ['regular', 'transactions'],
    labels: ['leaderboards.tabs.regular', 'leaderboards.tabs.transactions'],
  },
  {
    name: 'career', component: CareerComponent, paths: ['players', 'goalies'],
    labels: ['career.tabs.players', 'career.tabs.goalies'],
  },
  {
    name: 'draft', component: DraftComponent, paths: ['entry-drafts', 'statistics'],
    labels: ['draft.tabs.entryDrafts', 'draft.tabs.statistics'],
  },
])('$name route navigation', ({ name, component, paths, labels }) => {
  it('keeps the current tab selected through clicks, query changes, and leaving and returning', async () => {
    await render('<router-outlet />', {
      imports: [RouterOutlet, TranslateTestingModule],
      providers: [provideRouter([
        { path: name, component, children: paths.map((path) => ({ path, component: RouteContentComponent })) },
        { path: 'outside', component: RouteContentComponent },
      ])],
    });
    const router = TestBed.inject(Router);
    await router.navigateByUrl(`/${name}/${paths[0]}?search=test`);
    const firstTab = await screen.findByRole('tab', { name: labels[0], selected: true });
    expect(firstTab).toHaveAttribute('aria-current', 'page');

    fireEvent.click(screen.getByRole('tab', { name: labels[1] }));
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: labels[1], selected: true })).toHaveAttribute('aria-current', 'page');
    });
    expect(firstTab).toHaveAttribute('aria-selected', 'false');

    await router.navigateByUrl(`/${name}/${paths[1]}?search=changed#details`);
    expect(screen.getByRole('tab', { name: labels[1], selected: true })).toHaveAttribute('aria-current', 'page');

    await router.navigateByUrl('/outside');
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    await router.navigateByUrl(`/${name}/${paths[0]}`);
    expect(await screen.findByRole('tab', { name: labels[0], selected: true })).toHaveAttribute('aria-current', 'page');
  });
});
