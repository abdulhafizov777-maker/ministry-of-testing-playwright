const { test, expect } = require('@playwright/test');
const { SITE_ROUTES, loadStaticDocument } = require('../support/site-fixtures');

test.describe('browser document behavior', () => {
  for (const route of SITE_ROUTES) {
    test(`${route.name} static document reaches complete ready state`, async ({ page, request }) => {
      await loadStaticDocument(page, request, route.path);
      expect(await page.evaluate(() => document.readyState)).toBe('complete');
    });
  }
});

test.describe('read-only form control behavior', () => {
  test('homepage exposes a search control without activating it', async ({ page, request }) => {
    await loadStaticDocument(page, request, '/');
    await expect(page.getByRole('button', { name: /search/i }).first()).toBeAttached();
  });

  test('Sign In page exposes an email or username field', async ({ page, request }) => {
    await loadStaticDocument(page, request, '/signin?return_to_referer=yes');
    await expect(page.getByRole('textbox', { name: /email or username/i })).toBeAttached();
  });

  test('Sign In identity field is a text-compatible control', async ({ page, request }) => {
    await loadStaticDocument(page, request, '/signin?return_to_referer=yes');
    const type = await page.getByRole('textbox', { name: /email or username/i }).getAttribute('type');
    expect(['email', 'text', null]).toContain(type);
  });

  test('Sign In identity field can receive keyboard focus', async ({ page, request }) => {
    await loadStaticDocument(page, request, '/signin?return_to_referer=yes');
    const field = page.getByRole('textbox', { name: /email or username/i });
    await field.focus();
    await expect(field).toBeFocused();
  });

  test('Sign In identity field accepts local text without submission', async ({ page, request }) => {
    await loadStaticDocument(page, request, '/signin?return_to_referer=yes');
    const field = page.getByRole('textbox', { name: /email or username/i });
    await field.fill('read-only@example.test');
    await expect(field).toHaveValue('read-only@example.test');
  });

  test('Sign In identity field can be cleared without submission', async ({ page, request }) => {
    await loadStaticDocument(page, request, '/signin?return_to_referer=yes');
    const field = page.getByRole('textbox', { name: /email or username/i });
    await field.fill('temporary');
    await field.clear();
    await expect(field).toHaveValue('');
  });

  test('Sign In page exposes a password control', async ({ page, request }) => {
    await loadStaticDocument(page, request, '/signin?return_to_referer=yes');
    await expect(page.locator('input[type="password"]')).toHaveCount(1);
  });

  test('Sign In password control masks entered text', async ({ page, request }) => {
    await loadStaticDocument(page, request, '/signin?return_to_referer=yes');
    const password = page.locator('input[type="password"]');
    await password.fill('local-only-value');
    await expect(password).toHaveAttribute('type', 'password');
  });

  test('Sign In submit control is identified without clicking it', async ({ page, request }) => {
    await loadStaticDocument(page, request, '/signin?return_to_referer=yes');
    const button = page.getByRole('button', { name: 'Sign In', exact: true });
    await expect(button).toHaveAttribute('type', 'submit');
  });
});

