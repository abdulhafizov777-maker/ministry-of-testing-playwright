const { test, expect } = require('@playwright/test');
const { SITE_ROUTES, fetchSnapshot } = require('../support/site-fixtures');

test.describe('server-rendered document content contracts', () => {
  for (const route of SITE_ROUTES) {
    test(`${route.name} starts with an HTML5 doctype`, async ({ request }) => {
      expect((await fetchSnapshot(request, route.path)).body.trimStart()).toMatch(/^<!DOCTYPE html>/i);
    });

    test(`${route.name} declares English as the document language`, async ({ request }) => {
      expect((await fetchSnapshot(request, route.path)).body).toMatch(/<html\b[^>]*\blang=["']en["']/i);
    });

    if (route.name === 'Home') {
      test(`${route.name} contains a document head`, async ({ request }) => {
        expect((await fetchSnapshot(request, route.path)).body).toMatch(/<head(?:\s|>)/i);
      });

      test(`${route.name} contains a document body`, async ({ request }) => {
        expect((await fetchSnapshot(request, route.path)).body).toMatch(/<body(?:\s|>)/i);
      });
    }

    test(`${route.name} has a non-empty page title`, async ({ request }) => {
      expect((await fetchSnapshot(request, route.path)).facts.title.length).toBeGreaterThan(3);
    });

    test(`${route.name} exposes its expected primary heading`, async ({ request }) => {
      expect((await fetchSnapshot(request, route.path)).facts.h1).toContain(route.h1);
    });

    test(`${route.name} includes semantic navigation`, async ({ request }) => {
      expect((await fetchSnapshot(request, route.path)).body).toMatch(/<nav(?:\s|>)/i);
    });

    test(`${route.name} includes semantic main content`, async ({ request }) => {
      expect((await fetchSnapshot(request, route.path)).body).toMatch(/<main(?:\s|>)/i);
    });

    test(`${route.name} includes a semantic footer`, async ({ request }) => {
      expect((await fetchSnapshot(request, route.path)).body).toMatch(/<footer(?:\s|>)/i);
    });

    test(`${route.name} publishes at least one root-relative link`, async ({ request }) => {
      expect((await fetchSnapshot(request, route.path)).facts.hrefs.some((href) => href.startsWith('/'))).toBe(true);
    });
  }

  test('homepage title describes software testing careers', async ({ request }) => {
    expect((await fetchSnapshot(request, '/')).facts.title).toMatch(/software testers/i);
  });

  test('homepage title carries the MoTaverse brand', async ({ request }) => {
    expect((await fetchSnapshot(request, '/')).facts.title).toContain('MoTaverse');
  });

  test('homepage copy discusses testing', async ({ request }) => {
    expect((await fetchSnapshot(request, '/')).body).toMatch(/testing/i);
  });

  test('homepage offers a substantial set of destinations', async ({ request }) => {
    expect((await fetchSnapshot(request, '/')).facts.hrefs.length).toBeGreaterThan(20);
  });

  test('homepage links to learning content', async ({ request }) => {
    expect((await fetchSnapshot(request, '/')).facts.hrefs.some((href) => /^\/learn\/?(?:[?#]|$)/.test(href))).toBe(true);
  });

  test('homepage links to events content', async ({ request }) => {
    expect((await fetchSnapshot(request, '/')).facts.hrefs.some((href) => /^\/events\/?(?:[?#]|$)/.test(href))).toBe(true);
  });
});
