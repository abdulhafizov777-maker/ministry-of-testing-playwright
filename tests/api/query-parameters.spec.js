const { test, expect } = require('../support/test-fixtures');
const { PRIMARY_ROUTES, fetchSnapshot } = require('../support/site-fixtures');

const query = 'utm_source=playwright&utm_medium=read_only&mot_probe=500';

test.describe('harmless query parameter handling', () => {
  for (const route of PRIMARY_ROUTES) {
    const queriedPath = `${route.path === '/' ? '/' : route.path}?${query}`;

    test(`${route.name} accepts tracking query parameters`, async ({ request }) => {
      expect((await fetchSnapshot(request, queriedPath)).status).toBe(200);
    });

    test(`${route.name} keeps its canonical pathname with a query`, async ({ request }) => {
      expect(new URL((await fetchSnapshot(request, queriedPath)).url).pathname).toBe(route.path);
    });

    test(`${route.name} preserves the utm_source value`, async ({ request }) => {
      expect(new URL((await fetchSnapshot(request, queriedPath)).url).searchParams.get('utm_source')).toBe('playwright');
    });

    test(`${route.name} preserves the utm_medium value`, async ({ request }) => {
      expect(new URL((await fetchSnapshot(request, queriedPath)).url).searchParams.get('utm_medium')).toBe('read_only');
    });

    test(`${route.name} preserves the custom probe value`, async ({ request }) => {
      expect(new URL((await fetchSnapshot(request, queriedPath)).url).searchParams.get('mot_probe')).toBe('500');
    });

    test(`${route.name} query response remains HTML`, async ({ request }) => {
      expect((await fetchSnapshot(request, queriedPath)).headers['content-type']).toContain('text/html');
    });

    test(`${route.name} query response retains the canonical title`, async ({ request }) => {
      const [canonical, queried] = await Promise.all([
        fetchSnapshot(request, route.path),
        fetchSnapshot(request, queriedPath),
      ]);
      expect(queried.facts.title).toBe(canonical.facts.title);
    });

    test(`${route.name} query response retains the canonical heading`, async ({ request }) => {
      const [canonical, queried] = await Promise.all([
        fetchSnapshot(request, route.path),
        fetchSnapshot(request, queriedPath),
      ]);
      expect(queried.facts.h1).toBe(canonical.facts.h1);
    });
  }
});

