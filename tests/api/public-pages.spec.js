const { test, expect } = require('../support/test-fixtures');
const { PUBLIC_ROUTES } = require('../../utils/routes');

test.describe('public HTTP GET checks', () => {
  test('homepage returns HTML with a non-empty response body', async ({ request }) => {
    const response = await request.get('/');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/html');
    expect((await response.body()).length).toBeGreaterThan(0);
  });

  for (const [name, route] of Object.entries(PUBLIC_ROUTES)) {
    test(`${name} public page returns a successful response`, async ({ request }) => {
      const response = await request.get(route);

      expect(response.status(), `${route} returned ${response.status()}`).toBeLessThan(400);
      expect(response.headers()['content-type']).toContain('text/html');
    });
  }
});
