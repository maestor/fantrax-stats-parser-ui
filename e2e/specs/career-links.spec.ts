import { test, expect } from '../fixtures/test-fixture';
import { CAREER_DRAFT_PROFILES } from '../config/career-profiles';
import { fi } from '../config/i18n';
import { careerProfilePath } from '../../src/app/shared/utils/career-profile-url.utils';
import type { components } from '../../src/app/services/api.types.generated';

type DraftGroup = components['schemas']['EntryDraftTeamGroup'] | components['schemas']['OpeningDraftTeamGroup'];

for (const draft of [
  { route: '/draft/entry-drafts', endpoint: '/draft/entry', profiles: CAREER_DRAFT_PROFILES.entry, source: 'entry-drafts', backLabel: 'career.profile.backEntryDrafts' },
  { route: '/draft/opening-draft', endpoint: '/draft/original', profiles: CAREER_DRAFT_PROFILES.opening, source: 'opening-draft', backLabel: 'career.profile.backOpeningDraft' },
]) {
  for (const kind of ['player', 'goalie'] as const) {
    test(`${draft.route} opens a ${kind} career by keyboard`, async ({ page }) => {
      const response = page.waitForResponse((res) => new URL(res.url()).pathname.endsWith(draft.endpoint) && res.ok());
      await page.goto(draft.route);
      const groups = await (await response).json() as DraftGroup[];
      const group = groups.find((group) => {
        const picks = 'seasons' in group ? group.seasons.flatMap((season) => season.picks) : group.picks;
        return picks.some((pick) => pick.careerProfile?.id === draft.profiles[kind].id);
      })!;
      const picks = 'seasons' in group ? group.seasons.flatMap((season) => season.picks) : group.picks;
      const pick = picks.find((pick) => pick.careerProfile?.id === draft.profiles[kind].id)!;
      const profile = pick.careerProfile!;
      const header = page.getByRole('button', { name: group.team.name, exact: true });
      if (await header.getAttribute('aria-expanded') !== 'true') await header.click();
      const link = page.getByRole('link', { name: pick.draftedPlayer!, exact: true }).first();
      await expect(link).toHaveAttribute('href', careerProfilePath(pick.draftedPlayer!, profile.id, kind) + `?from=${draft.source}`);
      await expect(link).toHaveAttribute('tabindex', '-1');
      await link.focus();
      await link.press('Enter');
      await expect(page).toHaveURL(new RegExp(`/career/${kind === 'player' ? 'players' : 'goalies'}/[^/]+-${profile.id}[?]from=${draft.source}$`));
      await expect(page.getByRole('heading', { name: pick.draftedPlayer!, exact: true })).toBeFocused();
      const back = page.getByRole('link', { name: new RegExp(fi(draft.backLabel)) });
      await expect(back).toHaveAttribute('href', draft.route);
      await back.click();
      await expect(page).toHaveURL(draft.route);
    });
  }
}

test('career highlights expose native profile links and follow Enter', async ({ page }) => {
  await page.goto('/career/highlights');
  const link = page.getByRole('link', { name: 'F Jamie Benn', exact: true }).first();
  await expect(link).toHaveAttribute('href', /\/career\/(players|goalies)\/[^/]+-[^/]+\?from=career-highlights$/);
  const href = await link.getAttribute('href');
  await link.focus();
  await link.press('Enter');
  await expect(page).toHaveURL(href!);
  await expect(page.getByRole('heading', { name: 'Jamie Benn', exact: true })).toBeFocused();
  const back = page.getByRole('link', { name: new RegExp(fi('career.profile.backHighlights')) });
  await expect(back).toHaveAttribute('href', '/career/highlights');
  await back.click();
  await expect(page).toHaveURL('/career/highlights');
});

test('category contributors link to skater and goalie careers', async ({ page }) => {
  for (const [category, list, name] of [['goals', 'players', 'Jamie Benn'], ['wins', 'goalies', 'Jake Oettinger']] as const) {
    await page.goto('/category-stats');
    const row = page.getByRole('row').filter({ has: page.getByRole('cell', { name: fi(`tableColumn.${category}`), exact: true }) });
    await row.click();
    const link = page.locator('.expanded-season-row').getByRole('link', { name, exact: true });
    await expect(link).toHaveAttribute('href', new RegExp(`/career/${list}/[^/]+-[^/]+[?]from=category-stats$`));
    await link.focus();
    await link.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/career/${list}/`));
    await expect(page.getByRole('heading', { name, exact: true })).toBeFocused();
    const back = page.getByRole('link', { name: new RegExp(fi('career.profile.backCategoryStats')) });
    await expect(back).toHaveAttribute('href', '/category-stats');
    await back.click();
    await expect(page).toHaveURL('/category-stats');
  }
});
