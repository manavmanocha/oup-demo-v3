import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/login');
});

test('logs in and shows the authenticated shell', async ({ page }) => {
  await page.getByLabel('Username Or Email').fill('manav.manocha@comprotechnologies.com');
  await page.getByLabel('Password*').fill('Compro11');
  await page.getByRole('button', { name: 'LOGIN' }).click();

  await expect(page).toHaveURL(/\/(library)?$/);
  await expect(page.getByRole('link', { name: 'Library' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Workflows' })).toBeVisible();
});
