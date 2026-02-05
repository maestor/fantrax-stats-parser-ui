import { test, expect } from '@playwright/test';
import { PlayerCardDialog } from '../page-objects/PlayerCardDialog';
import { StatsTable } from '../page-objects/StatsTable';

test.describe('Player Card', () => {
  let playerCard: PlayerCardDialog;
  let statsTable: StatsTable;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    playerCard = new PlayerCardDialog(page);
    statsTable = new StatsTable(page);

    // Wait for table data
    await statsTable.verifyDataLoaded();
  });

  test('opens when clicking a player row', async ({ page }) => {
    await playerCard.open('Jamie Benn');

    // Verify dialog is visible
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
  });

  test('closes via X button', async ({ page }) => {
    await playerCard.open('Jamie Benn');
    await playerCard.close();

    // Verify dialog is hidden
    const dialog = page.getByRole('dialog');
    await expect(dialog).not.toBeVisible();
  });

  test('closes via Escape key', async ({ page }) => {
    await playerCard.open('Jamie Benn');
    await playerCard.closeViaEscape();

    // Verify dialog is hidden
    const dialog = page.getByRole('dialog');
    await expect(dialog).not.toBeVisible();
  });
});
