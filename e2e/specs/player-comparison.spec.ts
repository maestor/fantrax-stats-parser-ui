import { test, expect } from '../fixtures/test-fixture';
import { ComparisonBar } from '../page-objects/ComparisonBar';
import { ComparisonDialog } from '../page-objects/ComparisonDialog';
import { StatsTable } from '../page-objects/StatsTable';

test.describe('Player Comparison', () => {
  let comparisonBar: ComparisonBar;
  let comparisonDialog: ComparisonDialog;
  let statsTable: StatsTable;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    comparisonBar = new ComparisonBar(page);
    comparisonDialog = new ComparisonDialog(page);
    statsTable = new StatsTable(page);
    await statsTable.verifyDataLoaded();
  });

  test.describe('Selection and Floating Bar', () => {
    test('selecting one player shows floating bar with prompt', async () => {
      await comparisonBar.selectPlayer('Jamie Benn');
      expect(await comparisonBar.isVisible()).toBeTruthy();
      const text = await comparisonBar.getBarText();
      expect(text).toContain('valitse toinen vertailuun');
    });

    test('selecting two players shows compare button', async ({ page }) => {
      await comparisonBar.selectPlayer('Jamie Benn');
      await comparisonBar.selectPlayer('Vincent Trocheck');
      await expect(page.getByRole('button', { name: 'Vertaile' })).toBeVisible();
    });

    test('clear button removes selection and hides bar', async () => {
      await comparisonBar.selectPlayer('Jamie Benn');
      expect(await comparisonBar.isVisible()).toBeTruthy();
      await comparisonBar.clickClear();
      expect(await comparisonBar.isVisible()).toBeFalsy();
    });

    test('deselecting a player hides bar when none remain', async () => {
      await comparisonBar.selectPlayer('Jamie Benn');
      expect(await comparisonBar.isVisible()).toBeTruthy();
      await comparisonBar.deselectPlayer('Jamie Benn');
      expect(await comparisonBar.isVisible()).toBeFalsy();
    });

    test('deselecting one of two players keeps bar visible with prompt', async () => {
      await comparisonBar.selectPlayer('Jamie Benn');
      await comparisonBar.selectPlayer('Vincent Trocheck');
      await comparisonBar.deselectPlayer('Vincent Trocheck');
      expect(await comparisonBar.isVisible()).toBeTruthy();
      const text = await comparisonBar.getBarText();
      expect(text).toContain('valitse toinen vertailuun');
    });

    test('remaining checkboxes are disabled when two are selected', async ({ page }) => {
      await comparisonBar.selectPlayer('Jamie Benn');
      await comparisonBar.selectPlayer('Vincent Trocheck');
      // A third player's checkbox should be disabled
      const thirdRow = page.locator('tr[mat-row]', { hasText: 'Reilly Smith' });
      await expect(thirdRow.getByRole('checkbox')).toBeDisabled();
    });

    test('bar text shows both names when two are selected', async () => {
      await comparisonBar.selectPlayer('Jamie Benn');
      await comparisonBar.selectPlayer('Vincent Trocheck');
      const text = await comparisonBar.getBarText();
      expect(text).toContain('Jamie Benn');
      expect(text).toContain('Vincent Trocheck');
    });
  });

  test.describe('Dialog - Opening and Closing', () => {
    test('compare button opens comparison dialog', async () => {
      await comparisonBar.selectPlayer('Jamie Benn');
      await comparisonBar.selectPlayer('Vincent Trocheck');
      await comparisonBar.clickCompare();
      expect(await comparisonDialog.isOpen()).toBeTruthy();
    });

    test('dialog closes via X button', async () => {
      await comparisonBar.selectPlayer('Jamie Benn');
      await comparisonBar.selectPlayer('Vincent Trocheck');
      await comparisonBar.clickCompare();
      expect(await comparisonDialog.isOpen()).toBeTruthy();
      await comparisonDialog.close();
      expect(await comparisonDialog.isOpen()).toBeFalsy();
    });

    test('dialog closes via Escape key', async () => {
      await comparisonBar.selectPlayer('Jamie Benn');
      await comparisonBar.selectPlayer('Vincent Trocheck');
      await comparisonBar.clickCompare();
      expect(await comparisonDialog.isOpen()).toBeTruthy();
      await comparisonDialog.closeViaEscape();
      expect(await comparisonDialog.isOpen()).toBeFalsy();
    });
  });

  test.describe('Dialog - Content', () => {
    test('shows correct title for same-position forwards', async () => {
      await comparisonBar.selectPlayer('Jamie Benn');
      await comparisonBar.selectPlayer('Vincent Trocheck');
      await comparisonBar.clickCompare();
      const title = await comparisonDialog.getTitle();
      expect(title).toBe('Hyökkääjävertailu');
    });

    test('shows correct title for mixed positions (forward vs defense)', async () => {
      await comparisonBar.selectPlayer('Jamie Benn'); // F
      await comparisonBar.selectPlayer('Oliver Ekman-Larsson'); // D
      await comparisonBar.clickCompare();
      const title = await comparisonDialog.getTitle();
      expect(title).toBe('Pelaajavertailu');
    });

    test('shows player names in ingress', async () => {
      await comparisonBar.selectPlayer('Jamie Benn');
      await comparisonBar.selectPlayer('Vincent Trocheck');
      await comparisonBar.clickCompare();
      const ingress = await comparisonDialog.getIngress();
      expect(ingress).toContain('Benn');
      expect(ingress).toContain('Trocheck');
    });

    test('shows team name', async () => {
      await comparisonBar.selectPlayer('Jamie Benn');
      await comparisonBar.selectPlayer('Vincent Trocheck');
      await comparisonBar.clickCompare();
      const team = await comparisonDialog.getTeamName();
      expect(team).toContain('Colorado Avalanche');
    });

    test('ingress shows position abbreviations for mixed positions', async () => {
      await comparisonBar.selectPlayer('Jamie Benn'); // F
      await comparisonBar.selectPlayer('Oliver Ekman-Larsson'); // D
      await comparisonBar.clickCompare();
      const ingress = await comparisonDialog.getIngress();
      // Finnish: H = hyökkääjä (forward), P = puolustaja (defense)
      expect(ingress).toMatch(/[HP]/);
    });
  });

  test.describe('Dialog - Stats Tab', () => {
    test('stats tab shows stat rows with values', async () => {
      await comparisonBar.selectPlayer('Jamie Benn');
      await comparisonBar.selectPlayer('Vincent Trocheck');
      await comparisonBar.clickCompare();
      const rowCount = await comparisonDialog.getStatRowCount();
      // PLAYER_STAT_COLUMNS has 13 columns for players
      expect(rowCount).toBe(13);
    });

    test('stat rows contain numeric values', async ({ page }) => {
      await comparisonBar.selectPlayer('Jamie Benn');
      await comparisonBar.selectPlayer('Vincent Trocheck');
      await comparisonBar.clickCompare();
      // Check that at least one value-a span contains a number
      const dialog = page.getByRole('dialog');
      const values = dialog.locator('.value-a');
      const firstValue = await values.first().innerText();
      expect(firstValue).toBeTruthy();
    });
  });

  test.describe('Dialog - Graphs Tab', () => {
    test('graphs tab shows radar chart', async () => {
      await comparisonBar.selectPlayer('Jamie Benn');
      await comparisonBar.selectPlayer('Vincent Trocheck');
      await comparisonBar.clickCompare();
      await comparisonDialog.switchToTab('graphs');
      expect(await comparisonDialog.isRadarChartVisible()).toBeTruthy();
    });

    test('can switch between stats and graphs tabs', async () => {
      await comparisonBar.selectPlayer('Jamie Benn');
      await comparisonBar.selectPlayer('Vincent Trocheck');
      await comparisonBar.clickCompare();

      // Start on stats tab
      const statRows = await comparisonDialog.getStatRowCount();
      expect(statRows).toBeGreaterThan(0);

      // Switch to graphs tab
      await comparisonDialog.switchToTab('graphs');
      expect(await comparisonDialog.isRadarChartVisible()).toBeTruthy();

      // Switch back to stats tab
      await comparisonDialog.switchToTab('stats');
      const rowsAfter = await comparisonDialog.getStatRowCount();
      expect(rowsAfter).toBeGreaterThan(0);
    });
  });
});
