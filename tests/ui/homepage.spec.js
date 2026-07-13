const { test, expect } = require('@playwright/test');
const { HomePage } = require('../../pages/HomePage');
const { PUBLIC_ROUTES } = require('../../utils/routes');
const { installReadOnlyNetworkBridge } = require('../../utils/networkBridge');

const cachedDocuments = new Map();
const useNetworkBridge = /^(1|true)$/i.test(process.env.USE_NETWORK_BRIDGE || '');

test.beforeAll(async ({ request, baseURL }) => {
  if (!useNetworkBridge) {
    return;
  }

  const homepageUrl = new URL('/', baseURL).href;
  let response;
  let lastError;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      response = await request.get(homepageUrl, {
        failOnStatusCode: false,
        timeout: 12_000,
      });
      break;
    } catch (error) {
      lastError = error;
    }
  }

  if (!response) {
    throw lastError;
  }

  cachedDocuments.set(homepageUrl, {
    status: response.status(),
    headers: response.headers(),
    body: await response.body(),
  });
});

test.beforeEach(async ({ page }) => {
  if (useNetworkBridge) {
    await installReadOnlyNetworkBridge(page, cachedDocuments);
  }
});

test.describe('Ministry of Testing public UI smoke tests', () => {
  test('homepage opens successfully and has a relevant title', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();

    await expect(page).toHaveTitle(/Ministry of Testing|MoTaverse/i);
    await expect(home.main).toBeVisible();
  });

  test('main header, navigation, and expected navigation items are visible', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    await home.expectShellVisible();

    for (const name of Object.keys(PUBLIC_ROUTES)) {
      await expect(home.navigationLink(name), `${name} should be visible`).toBeVisible();
    }
  });

  for (const [name, route] of Object.entries(PUBLIC_ROUTES)) {
    test(`${name} navigation opens the observed public route and shows main content`, async ({ page }) => {
      const home = new HomePage(page);
      await home.open();

      await home.openNavigation(name);

      const expectedPath = new URL(route, 'https://example.test');
      if (name === 'Insights') {
        await expect(page).toHaveURL(/\/insights\/?(?:\?[^#]*)?(?:#.*)?$/);
      } else {
        await expect(page).toHaveURL((url) =>
          url.pathname === expectedPath.pathname &&
          [...expectedPath.searchParams].every(([key, value]) => url.searchParams.get(key) === value)
        );
      }

      await expect(page.getByRole('main')).toBeVisible();
    });
  }

  test('search control is visible and opens the search interface', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    await home.openSearch();

    await expect(
      page.getByRole('searchbox').or(page.getByRole('textbox', { name: /search/i })).first()
    ).toBeVisible();
  });

  test('an event card opens its public event detail page', async ({ page }) => {
    await page.goto('/events', { waitUntil: 'domcontentloaded' });
    const eventLink = page.getByRole('main').getByRole('link', { name: 'MoTaCon 2026', exact: true }).first();

    await expect(eventLink).toBeVisible();
    await eventLink.click();

    await expect(page).toHaveURL(/\/events\/motacon-2026\/?$/);
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('an insight card opens its public insight detail page', async ({ page }) => {
    await page.goto('/trends', { waitUntil: 'domcontentloaded' });
    const main = page.getByRole('main');
    const links = main.getByRole('link');
    let insightLink;
    let href;

    for (let index = 0; index < await links.count(); index += 1) {
      const candidate = links.nth(index);
      const candidateHref = await candidate.getAttribute('href');
      if (candidateHref && /^\/insights\/(?!list(?:\?|$))/.test(candidateHref)) {
        insightLink = candidate;
        href = candidateHref;
        break;
      }
    }

    expect(insightLink, 'An internal insight detail link should be present').toBeTruthy();
    await expect(insightLink).toBeVisible();
    expect(href).toMatch(/^\/insights\//);
    await insightLink.click();

    await expect(page).toHaveURL((url) => url.origin === new URL(process.env.BASE_URL || 'https://www.ministryoftesting.com').origin && url.pathname !== '/trends');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('Join page opens without starting registration', async ({ page }) => {
    await page.goto('/membership', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/membership\/?$/);
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('Sign In page opens without submitting credentials', async ({ page }) => {
    await page.goto('/signin?return_to_referer=yes', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/signin(?:\?|$)/);
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('textbox', { name: /email or username/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();
  });

  test('main navigation links do not return HTTP error responses', async ({ page, request }) => {
    const home = new HomePage(page);
    await home.open();

    for (const [name, observedRoute] of Object.entries(PUBLIC_ROUTES)) {
      const href = await home.navigationLink(name).getAttribute('href');
      expect(href, `${name} should have an href`).toBeTruthy();
      const hrefPathname = new URL(href, page.url()).pathname;
      const canonicalPathname = new URL(observedRoute, page.url()).pathname;

      if (name === 'Insights') {
        expect(['/insights', '/trends']).toContain(hrefPathname);
      } else {
        expect(hrefPathname).toBe(canonicalPathname);
      }

      const response = await request.get(href);
      expect(response.status(), `${name} returned ${response.status()}`).toBeLessThan(400);

      if (name === 'Insights') {
        const finalPathname = new URL(response.url()).pathname.replace(/\/+$/, '') || '/';
        expect(finalPathname, 'Insights should resolve to its canonical route').toBe('/insights');
      }
    }
  });
});

test('mobile viewport: homepage header and main content are usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const home = new HomePage(page);
  await home.open();

  await expect(home.header).toBeVisible();
  await expect(home.main).toBeVisible();
  await expect(page).toHaveTitle(/Ministry of Testing|MoTaverse/i);
});
