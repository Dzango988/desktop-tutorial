const { test, expect } = require('@playwright/test');
const { EventsWidgetPage } = require('./pages/events-widget.page');
const { widgetSelectors } = require('./helpers/widget-selectors');

test.describe('3snet events widget', () => {
  test('page is reachable and has expected metadata', async ({ page }) => {
    const widgetPage = new EventsWidgetPage(page);
    await widgetPage.open();

    await expect(page).toHaveURL(/eventswidget\/?/i);
    await expect(page).toHaveTitle(/event/i);
  });

  test('widget renders at least one non-empty event card', async ({ page }, testInfo) => {
    const widgetPage = new EventsWidgetPage(page);
    await widgetPage.open();

    const { selector: rootSelector, locator: root } = await widgetPage.widgetRoot();
    await expect(root).toBeVisible();

    const { selector: cardSelector, locator: cards, count } = await widgetPage.eventCards();
    expect(count).toBeGreaterThan(0);

    const texts = await widgetPage.collectCardTexts(cards, count);
    const emptyTexts = texts
      .map((text, index) => ({ index, text }))
      .filter(({ text }) => text.length === 0);

    expect(emptyTexts, 'Each card should contain readable text').toEqual([]);

    await testInfo.attach('resolved-selectors.json', {
      contentType: 'application/json',
      body: JSON.stringify({ rootSelector, cardSelector, knownCandidates: widgetSelectors }, null, 2)
    });
  });

  test('at least one card is potentially clickable', async ({ page }) => {
    const widgetPage = new EventsWidgetPage(page);
    await widgetPage.open();

    const clickableCounts = await Promise.all(
      widgetSelectors.clickableEventCandidates.map(async (selector) => ({
        selector,
        count: await page.locator(selector).count()
      }))
    );

    const totalClickable = clickableCounts.reduce((acc, item) => acc + item.count, 0);
    expect(totalClickable).toBeGreaterThan(0);
  });
});
