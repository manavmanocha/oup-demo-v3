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

test('queues items from Screen Items flow', async ({ page }) => {
  await login(page);

  await page.goto('/workflows/pre-testing-pipeline/screening/start');
  await expect(page.getByText('Select Items for Screening')).toBeVisible();

  const rowCheckbox = page.locator('tbody [role="checkbox"]').first();
  await expect(rowCheckbox).toBeVisible();
  await rowCheckbox.click();

  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Items Selected for Screening Queue')).toBeVisible();

  await page.getByRole('button', { name: 'Add to Queue' }).click();
  await expect(page.getByText('Items Added to Screening Queue')).toBeVisible();
});
