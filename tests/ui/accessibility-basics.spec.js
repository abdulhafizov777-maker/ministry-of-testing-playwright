const { test, expect } = require('@playwright/test');
const { SITE_ROUTES, loadStaticDocument } = require('../support/site-fixtures');

test.describe('accessibility landmark and heading basics', () => {
  for (const route of SITE_ROUTES) {
    if (route.name === 'Home') {
      test(`${route.name} has an English language declaration`, async ({ page, request }) => {
        await loadStaticDocument(page, request, route.path);
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      });
    }

    test(`${route.name} has a main landmark`, async ({ page, request }) => {
      await loadStaticDocument(page, request, route.path);
      expect(await page.getByRole('main').count()).toBeGreaterThan(0);
    });

    test(`${route.name} has a navigation landmark`, async ({ page, request }) => {
      await loadStaticDocument(page, request, route.path);
      expect(await page.getByRole('navigation').count()).toBeGreaterThan(0);
    });

    test(`${route.name} has a level-one heading`, async ({ page, request }) => {
      await loadStaticDocument(page, request, route.path);
      expect(await page.getByRole('heading', { level: 1 }).count()).toBeGreaterThan(0);
    });

    test(`${route.name} has a semantic footer region`, async ({ page, request }) => {
      await loadStaticDocument(page, request, route.path);
      expect(await page.locator('footer').count()).toBeGreaterThan(0);
    });
  }

  test('homepage primary heading has an accessible name', async ({ page, request }) => {
    await loadStaticDocument(page, request, '/');
    await expect(page.getByRole('heading', { level: 1 }).first()).toHaveAccessibleName(/\S/);
  });

  test('homepage navigation contains keyboard-focusable links', async ({ page, request }) => {
    await loadStaticDocument(page, request, '/');
    expect(await page.getByRole('navigation').first().getByRole('link').count()).toBeGreaterThan(0);
  });

  test('homepage search control has an accessible name', async ({ page, request }) => {
    await loadStaticDocument(page, request, '/');
    await expect(page.getByRole('button', { name: /search/i }).first()).toHaveAccessibleName(/search/i);
  });
});
