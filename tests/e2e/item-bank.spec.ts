import { expect, test, type Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/login');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/login');
  await page.getByLabel('Username Or Email').fill('manav.manocha@comprotechnologies.com');
  await page.getByLabel('Password*').fill('Compro11');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await expect(page.getByRole('link', { name: 'Library' })).toBeVisible();
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
  await expect(page.getByRole('link', { name: 'Back to Library' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Question' })).toBeVisible();
});
