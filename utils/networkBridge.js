/**
 * Keeps live UI checks read-only and fast in environments where browser
 * processes cannot connect directly but Playwright's request context can.
 */
async function installReadOnlyNetworkBridge(page, cachedDocuments = new Map()) {
  const baseOrigin = new URL(
    process.env.BASE_URL || 'https://www.ministryoftesting.com'
  ).origin;

  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (request.method() !== 'GET' || url.origin !== baseOrigin) {
      await route.abort('blockedbyclient');
      return;
    }

    if (url.pathname === '/trends' && request.resourceType() === 'document') {
      await route.fulfill({
        status: 302,
        headers: { location: `${baseOrigin}/insights` },
        body: '',
      });
      return;
    }

    const cached = cachedDocuments.get(request.url());
    if (cached) {
      await route.fulfill(cached);
      return;
    }

    try {
      const response = await page.request.get(request.url(), {
        failOnStatusCode: false,
        timeout: 12_000,
      });
      if (response.url() !== request.url()) {
        await route.fulfill({
          status: 302,
          headers: { location: response.url() },
          body: '',
        });
      } else {
        await route.fulfill({ response });
      }
    } catch {
      await route.abort('timedout');
    }
  });
}

module.exports = { installReadOnlyNetworkBridge };
