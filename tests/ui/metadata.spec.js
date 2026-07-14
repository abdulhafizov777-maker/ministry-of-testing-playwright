const { test, expect } = require('@playwright/test');
const { SITE_ROUTES, loadStaticDocument } = require('../support/site-fixtures');

test.describe('browser metadata basics', () => {
  for (const route of SITE_ROUTES) {
    test(`${route.name} exposes its server title through the browser`, async ({ page, request }) => {
      const snapshot = await loadStaticDocument(page, request, route.path);
      await expect(page).toHaveTitle(snapshot.facts.title);
    });

    if (route.name === 'Home') {
      test(`${route.name} title includes the MoTaverse brand`, async ({ page, request }) => {
        await loadStaticDocument(page, request, route.path);
        await expect(page).toHaveTitle(/MoTaverse/);
      });
    }

    test(`${route.name} browser document language is English`, async ({ page, request }) => {
      await loadStaticDocument(page, request, route.path);
      expect(await page.locator('html').getAttribute('lang')).toBe('en');
    });

    test(`${route.name} declares a device-width viewport`, async ({ page, request }) => {
      await loadStaticDocument(page, request, route.path);
      await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /width=device-width/i);
    });

    test(`${route.name} browser document uses UTF-8`, async ({ page, request }) => {
      await loadStaticDocument(page, request, route.path);
      expect(await page.evaluate(() => document.characterSet)).toBe('UTF-8');
    });
  }

  test('homepage contains exactly one title element', async ({ page, request }) => {
    await loadStaticDocument(page, request, '/');
    await expect(page.locator('title')).toHaveCount(1);
  });

  test('homepage title has no surrounding whitespace', async ({ page, request }) => {
    await loadStaticDocument(page, request, '/');
    const title = await page.title();
    expect(title).toBe(title.trim());
  });

  test('homepage title remains a concise search-result label', async ({ page, request }) => {
    await loadStaticDocument(page, request, '/');
    expect((await page.title()).length).toBeLessThan(120);
  });
});
