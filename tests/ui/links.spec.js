const { test, expect } = require('@playwright/test');
const { PRIMARY_ROUTES, loadStaticDocument } = require('../support/site-fixtures');

test.describe('rendered link hygiene', () => {
  for (const route of PRIMARY_ROUTES) {
    test(`${route.name} offers several linked destinations`, async ({ page, request }) => {
      await loadStaticDocument(page, request, route.path);
      expect(await page.locator('a[href]').count()).toBeGreaterThan(5);
    });

    test(`${route.name} contains same-site root-relative links`, async ({ page, request }) => {
      await loadStaticDocument(page, request, route.path);
      expect(await page.locator('a[href^="/"]').count()).toBeGreaterThan(0);
    });

    test(`${route.name} contains secure external links`, async ({ page, request }) => {
      await loadStaticDocument(page, request, route.path);
      expect(await page.locator('a[href^="https://"]').count()).toBeGreaterThan(0);
    });

    test(`${route.name} does not use javascript pseudo-links`, async ({ page, request }) => {
      await loadStaticDocument(page, request, route.path);
      await expect(page.locator('a[href^="javascript:"]')).toHaveCount(0);
    });

    test(`${route.name} does not expose credentials in link URLs`, async ({ page, request }) => {
      await loadStaticDocument(page, request, route.path);
      const hrefs = await page.locator('a[href]').evaluateAll((links) => links.map((link) => link.getAttribute('href')));
      expect(hrefs.every((href) => !/[?&](?:password|token|secret)=/i.test(href))).toBe(true);
    });
  }
});

