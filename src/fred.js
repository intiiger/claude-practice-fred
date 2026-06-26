/**
 * FRED API client — fetch a series and normalize its observations.
 * The API key is injected server-side here; it is never returned to callers.
 * @requirement REQ-001 normalized JSON {series_id, observations}
 * @requirement REQ-002 api_key injected into the FRED request
 * @requirement NFR-003 missing '.' values excluded
 * @requirement EDGE-001 missing value handling
 * @requirement EDGE-004 network error propagated
 * @requirement EDGE-005 FRED non-ok mapped to error without leaking the key
 */

const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations';

/**
 * Normalize FRED observations into [{date, value:Number}], dropping the FRED
 * missing-value marker '.' and preserving ascending date order.
 * @param {object} fredJson raw FRED JSON
 * @returns {Array<{date:string, value:number}>}
 */
function normalizeObservations(fredJson) {
  const obs = (fredJson && fredJson.observations) || [];
  return obs
    .filter((o) => o && o.value !== '.' && o.value !== '' && o.value != null)
    .map((o) => ({ date: o.date, value: Number(o.value) }))
    .filter((o) => Number.isFinite(o.value));
}

/**
 * Fetch a single FRED series and return normalized observations.
 * @param {string} id FRED series_id (caller is responsible for allowlisting)
 * @param {string} apiKey FRED API key (injected server-side)
 * @param {{observationStart?: string}} [opts]
 * @returns {Promise<{series_id:string, observations:Array<{date:string,value:number}>}>}
 * @throws {Error} on network failure or FRED non-ok response. The message
 *   never includes the API key.
 */
async function fetchSeries(id, apiKey, opts = {}) {
  const params = new URLSearchParams({
    series_id: id,
    api_key: apiKey,
    file_type: 'json',
  });
  if (opts.observationStart) {
    params.set('observation_start', opts.observationStart);
  }
  const url = `${FRED_BASE}?${params.toString()}`;

  let res;
  try {
    res = await fetch(url);
  } catch (err) {
    // Network-level failure (EDGE-004). Do not echo the URL (contains the key).
    throw new Error(`FRED request failed for series ${id}: ${err.message}`);
  }

  if (!res.ok) {
    // FRED returned 4xx/5xx (EDGE-005). Surface status, never the key/URL.
    throw new Error(`FRED returned ${res.status} for series ${id}`);
  }

  const json = await res.json();
  return { series_id: id, observations: normalizeObservations(json) };
}

module.exports = { normalizeObservations, fetchSeries, FRED_BASE };
