const { test, expect } = require('@playwright/test');
const { PRIMARY_ROUTES } = require('../support/site-fixtures');

test.describe('responsive public layouts', () => {
  for (const route of PRIMARY_ROUTES) {
    test(`${route.name} keeps primary content usable at 320px`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 720 });
      const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      expect(response.status()).toBeLessThan(400);
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 }).first()).toContainText(route.h1);
    });

    test(`${route.name} keeps primary content usable at 1440px`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      expect(response.status()).toBeLessThan(400);
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 }).first()).toContainText(route.h1);
    });
  }
});
