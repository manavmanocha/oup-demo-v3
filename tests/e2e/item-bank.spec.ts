import { expect, test, type Page } from '@playwright/test';
import { loginAsDemo } from './helpers/auth';

async function login(page: Page) {
  await loginAsDemo(page);
}

test('navigates from item bank overview to a level and item detail', async ({ page }) => {
  await login(page);

  await page.goto('/item-bank');
  await expect(page.getByRole('heading', { name: 'Pre-Testing Pipeline Overview' })).toBeVisible();

  await page.locator('a[href="/item-bank/A2"]').first().click();
  await expect(page).toHaveURL(/\/item-bank\/A2/);
  await expect(page.getByRole('heading', { name: 'A2' })).toBeVisible();

  await page.locator('a[href*="/item-bank/A2/"]').first().click();
  await expect(page).toHaveURL(/\/item-bank\/A2\//);
  await expect(page.getByRole('button', { name: 'Back' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Question' })).toBeVisible();
});
