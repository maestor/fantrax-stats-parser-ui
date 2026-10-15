import { PLATFORM_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { fireEvent, render, screen, within } from '@testing-library/angular';
import { of, Subject, throwError } from 'rxjs';
import { ApiService, ExpansionDraftGroup } from '@services/api.service';
import { TranslateTestingModule } from '@testing/translate-testing';
import { expansionDraftsFixture } from '../../testing/behavior-test-utils';
import { ExpansionDraftsComponent } from './expansion-drafts.component';

async function setup(getExpansionDrafts = vi.fn(() => of(expansionDraftsFixture)), platform = 'browser') {
  return render(ExpansionDraftsComponent, {
    imports: [TranslateTestingModule],
    providers: [provideRouter([]), { provide: ApiService, useValue: { getExpansionDrafts } }, { provide: PLATFORM_ID, useValue: platform }],
  });
}

describe('Expansion drafts', () => {
  it('shows both drafts immediately with F/D/G groups, source teams, native career links, including history-only identities', async () => {
    await setup();
    const seattle = await screen.findByRole('region', { name: 'Seattle Kraken 2021' });
    const vegas = screen.getByRole('region', { name: 'Vegas Golden Knights 2017' });
    expect(screen.getAllByRole('heading', { level: 4 }).map((heading) => heading.textContent?.trim())).toEqual(['Seattle Kraken 2021', 'Vegas Golden Knights 2017']);
    expect(within(seattle).getAllByRole('heading', { level: 5 }).map((heading) => heading.textContent?.trim())).toEqual(['draft.expansionDrafts.positions.F', 'draft.expansionDrafts.positions.D', 'draft.expansionDrafts.positions.G']);
    expect(within(seattle).getAllByRole('table')).toHaveLength(3);
    const zacha = within(seattle).getByRole('row', { name: 'Pavel Zacha Toronto Maple Leafs' });
    expect(within(zacha).getByRole('link', { name: 'Pavel Zacha' })).toHaveAttribute('href', '/career/players/pavel-zacha-03l0t?from=expansion-drafts');
    expect(within(seattle).getByRole('link', { name: 'Tristan Jarry' })).toHaveAttribute('href', '/career/goalies/tristan-jarry-02yjw?from=expansion-drafts');
    expect(within(vegas).getByRole('link', { name: 'Juuso Hietanen' })).toHaveAttribute('href', '/career/players/juuso-hietanen-04dut?from=expansion-drafts');
    expect(within(vegas).getAllByRole('link')).toHaveLength(30);
  });

  it('keeps a selection with an unresolved identity as plain text', async () => {
    const drafts = structuredClone(expansionDraftsFixture);
    drafts[0].picks[0] = { ...drafts[0].picks[0], draftedPlayer: 'Unresolved Prospect', careerProfile: null };
    await setup(vi.fn(() => of(drafts)));
    expect(await screen.findByRole('rowheader', { name: 'Unresolved Prospect' })).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Unresolved Prospect' })).not.toBeInTheDocument();
  });

  it('announces loading and then a valid empty import', async () => {
    const response = new Subject<ExpansionDraftGroup[]>();
    await setup(vi.fn(() => response));
    expect(screen.getByRole('status')).toHaveTextContent('draft.loading');
    response.next([]);
    expect(await screen.findByText('draft.noResults')).toBeInTheDocument();
  });

  it('allows retrying a failed request', async () => {
    const getDrafts = vi.fn().mockReturnValueOnce(throwError(() => new Error('Unavailable'))).mockReturnValueOnce(of(expansionDraftsFixture));
    await setup(getDrafts);
    expect(screen.getByRole('alert')).toHaveTextContent('draft.apiUnavailable');
    fireEvent.click(screen.getByRole('button', { name: 'career.profile.retry' }));
    expect(await screen.findByRole('region', { name: 'Seattle Kraken 2021' })).toBeInTheDocument();
  });

  it('does not request live data while prerendering', async () => {
    const getDrafts = vi.fn(() => of(expansionDraftsFixture));
    await setup(getDrafts, 'server');
    expect(getDrafts).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('draft.noResults');
  });
});
