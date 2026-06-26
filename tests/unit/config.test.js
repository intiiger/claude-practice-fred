/**
 * Unit tests for src/config.js — API key loading + fail-fast.
 * @requirement NFR-001 key from env only
 * @requirement NFR-002 fail-fast on missing key without leaking value
 * @requirement EDGE-003 missing FRED_API_KEY
 */
const { getApiKey } = require('../../src/config');

describe('getApiKey (NFR-001, NFR-002, EDGE-003)', () => {
  const original = process.env.FRED_API_KEY;
  afterEach(() => {
    if (original === undefined) delete process.env.FRED_API_KEY;
    else process.env.FRED_API_KEY = original;
  });

  test('returns the key from process.env.FRED_API_KEY', () => {
    process.env.FRED_API_KEY = 'test_key_abc123';
    expect(getApiKey()).toBe('test_key_abc123');
  });

  test('throws when FRED_API_KEY is unset', () => {
    delete process.env.FRED_API_KEY;
    expect(() => getApiKey()).toThrow(/FRED_API_KEY/);
  });

  test('throws when FRED_API_KEY is empty', () => {
    process.env.FRED_API_KEY = '';
    expect(() => getApiKey()).toThrow(/FRED_API_KEY/);
  });

  test('error message does not leak the key value', () => {
    process.env.FRED_API_KEY = '';
    try {
      getApiKey();
    } catch (e) {
      expect(e.message).not.toMatch(/secret|[a-f0-9]{32}/i);
    }
  });
});
