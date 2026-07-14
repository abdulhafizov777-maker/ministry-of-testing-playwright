const { test, expect } = require('../support/test-fixtures');
const { PRIMARY_ROUTES, loadStaticDocument } = require('../support/site-fixtures');

test.describe('responsive public layouts', () => {
  for (const route of PRIMARY_ROUTES) {
    test(`${route.name} keeps primary content usable at 320px`, async ({ page, request }) => {
      await page.setViewportSize({ width: 320, height: 720 });
      const snapshot = await loadStaticDocument(page, request, route.path);
      expect(snapshot.status).toBeLessThan(400);
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 }).first()).toContainText(route.h1);
    });

    test(`${route.name} keeps primary content usable at 1440px`, async ({ page, request }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      const snapshot = await loadStaticDocument(page, request, route.path);
      expect(snapshot.status).toBeLessThan(400);
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 }).first()).toContainText(route.h1);
    });
  }
});
