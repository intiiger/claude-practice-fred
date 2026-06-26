/**
 * Configuration — loads the FRED API key from the environment only.
 * @requirement NFR-001 key from env only, never to client
 * @requirement NFR-002 fail-fast on missing key, without leaking the value
 * @requirement EDGE-003 missing FRED_API_KEY
 */

/**
 * @returns {string} the FRED API key.
 * @throws {Error} when FRED_API_KEY is unset or empty. The message never
 *   contains the key value.
 */
function getApiKey() {
  const key = process.env.FRED_API_KEY;
  if (!key || key.trim() === '') {
    throw new Error('FRED_API_KEY is not set. Add it to your environment or .env file.');
  }
  return key;
}

module.exports = { getApiKey };
