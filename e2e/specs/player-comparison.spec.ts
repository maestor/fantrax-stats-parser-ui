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
    test('selection progression: one player shows prompt, two shows compare button and names', async ({ page }) => {
      // Select one player — bar visible with prompt
      await comparisonBar.selectPlayer('Jamie Benn');
      expect(await comparisonBar.isVisible()).toBeTruthy();
      let text = await comparisonBar.getBarText();
      expect(text).toContain('valitse toinen vertailuun');

      // Select second player — compare button visible, both names shown
      await comparisonBar.selectPlayer('Vincent Trocheck');
      await expect(page.getByRole('button', { name: 'Vertaile' })).toBeVisible();
      text = await comparisonBar.getBarText();
      expect(text).toContain('Jamie Benn');
      expect(text).toContain('Vincent Trocheck');
    });

    test('deselecting players updates bar state correctly', async () => {
      // Select two, deselect one — bar stays with prompt
      await comparisonBar.selectPlayer('Jamie Benn');
      await comparisonBar.selectPlayer('Vincent Trocheck');
      await comparisonBar.deselectPlayer('Vincent Trocheck');
      expect(await comparisonBar.isVisible()).toBeTruthy();
      const text = await comparisonBar.getBarText();
      expect(text).toContain('valitse toinen vertailuun');

      // Deselect last — bar hides
      await comparisonBar.deselectPlayer('Jamie Benn');
      expect(await comparisonBar.isVisible()).toBeFalsy();
    });

    test('clear button hides bar and checkboxes disabled at max selection', async ({ page }) => {
      // Select two players
      await comparisonBar.selectPlayer('Jamie Benn');
      await comparisonBar.selectPlayer('Vincent Trocheck');

      // Third player's checkbox should be disabled
      const thirdRow = page.locator('tr[mat-row]', { hasText: 'Reilly Smith' });
      await expect(thirdRow.getByRole('checkbox')).toBeDisabled();

      // Clear removes selection and hides bar
      await comparisonBar.clickClear();
      expect(await comparisonBar.isVisible()).toBeFalsy();
    });
  });

  test.describe('Dialog', () => {
    test('opens via compare button, closes via X and Escape', async () => {
      await comparisonBar.selectPlayer('Jamie Benn');
      await comparisonBar.selectPlayer('Vincent Trocheck');

      // Open and close via X (closing clears selection)
      await comparisonBar.clickCompare();
      expect(await comparisonDialog.isOpen()).toBeTruthy();
      await comparisonDialog.close();
      expect(await comparisonDialog.isOpen()).toBeFalsy();

      // Re-select players since close cleared the selection
      await comparisonBar.selectPlayer('Jamie Benn');
      await comparisonBar.selectPlayer('Vincent Trocheck');

      // Open and close via Escape (closing clears selection)
      await comparisonBar.clickCompare();
      expect(await comparisonDialog.isOpen()).toBeTruthy();
      await comparisonDialog.closeViaEscape();
      expect(await comparisonDialog.isOpen()).toBeFalsy();
    });

    test('stats title and tab shows correct row count with numeric values', async ({ page }) => {
      await comparisonBar.selectPlayer('Jamie Benn');
      await comparisonBar.selectPlayer('Vincent Trocheck');
      await comparisonBar.clickCompare();

      const title = await comparisonDialog.getTitle();
      expect(title).toBe('Pelaajavertailu');

      const rowCount = await comparisonDialog.getStatRowCount();
      expect(rowCount).toBe(14); // Expected number of stats rows

      const dialog = page.getByRole('dialog');
      const firstValue = await dialog.locator('.value-a').first().innerText();
      expect(firstValue).toBeTruthy();
    });

    test('graphs tab shows radar chart and tab switching works', async () => {
      await comparisonBar.selectPlayer('Jamie Benn');
      await comparisonBar.selectPlayer('Vincent Trocheck');
      await comparisonBar.clickCompare();

      // Start on stats tab
      const statRows = await comparisonDialog.getStatRowCount();
      expect(statRows).toBeGreaterThan(0);

      // Switch to graphs tab — radar chart visible
      await comparisonDialog.switchToTab('graphs');
      expect(await comparisonDialog.isRadarChartVisible()).toBeTruthy();

      // Switch back to stats tab — rows still there
      await comparisonDialog.switchToTab('stats');
      const rowsAfter = await comparisonDialog.getStatRowCount();
      expect(rowsAfter).toBeGreaterThan(0);
    });
  });
});
