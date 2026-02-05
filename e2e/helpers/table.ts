import { Page, expect } from '@playwright/test';

/**
 * Wait for table data to load
 */
export async function waitForTableData(page: Page): Promise<void> {
  const rows = page.locator('tr[mat-row]');
  await rows.first().waitFor({ state: 'visible', timeout: 10000 });
}

/**
 * Get current row count
 */
export async function getRowCount(page: Page): Promise<number> {
  const rows = page.locator('tr[mat-row]');
  return await rows.count();
}

/**
 * Get text content of first row
 */
export async function getFirstRowText(page: Page): Promise<string> {
  const firstRow = page.locator('tr[mat-row]').first();
  return (await firstRow.textContent()) || '';
}

/**
 * Verify no results message is visible
 */
export async function verifyNoResults(page: Page): Promise<void> {
  await expect(page.getByText('Ei hakutuloksia')).toBeVisible();
}

/**
 * Get all values from a specific column
 */
export async function getColumnValues(
  page: Page,
  columnClass: string
): Promise<string[]> {
  const cells = page.locator(`tr[mat-row] td.${columnClass}`);
  return await cells.allTextContents();
}
