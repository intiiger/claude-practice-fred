/**
 * Integration tests for the Express proxy — real createApp(), real FRED for the
 * happy path (no mocks, per HALO Constraint Verification). The allowlist and
 * metadata paths run without a key since rejection/metadata happen before any
 * FRED call; the live-data path requires FRED_API_KEY and is skipped (visibly)
 * when it is absent rather than silently passing.
 * @requirement REQ-001 GET /api/series/:id normalized JSON (real FRED)
 * @requirement REQ-002 api_key injected server-side, never returned to client
 * @requirement REQ-003 allowlist enforced before proxying
 * @requirement REQ-004 /api/meta exposes 5 categories / 8 series
 * @requirement REQ-010 per-series errors surfaced as structured JSON
 */
const request = require('supertest');
const { createApp } = require('../../src/server');

const HAS_KEY = !!(process.env.FRED_API_KEY && process.env.FRED_API_KEY.trim());
const liveTest = HAS_KEY ? test : test.skip;
if (!HAS_KEY) {
  // eslint-disable-next-line no-console
  console.warn('[integration] FRED_API_KEY unset — live-FRED test skipped (IT-API-3). Set it for full P7 coverage.');
}

describe('GET /api/series/:id — allowlist (REQ-003, IT-API-1)', () => {
  test('rejects a non-allowlisted series with 400, no FRED call', async () => {
    const app = createApp({ apiKey: 'dummy-not-used-on-this-path' });
    const res = await request(app).get('/api/series/NOT_A_SERIES');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/disallowed|Unknown/i);
  });
});

describe('GET /api/meta — dashboard metadata (REQ-004, IT-API-2)', () => {
  test('returns 5 ordered categories and 8 series', async () => {
    const app = createApp({ apiKey: 'dummy-not-used-on-this-path' });
    const res = await request(app).get('/api/meta');
    expect(res.status).toBe(200);
    expect(res.body.categories.map((c) => c.name)).toEqual(['금리', '물가', '고용', '성장', '시장']);
    expect(Object.keys(res.body.series)).toHaveLength(8);
  });
});

describe('GET /api/series/:id — FRED failure isolation (REQ-010, IT-API-4)', () => {
  // Inject a fetchSeriesFn that fails for one series and succeeds for another.
  // This is fault injection of the external FRED dependency (not a mock of the
  // app under test) — it exercises the real route error-mapping and the
  // per-request isolation that backs the dashboard's per-card error handling.
  const fetchSeriesFn = async (id) => {
    if (id === 'DGS10') {
      throw new Error('FRED returned 500 for series DGS10');
    }
    return { series_id: id, observations: [{ date: '2020-01-01', value: 1 }] };
  };

  test('a failing series returns a structured 502 without crashing others', async () => {
    const app = createApp({ apiKey: 'dummy-injected-fetch', fetchSeriesFn });

    const bad = await request(app).get('/api/series/DGS10');
    expect(bad.status).toBe(502);
    expect(bad.body.series_id).toBe('DGS10');
    expect(typeof bad.body.error).toBe('string');
    expect(bad.body.error.length).toBeGreaterThan(0);

    // Isolation: an independent series request is unaffected (REQ-010).
    const ok = await request(app).get('/api/series/FEDFUNDS');
    expect(ok.status).toBe(200);
    expect(ok.body.series_id).toBe('FEDFUNDS');
  });
});

describe('GET /api/series/:id — live FRED (REQ-001, REQ-002, IT-API-3)', () => {
  liveTest('returns normalized observations and never leaks the key', async () => {
    const app = createApp(); // uses real getApiKey()
    const res = await request(app).get('/api/series/FEDFUNDS');
    expect(res.status).toBe(200);
    expect(res.body.series_id).toBe('FEDFUNDS');
    expect(Array.isArray(res.body.observations)).toBe(true);
    expect(res.body.observations.length).toBeGreaterThan(0);
    const sample = res.body.observations[0];
    expect(typeof sample.date).toBe('string');
    expect(typeof sample.value).toBe('number');
    expect(Number.isFinite(sample.value)).toBe(true);
    // REQ-002: the key must not appear anywhere in the proxied response.
    expect(JSON.stringify(res.body)).not.toContain(process.env.FRED_API_KEY);
  });
});
