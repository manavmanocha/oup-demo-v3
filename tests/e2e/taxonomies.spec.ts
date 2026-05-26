import { expect, test } from '@playwright/test';

import { loginAsDemo } from './helpers/auth';

test.beforeEach(async ({ page }) => {
  await loginAsDemo(page);
});

test('filters taxonomies and navigates to taxonomy detail', async ({ page }) => {
  await page.goto('/taxonomies');

  await expect(page.getByRole('heading', { name: 'Taxonomies', exact: true })).toBeVisible();
  await expect(page.getByText('Total Taxonomies')).toBeVisible();
  await expect(page.getByText('Total Categories')).toBeVisible();
  await expect(page.getByText('Tagged Items')).toBeVisible();

  await page.getByPlaceholder('Search taxonomies...').fill('skills');
  await expect(page.getByText('Skills & Competencies')).toBeVisible();
  await expect(page.getByText('Grammar Focus')).toHaveCount(0);

  await page.getByRole('link', { name: /Skills & Competencies/i }).first().click();
  await expect(page).toHaveURL(/\/taxonomies\/skills$/);
  await expect(page.getByRole('heading', { name: 'Skills & Competencies' })).toBeVisible();

  await page.getByRole('button').filter({ has: page.locator('svg.lucide-chevron-right') }).first().click();
  await expect(page.getByText('Careful reading global detail')).toBeVisible();
});
