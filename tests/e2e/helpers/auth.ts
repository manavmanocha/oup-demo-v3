import { expect, type Page } from '@playwright/test';

const DEMO_EMAIL = process.env.E2E_DEMO_EMAIL ?? 'manav.manocha@comprotechnologies.com';
const DEMO_PASSWORD = process.env.E2E_DEMO_PASSWORD ?? 'Compro11';

export async function clearSession(page: Page) {
  await page.goto('/login');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/login');
}

export async function loginAsDemo(page: Page) {
  await clearSession(page);
  await page.getByLabel('Username Or Email').fill(DEMO_EMAIL);
  await page.getByLabel('Password*').fill(DEMO_PASSWORD);
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await expect(page.getByRole('link', { name: 'Library' })).toBeVisible();
}
