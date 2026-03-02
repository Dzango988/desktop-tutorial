const { expect } = require('@playwright/test');
const { widgetSelectors } = require('../helpers/widget-selectors');

class EventsWidgetPage {
  constructor(page) {
    this.page = page;
  }

  async open() {
    const response = await this.page.goto('./', { waitUntil: 'domcontentloaded' });
    expect(response, 'Navigation should return an HTTP response').not.toBeNull();
    expect(response.status(), 'Page should answer with successful/redirect status').toBeLessThan(400);
  }

  async resolveFirstVisibleLocator(candidates) {
    for (const selector of candidates) {
      const locator = this.page.locator(selector).first();
      if (await locator.isVisible().catch(() => false)) {
        return { selector, locator };
      }
    }
    throw new Error(`No visible locator found for candidates: ${candidates.join(', ')}`);
  }

  async widgetRoot() {
    return this.resolveFirstVisibleLocator(widgetSelectors.widgetRootCandidates);
  }

  async eventCards() {
    for (const selector of widgetSelectors.eventCardCandidates) {
      const locator = this.page.locator(selector);
      const count = await locator.count();
      if (count > 0) {
        return { selector, locator, count };
      }
    }
    throw new Error(`No event cards found for candidates: ${widgetSelectors.eventCardCandidates.join(', ')}`);
  }

  async collectCardTexts(locator, count) {
    const texts = [];
    for (let index = 0; index < count; index += 1) {
      texts.push((await locator.nth(index).innerText()).trim());
    }
    return texts;
  }
}

module.exports = { EventsWidgetPage };
