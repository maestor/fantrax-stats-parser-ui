import { test, expect } from '../fixtures/test-fixture';
import { SettingsDrawer } from '../page-objects/SettingsDrawer';
import { PlayerCardDialog } from '../page-objects/PlayerCardDialog';
import { FILTER_VALUES, MOBILE_VIEWPORT } from '../config/test-data';
import { waitForTableData } from '../helpers/table';

test.describe('Mobile', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  let settingsDrawer: SettingsDrawer;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    settingsDrawer = new SettingsDrawer(page);
    await waitForTableData(page);
  });

  test('player card graphs and accordion work on mobile', async ({ page }) => {
    // Select all seasons for line graphs
    await settingsDrawer.open();
    await settingsDrawer.selectSeason(FILTER_VALUES.ALL_SEASONS);
    await settingsDrawer.close();

    // Open player card and go to graphs tab
    const playerCard = new PlayerCardDialog(page);
    await playerCard.open('Jamie Benn');
    await playerCard.switchToTab('graphs');
    await playerCard.verifyTabContent('graphs');

    const hasLineGraphs = await playerCard.hasLineGraphs();
    expect(hasLineGraphs).toBe(true);

    // Test accordion toggle
    const accordionButton = page.locator('button.graphs-controls-toggle');
    await accordionButton.click();
    await expect(accordionButton).toHaveAttribute('aria-expanded', 'true');

    const controlsList = page.locator('.graphs-controls.visible');
    await expect(controlsList).toBeVisible();

    // Toggle series off and back on
    const checkbox = controlsList.getByRole('checkbox', { name: 'Pisteet' });
    await expect(checkbox).toBeVisible();
    await checkbox.click();
    await page.waitForTimeout(300);
    await checkbox.click();
    await page.waitForTimeout(300);

    // Close accordion via overlay
    const overlay = page.locator('.graphs-controls-overlay.visible');
    await overlay.click();
    await expect(accordionButton).toHaveAttribute('aria-expanded', 'false');
  });
});
