/**
 * Express app — serves the dashboard and proxies FRED requests.
 * The API key stays server-side; the client only ever talks to this proxy.
 * @requirement REQ-001 GET /api/series/:id normalized JSON
 * @requirement REQ-002 api_key injected server-side, never to client
 * @requirement REQ-003 allowlist enforced before proxying
 * @requirement REQ-004 GET / serves the dashboard
 * @requirement REQ-010 per-series errors surfaced as structured JSON
 * @requirement NFR-002 fail-fast when key missing at startup
 */
const path = require('path');
const express = require('express');
const { isAllowed, SERIES, CATEGORIES } = require('./series');
const fred = require('./fred');
const { getApiKey } = require('./config');

/**
 * Create the Express app.
 * @param {{apiKey?: string, fetchSeriesFn?: Function}} [deps]
 *   apiKey defaults to getApiKey() (throws if unset — NFR-002).
 *   fetchSeriesFn is injectable for tests; defaults to fred.fetchSeries.
 */
function createApp(deps = {}) {
  const apiKey = deps.apiKey !== undefined ? deps.apiKey : getApiKey();
  const fetchSeriesFn = deps.fetchSeriesFn || fred.fetchSeries;

  const app = express();

  // Render metadata (categories/series) — no key involved (REQ-004).
  app.get('/api/meta', (req, res) => {
    res.json({ categories: CATEGORIES, series: SERIES });
  });

  // Proxy a single series (REQ-001, REQ-002, REQ-003).
  app.get('/api/series/:id', async (req, res) => {
    const { id } = req.params;
    if (!isAllowed(id)) {
      return res.status(400).json({ error: `Unknown or disallowed series: ${id}` });
    }
    try {
      const data = await fetchSeriesFn(id, apiKey);
      return res.json(data);
    } catch (err) {
      // Structured error, never leaks the key (REQ-010, EDGE-004/005).
      return res.status(502).json({ error: err.message, series_id: id });
    }
  });

  // Static dashboard (REQ-004). Served after API routes so /api/* wins.
  app.use(express.static(path.join(__dirname, '..', 'public')));

  return app;
}

// Direct execution → start the server (fails fast if key missing — NFR-002).
if (require.main === module) {
  require('dotenv').config();
  const port = process.env.PORT || 3000;
  const app = createApp();
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`FRED dashboard listening on http://localhost:${port}`);
  });
}

module.exports = { createApp };
