const { expect } = require('@playwright/test');

class HomePage {
  constructor(page) {
    this.page = page;
    this.header = page.getByRole('navigation').first();
    this.main = page.getByRole('heading', { level: 1 }).first();
    this.primaryNavigation = this.header;
    this.searchControl = this.header.getByRole('button', { name: /search/i });
  }

  async open() {
    const response = await this.page.goto('/', { waitUntil: 'commit' });
    expect(response, 'Homepage navigation should return a response').not.toBeNull();
    expect(response.status(), 'Homepage should open successfully').toBeLessThan(400);
  }

  navigationLink(name) {
    return this.header.getByRole('link', { name, exact: true });
  }

  async expectShellVisible() {
    await expect(this.header).toBeVisible();
    await expect(this.primaryNavigation).toBeVisible();
    await expect(this.main).toBeVisible();
  }

  async openNavigation(name) {
    const link = this.navigationLink(name);
    await expect(link).toBeVisible();
    await link.click();
  }

  async openSearch() {
    await expect(this.searchControl).toBeVisible();
    await this.searchControl.click();
  }
}

module.exports = { HomePage };
