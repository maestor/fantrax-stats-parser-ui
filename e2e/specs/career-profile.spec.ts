import { test, expect } from '../fixtures/test-fixture';
import { fi } from '../config/i18n';
import { CAREER_POPUP_PROFILES, CAREER_PROFILES } from '../config/career-profiles';
import playersFixture from '../fixtures/data/career--players.json';

const inspectTrade = new RegExp(fi('career.profile.inspectTrade'));

test('restores a scrolled virtual list through repeated browser Back and Forward', async ({
  page,
}) => {
  await page.goto('/career/players');
  const search = page.getByRole('searchbox');
  await search.fill('ja');
  const matching = playersFixture
    .filter((row) => row.name.toLowerCase().includes('ja'))
    .sort((left, right) => left.name.localeCompare(right.name, 'fi', { sensitivity: 'base' }));
  const index = matching.findIndex((row) => row.id === CAREER_PROFILES[0].id);
  expect(index).toBeGreaterThan(3);
  const rowHeight = (await page.getByRole('row').nth(1).boundingBox())!.height;
  const viewport = page.getByRole('table').locator('cdk-virtual-scroll-viewport');
  await viewport.evaluate(
    (element, offset) => {
      element.scrollTop = offset;
    },
    (index - 2) * rowHeight,
  );
  const link = page.getByRole('link', { name: /Jamie Benn/ });
  await expect(link).toBeVisible();
  const row = page.getByRole('row').filter({ has: link });
  await row.focus();
  const offset = await viewport.evaluate((element) => element.scrollTop);
  await row.press('Enter');
  await expect(page.getByRole('heading', { name: 'Jamie Benn', exact: true })).toBeFocused();
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.goBack();
    await expect(search).toHaveValue('ja');
    await expect(
      page.getByRole('row').filter({ has: page.getByRole('link', { name: /Jamie Benn/ }) }),
    ).toBeFocused();
    expect(await viewport.evaluate((element) => element.scrollTop)).toBeCloseTo(offset, 0);
    if (attempt === 0) {
      await page.goForward();
      await expect(page.getByRole('heading', { name: 'Jamie Benn', exact: true })).toBeFocused();
    }
  }
});

for (const profile of CAREER_PROFILES) {
  test(`${profile.kind} career links, Material scope selector, visible desktop trades, and list restoration`, async ({
    page,
  }) => {
    const tradeRequests: string[] = [];
    page.on('request', (request) => {
      if (new URL(request.url()).pathname.includes('/transactions/trades/'))
        tradeRequests.push(request.url());
    });
    await page.goto(`/career/${profile.list}`);
    const search = page.getByRole('searchbox');
    await search.fill(profile.name);
    const link = page.getByRole('link', { name: new RegExp(profile.name) });
    await expect(link).toHaveAttribute('href', `/career/${profile.list}/${profile.slug}`);
    const row = page.getByRole('row').filter({ has: link });
    await row.focus();
    await row.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/career/${profile.list}/${profile.slug}$`));
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href', new RegExp(`/career/${profile.list}/${profile.slug}$`),
    );
    await expect(page.getByRole('heading', { name: profile.name, exact: true })).toBeFocused();
    await expect(
      page.getByRole('tab', { name: fi(`career.tabs.${profile.list}`) }),
    ).toHaveAttribute('aria-selected', 'true');
    const seasons = page.getByRole('table', { name: fi('career.profile.seasons'), exact: true });
    await expect(seasons).toBeVisible();
    const scope = page.getByRole('combobox', { name: fi('career.profile.scope') });
    await scope.click();
    await page.getByRole('option', { name: fi('career.profile.scopes.career'), exact: true }).click();
    await expect(scope).toHaveText(fi('career.profile.scopes.career'));
    await expect(page.getByRole('button', { name: inspectTrade })).toHaveCount(0);
    await expect(page.getByText(fi('career.profile.historyNote'), { exact: true })).toHaveCount(1);
    const detail = page.getByRole('region', { name: fi('career.profile.tradeDetails') }).first();
    await expect(detail.getByRole('list').first()).toBeVisible();
    expect(tradeRequests.length).toBeGreaterThan(0);
    await expect(detail.getByRole('heading', { level: 6 }).first()).toContainText(fi('career.profile.received'));
    await page.getByRole('link', { name: new RegExp(fi('career.profile.back')) }).click();
    await expect(search).toHaveValue(profile.name);
    await expect(
      page
        .getByRole('row')
        .filter({ has: page.getByRole('link', { name: new RegExp(profile.name) }) }),
    ).toBeFocused();
  });
}

test('direct career links reload, follow another trade asset, and handle a missing identity', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const profile = CAREER_PROFILES[0];
  await page.goto('/career/players');
  await page.goto(`/career/${profile.list}/${profile.id}`);
  await expect(page).toHaveURL(new RegExp(`/career/${profile.list}/${profile.slug}$`));
  await page.goBack();
  await expect(page).toHaveURL(/\/career\/players$/);
  await page.goForward();
  await expect(page).toHaveURL(new RegExp(`/career/${profile.list}/${profile.slug}$`));
  await expect(page.getByRole('heading', { name: profile.name, exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: profile.name, exact: true })).toBeVisible();
  await page.getByRole('button', { name: inspectTrade }).first().click();
  const links = page
    .getByRole('region', { name: fi('career.profile.tradeDetails') })
    .getByRole('link');
  await expect(links.first()).toBeVisible();
  let destination: string | null = null;
  let assetName = '';
  for (const link of await links.all()) {
    const href = await link.getAttribute('href');
    if (href === `/career/${profile.list}/${profile.slug}`) continue;
    destination = href;
    assetName = await link.innerText();
    await link.click();
    break;
  }
  expect(destination).not.toBeNull();
  await expect(page).toHaveURL(new RegExp(`${destination}$`));
  await expect(page.getByRole('heading', { name: assetName, exact: true })).toBeFocused();
  await page.goto('/career/players/not-a-real-identity');
  await expect(page.getByRole('alert')).toHaveText(fi('career.profile.notFound'));
  await expect(
    page.getByRole('link', { name: new RegExp(fi('career.profile.back')) }),
  ).toHaveAttribute('href', '/career/players');
});

test('mobile trade disclosure loads received packages only when opened', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const tradeRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.includes('/transactions/trades/'))
      tradeRequests.push(request.url());
  });
  await page.goto('/career/players/' + CAREER_PROFILES[0].slug);
  const button = page.getByRole('button', { name: inspectTrade }).first();
  await expect(button).toBeVisible();
  expect(tradeRequests).toHaveLength(0);
  await button.focus();
  await button.press('Enter');
  const detail = page.getByRole('region', { name: fi('career.profile.tradeDetails') });
  await expect(detail.getByRole('list').first()).toBeVisible();
  expect(tradeRequests).toHaveLength(1);
  await button.click();
  await expect(detail).toHaveCount(0);
  await expect(button).toBeFocused();
  await expect(button).toHaveAttribute('aria-expanded', 'false');
});

test('career copy icon confirms in a temporary tooltip without moving page content', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const profile = CAREER_PROFILES[0];
  await page.goto(`/career/${profile.list}/${profile.slug}`);
  const copyButton = page.getByRole('button', { name: fi('career.profile.copyLink') });
  const overview = page.getByRole('heading', { name: fi('career.profile.overview'), exact: true });
  await expect(copyButton).toBeVisible();
  const before = await overview.boundingBox();
  await copyButton.focus();
  await copyButton.press('Enter');
  // Material renders its visual tooltip aria-hidden; aria-describedby supplies the accessible text.
  const tooltip = page.locator('.mat-mdc-tooltip');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveText(fi('career.profile.copied'));
  await expect(copyButton).toHaveAccessibleDescription(fi('career.profile.copied'));
  await expect(copyButton).toBeFocused();
  expect((await overview.boundingBox())!.y).toBe(before!.y);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    `http://localhost:4200/career/${profile.list}/${profile.slug}`,
  );
  await expect(tooltip).not.toBeVisible({ timeout: 4000 });
  await copyButton.hover();
  await expect(tooltip).toHaveText(fi('career.profile.copyLink'));
});

for (const width of [1280, 390]) {
  test(`profile section navigation scrolls smoothly and honors reduced motion at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/career/players/' + CAREER_PROFILES[0].slug);
    const nav = page.getByRole('navigation', { name: fi('career.profile.jumpLabel') });
    await expect(nav).toBeVisible();
    await page.evaluate(() => {
      const target = document.getElementById('career-history')!;
      const positions: number[] = [];
      Object.assign(window, { careerScrollPositions: positions });
      const start = performance.now();
      const sample = () => {
        positions.push(target.getBoundingClientRect().top);
        if (performance.now() - start < 2000) requestAnimationFrame(sample);
      };
      sample();
    });
    await nav.getByRole('button', { name: fi('career.profile.history'), exact: true }).click();
    await expect(page.getByRole('heading', { name: fi('career.profile.history'), exact: true })).toBeFocused();
    await expect.poll(() => page.evaluate(() => {
      const points = (window as unknown as { careerScrollPositions: number[] }).careerScrollPositions;
      const end = points.slice(-3);
      return end.length === 3 && Math.max(...end) - Math.min(...end) < 1 && end[2] < points[0] - 300;
    })).toBe(true);
    const positions = await page.evaluate(() => (window as unknown as { careerScrollPositions: number[] }).careerScrollPositions);
    expect(new Set(positions).size).toBeGreaterThan(10);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await nav.getByRole('button', { name: fi('career.profile.overview'), exact: true }).click();
    const overview = page.getByRole('heading', { name: fi('career.profile.overview'), exact: true });
    await expect(overview).toBeFocused();
    expect((await overview.boundingBox())!.y).toBeCloseTo(96, 0);
  });
}

for (const profile of CAREER_POPUP_PROFILES) {
  for (const source of ['statistics', 'direct']) {
    test(`${profile.kind} ${source} popup links to career and returns to statistics`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      const statsPath = profile.kind === 'goalie' ? '/goalie-stats' : '/player-stats';
      if (source === 'direct') {
        const nameSlug = profile.slug.slice(0, -(profile.id.length + 1));
        await page.goto(`/${profile.kind}/colorado/${nameSlug}`);
      } else {
        await page.goto(statsPath);
        await page.getByRole('searchbox').fill(profile.name);
        await page.getByRole('cell', { name: profile.name, exact: true }).click();
      }
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      const shortcut = dialog.getByRole('link', { name: fi('playerCard.careerLink') });
      const destination = `/career/${profile.list}/${profile.slug}?from=${statsPath.slice(1)}`;
      await expect(shortcut).toHaveAttribute('href', destination);
      const careerBox = (await shortcut.boundingBox())!;
      const closeBox = (await dialog.getByRole('button', { name: fi('a11y.closePlayerCard') }).boundingBox())!;
      const overlapsClose = careerBox.x < closeBox.x + closeBox.width &&
        careerBox.x + careerBox.width > closeBox.x &&
        careerBox.y < closeBox.y + closeBox.height &&
        careerBox.y + careerBox.height > closeBox.y;
      expect(overlapsClose).toBe(false);
      await shortcut.click();
      await expect(page).toHaveURL(new RegExp(destination.replace('?', '\\?') + '$'));
      await expect(dialog).toHaveCount(0);
      await expect(page.getByRole('heading', { name: profile.name, exact: true })).toBeFocused();
      if (profile.kind === 'player' && source === 'statistics') {
        await page.getByRole('button', { name: inspectTrade }).first().click();
        const asset = page.getByRole('region', { name: fi('career.profile.tradeDetails') }).getByRole('link').first();
        await expect(asset).toHaveAttribute('href', /\?from=player-stats$/);
        await asset.click();
      }
      const label = profile.kind === 'goalie' ? 'career.profile.backGoalieStats' : 'career.profile.backPlayerStats';
      const back = page.getByRole('link', { name: new RegExp(fi(label)) });
      await expect(back).toHaveAttribute('href', statsPath);
      await back.click();
      await expect(page).toHaveURL(new RegExp(statsPath + '$'));
      await expect(page.getByRole('searchbox')).toBeVisible();
    });
  }
}
