import { expect, test, type Page } from '@playwright/test';
import { loginAsDemo } from './helpers/auth';

async function login(page: Page) {
  await loginAsDemo(page);
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

test('processes deterministic queued items through approve and reject actions', async ({ page }) => {
  await login(page);

  await page.evaluate(() => {
    localStorage.setItem(
      'ingested-library-items-v1',
      JSON.stringify([
        {
          id: 'EAS-DEM-RDG-B2-101',
          title: 'Demo Screening Fail Item',
          content: 'Deterministic fixture with distractor failure',
          level: 'B2',
          skill: 'Reading',
          itemType: 'Multiple Choice',
          status: 'Draft',
          workflowState: 'NOT_STARTED',
        },
        {
          id: 'EAS-DEM-SPK-B2-103',
          title: 'Demo Screening Pass Item',
          content: 'Deterministic fixture with all dimensions pass',
          level: 'B2',
          skill: 'Speaking',
          itemType: 'Speaking',
          status: 'Draft',
          workflowState: 'NOT_STARTED',
        },
      ]),
    );
    localStorage.removeItem('workflow-item-overrides-v1');
  });

  await page.goto('/workflows/pre-testing-pipeline/screening/start');
  await page.getByPlaceholder('Search items...').fill('EAS-DEM-');
  await page.getByRole('button', { name: 'Select All' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Add to Queue' }).click();
  await page.getByRole('button', { name: 'No', exact: true }).click();

  await expect(page).toHaveURL(/\/workflows\/pre-testing-pipeline\/screening$/);
  await expect(page.getByText('EAS-DEM-RDG-B2-101')).toBeVisible();
  await expect(page.getByText('EAS-DEM-SPK-B2-103')).toBeVisible();

  const failedCard = page.locator('div.border.rounded-lg.p-6', {
    has: page.getByText('EAS-DEM-RDG-B2-101'),
  });
  await expect(failedCard.getByText('Distractor Strength: Fail')).toBeVisible();

  const passedCard = page.locator('div.border.rounded-lg.p-6', {
    has: page.getByText('EAS-DEM-SPK-B2-103'),
  });
  await expect(passedCard.getByText('All 5 Dimensions: Pass')).toBeVisible();

  await failedCard.getByRole('button', { name: 'Reject' }).click();
  await expect(page.getByText('EAS-DEM-RDG-B2-101')).toHaveCount(0);

  await passedCard.getByRole('button', { name: 'Approve' }).click();
  await expect(page.getByText('EAS-DEM-SPK-B2-103')).toHaveCount(0);
});
