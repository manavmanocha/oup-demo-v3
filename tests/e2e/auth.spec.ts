import { expect, test } from '@playwright/test';
import { clearSession, loginAsDemo } from './helpers/auth';

test.beforeEach(async ({ page }) => {
  await clearSession(page);
});

test('logs in and shows the authenticated shell', async ({ page }) => {
  await loginAsDemo(page);

  await expect(page).toHaveURL(/\/(library)?$/);
  await expect(page.getByRole('link', { name: 'Library' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Workflows' })).toBeVisible();
});

test('shows an error for invalid credentials', async ({ page }) => {
  await page.getByLabel('Username Or Email').fill('invalid.user@example.com');
  await page.getByLabel('Password*').fill('wrong-password');
  await page.getByRole('button', { name: 'LOGIN' }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText('Invalid email or password.')).toBeVisible();
});

test('redirects unauthenticated users away from protected routes', async ({ page }) => {
  await page.evaluate(() => localStorage.removeItem('authUser'));
  await page.goto('/library');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
});

test('keeps session on reload and supports logout', async ({ page }) => {
  await loginAsDemo(page);

  await page.reload();
  await expect(page.getByRole('link', { name: 'Library' })).toBeVisible();

  await page.getByRole('button', { name: /Manav Manocha|User/i }).click();
  await page.getByRole('menuitem', { name: 'Log out' }).click();

  await expect(page).toHaveURL(/\/login$/);
  const authUser = await page.evaluate(() => localStorage.getItem('authUser'));
  expect(authUser).toBeNull();
});
