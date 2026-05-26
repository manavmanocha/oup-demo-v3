import { expect, test } from '@playwright/test';

import { loginAsDemo } from './helpers/auth';

test.beforeEach(async ({ page }) => {
  await loginAsDemo(page);
});

test('opens pre-testing workflow and navigates to pipeline stages', async ({ page }) => {
  await page.goto('/workflows');

  await expect(page.getByRole('heading', { name: 'Workflows' })).toBeVisible();
  await expect(page.getByText('Pre-Testing Pipeline')).toBeVisible();
  await expect(page.getByText('PDF to Text')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Unavailable' })).toHaveCount(3);

  await page.locator('a:has(button:has-text("Open Workflow"))').first().click();
  await expect(page).toHaveURL(/\/workflows\/pre-testing-pipeline$/);
  await expect(page.getByRole('heading', { name: 'Pre-Testing Pipeline Overview' })).toBeVisible();

  await page.goto('/workflows/pre-testing-pipeline/stages');
  await expect(page.getByRole('heading', { name: 'Pre-Testing Pipeline' })).toBeVisible();
  await expect(page.getByText('Step 1')).toBeVisible();
  await expect(page.getByText('Step 2')).toBeVisible();
  await expect(page.getByText('Step 3')).toBeVisible();

  await page.getByRole('link', { name: /Step 1.*Screening.*in queue/i }).click();
  await expect(page).toHaveURL(/\/workflows\/pre-testing-pipeline\/screening$/);
});
