/**
 * E2E — real browser against the real server and real FRED (no mocks).
 * The Playwright webServer (playwright.config.js) starts `node src/server.js`,
 * which fails fast without FRED_API_KEY (NFR-002); the env var is therefore a
 * prerequisite for this suite — that is the intended "real E2E" gate.
 *
 * The error-isolation test (E2E-DASH-3) injects a fault into ONE external
 * dependency call (aborts a single /api/series response) to drive the real
 * frontend error path. The app under test is never mocked — only one upstream
 * call is made to fail, which mirrors a real partial-outage failure mode.
 * @requirement REQ-004 dashboard renders 5 ordered category cards
 * @requirement REQ-005..REQ-009 each category card renders a chart with its indicators
 * @requirement REQ-010 per-card error isolation; dashboard does not crash
 */
const { test, expect } = require('@playwright/test');

const CATEGORIES = ['금리', '물가', '고용', '성장', '시장'];
// Expected dataset count per category (number of indicators it charts).
const DATASETS = { 금리: 2, 물가: 1, 고용: 1, 성장: 2, 시장: 2 };

async function waitSettled(page) {
  // aria-busy flips to false once every card reaches a terminal state.
  await expect(page.locator('#dashboard')).toHaveAttribute('aria-busy', 'false', { timeout: 20000 });
}

test.describe('FRED dashboard — happy path', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitSettled(page);
  });

  test('renders 5 category cards in order (REQ-004, E2E-DASH-1)', async ({ page }) => {
    const cards = page.locator('#dashboard .card');
    await expect(cards).toHaveCount(5);
    const names = await cards.evaluateAll((els) => els.map((e) => e.dataset.category));
    expect(names).toEqual(CATEGORIES);
  });

  test('each card loads and renders a chart with the right datasets (REQ-005..009, E2E-DASH-2)', async ({ page }) => {
    for (const name of CATEGORIES) {
      const card = page.locator(`#dashboard .card[data-category="${name}"]`);
      // Must actually load — an 'error' card would also have a <canvas>, so the
      // old "canvas visible" check was a false-GREEN (P8-1). Force 'loaded'.
      await expect(card).toHaveAttribute('data-state', 'loaded');

      const canvas = card.locator('canvas');
      // A Chart.js instance must be bound to this canvas, with the expected
      // number of datasets (e.g. 금리 = FEDFUNDS + DGS10 = 2).
      const datasetCount = await canvas.evaluate((el) => {
        const chart = window.Chart && window.Chart.getChart(el);
        return chart ? chart.data.datasets.length : 0;
      });
      expect(datasetCount).toBe(DATASETS[name]);
    }
  });
});

test.describe('FRED dashboard — error isolation', () => {
  test('one failing series isolates to its card; others load; page intact (REQ-010, E2E-DASH-3)', async ({ page }) => {
    // Fault-inject: fail only the 금리 card's DGS10 series request. Every other
    // request hits the real server/FRED. This drives the real getJson() catch
    // path in public/app.js — no app logic is mocked.
    await page.route('**/api/series/DGS10', (route) => route.abort());

    await page.goto('/');
    await waitSettled(page);

    // The dashboard must not crash: all 5 cards still present.
    const cards = page.locator('#dashboard .card');
    await expect(cards).toHaveCount(5);

    // The 금리 card (depends on DGS10) is isolated into the error state...
    await expect(page.locator('#dashboard .card[data-category="금리"]')).toHaveAttribute('data-state', 'error');
    await expect(page.locator('#dashboard .card[data-category="금리"] .status.error')).toBeVisible();

    // ...while at least one independent card still loads normally.
    await expect(page.locator('#dashboard .card[data-category="물가"]')).toHaveAttribute('data-state', 'loaded');

    // No card is left hanging — every card reached a terminal state.
    const states = await cards.evaluateAll((els) => els.map((e) => e.dataset.state));
    for (const s of states) {
      expect(['loaded', 'error']).toContain(s);
    }
  });
});
