const { test, expect } = require('@playwright/test');
const { SITE_ROUTES, fetchSnapshot } = require('../support/site-fixtures');

test.describe('public response header contracts', () => {
  for (const route of SITE_ROUTES) {
    test(`${route.name} returns HTTP 200`, async ({ request }) => {
      expect((await fetchSnapshot(request, route.path)).status).toBe(200);
    });

    test(`${route.name} identifies its response as UTF-8 HTML`, async ({ request }) => {
      expect((await fetchSnapshot(request, route.path)).headers['content-type']).toMatch(/^text\/html;\s*charset=utf-8$/i);
    });

    test(`${route.name} marks its personalized HTML as private`, async ({ request }) => {
      expect((await fetchSnapshot(request, route.path)).headers['cache-control']).toContain('private');
    });

    test(`${route.name} advertises long-lived HTTPS transport security`, async ({ request }) => {
      expect((await fetchSnapshot(request, route.path)).headers['strict-transport-security']).toMatch(/max-age=\d{7,}/);
    });

    test(`${route.name} disables MIME sniffing`, async ({ request }) => {
      expect((await fetchSnapshot(request, route.path)).headers['x-content-type-options']).toBe('nosniff');
    });

    test(`${route.name} restricts framing to the same origin`, async ({ request }) => {
      expect((await fetchSnapshot(request, route.path)).headers['x-frame-options']).toBe('SAMEORIGIN');
    });

    test(`${route.name} supplies a strict-origin referrer policy`, async ({ request }) => {
      expect((await fetchSnapshot(request, route.path)).headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });
  }

  test('an invalid route is explicitly non-cacheable', async ({ request }) => {
    const response = await fetchSnapshot(request, '/missing-response-header-contract');
    expect(response.headers['cache-control']).toBe('no-cache');
  });
});

