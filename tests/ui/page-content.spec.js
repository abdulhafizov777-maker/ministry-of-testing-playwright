const { test, expect } = require('../support/test-fixtures');
const { SITE_ROUTES, loadStaticDocument } = require('../support/site-fixtures');

test.describe('rendered page content', () => {
  for (const route of SITE_ROUTES) {
    test(`${route.name} renders its expected primary heading`, async ({ page, request }) => {
      await loadStaticDocument(page, request, route.path);
      await expect(page.getByRole('heading', { level: 1 }).first()).toContainText(route.h1);
    });

    test(`${route.name} renders substantial body copy`, async ({ page, request }) => {
      await loadStaticDocument(page, request, route.path);
      expect((await page.locator('body').innerText()).trim().length).toBeGreaterThan(200);
    });

    test(`${route.name} renders supporting headings`, async ({ page, request }) => {
      await loadStaticDocument(page, request, route.path);
      expect(await page.getByRole('heading').count()).toBeGreaterThan(1);
    });

    test(`${route.name} renders multiple navigation choices`, async ({ page, request }) => {
      await loadStaticDocument(page, request, route.path);
      expect(await page.getByRole('link').count()).toBeGreaterThan(5);
    });

    test(`${route.name} main landmark contains meaningful text`, async ({ page, request }) => {
      await loadStaticDocument(page, request, route.path);
      expect((await page.getByRole('main').first().innerText()).trim().length).toBeGreaterThan(40);
    });
  }

  test('homepage navigation presents Learn', async ({ page, request }) => {
    await loadStaticDocument(page, request, '/');
    await expect(page.getByRole('navigation').first().getByRole('link', { name: 'Learn', exact: true })).toBeAttached();
  });

  test('homepage navigation presents Events', async ({ page, request }) => {
    await loadStaticDocument(page, request, '/');
    await expect(page.getByRole('navigation').first().getByRole('link', { name: 'Events', exact: true })).toBeAttached();
  });

  test('homepage navigation presents Join', async ({ page, request }) => {
    await loadStaticDocument(page, request, '/');
    await expect(page.getByRole('navigation').first().getByRole('link', { name: 'Join', exact: true })).toBeAttached();
  });
});

