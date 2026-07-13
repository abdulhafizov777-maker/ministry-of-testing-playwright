const { test, expect } = require('@playwright/test');
const { fetchSnapshot } = require('../support/site-fixtures');

test.describe('legacy redirects', () => {
  test('legacy trends route returns a permanent redirect', async ({ request }) => {
    expect((await fetchSnapshot(request, '/trends', { maxRedirects: 0 })).status).toBe(301);
  });

  test('legacy trends route supplies a Location header', async ({ request }) => {
    expect((await fetchSnapshot(request, '/trends', { maxRedirects: 0 })).headers.location).toBeTruthy();
  });

  test('legacy trends redirect remains on the Ministry of Testing origin', async ({ request, baseURL }) => {
    const location = (await fetchSnapshot(request, '/trends', { maxRedirects: 0 })).headers.location;
    expect(new URL(location).origin).toBe(new URL(baseURL).origin);
  });

  test('legacy trends redirect targets Insights', async ({ request }) => {
    const location = (await fetchSnapshot(request, '/trends', { maxRedirects: 0 })).headers.location;
    expect(new URL(location).pathname).toBe('/insights');
  });

  test('legacy trends redirect does not invent query parameters', async ({ request }) => {
    const location = (await fetchSnapshot(request, '/trends', { maxRedirects: 0 })).headers.location;
    expect(new URL(location).search).toBe('');
  });

  test('legacy trends redirect has no response payload', async ({ request }) => {
    expect((await fetchSnapshot(request, '/trends', { maxRedirects: 0 })).body).toBe('');
  });

  test('legacy trends response URL records the requested route', async ({ request }) => {
    expect(new URL((await fetchSnapshot(request, '/trends', { maxRedirects: 0 })).url).pathname).toBe('/trends');
  });

  test('legacy trends redirect identifies an HTML response', async ({ request }) => {
    expect((await fetchSnapshot(request, '/trends', { maxRedirects: 0 })).headers['content-type']).toContain('text/html');
  });
});

const INVALID_ROUTES = [
  '/definitely-missing-playwright-navigation',
  '/missing-page-content-contract',
  '/unknown-query-target',
];

test.describe('invalid public routes', () => {
  for (const path of INVALID_ROUTES) {
    test(`${path} returns 404`, async ({ request }) => {
      expect((await fetchSnapshot(request, path)).status).toBe(404);
    });

    test(`${path} returns an HTML error document`, async ({ request }) => {
      expect((await fetchSnapshot(request, path)).headers['content-type']).toContain('text/html');
    });

    test(`${path} returns a non-empty error body`, async ({ request }) => {
      expect((await fetchSnapshot(request, path)).body.length).toBeGreaterThan(100);
    });

    test(`${path} returns an HTML5 error document`, async ({ request }) => {
      expect((await fetchSnapshot(request, path)).body.trimStart()).toMatch(/^<!DOCTYPE html>/i);
    });

    test(`${path} error document declares English`, async ({ request }) => {
      expect((await fetchSnapshot(request, path)).body).toMatch(/<html\b[^>]*\blang=["']en["']/i);
    });

    test(`${path} error document contains a head`, async ({ request }) => {
      expect((await fetchSnapshot(request, path)).body).toMatch(/<head(?:\s|>)/i);
    });

    test(`${path} error document has a title`, async ({ request }) => {
      expect((await fetchSnapshot(request, path)).facts.title.length).toBeGreaterThan(3);
    });

    test(`${path} response URL retains the invalid pathname`, async ({ request }) => {
      expect(new URL((await fetchSnapshot(request, path)).url).pathname).toBe(path);
    });
  }
});
