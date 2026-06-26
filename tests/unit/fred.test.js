/**
 * Unit tests for src/fred.js — normalization + fetch (fetch mocked at Level 0).
 * @requirement REQ-001 normalized JSON
 * @requirement REQ-002 api_key injected server-side
 * @requirement NFR-003 missing '.' values excluded
 * @requirement EDGE-001 missing value handling
 * @requirement EDGE-004 FRED/network error
 * @requirement EDGE-005 FRED 4xx mapped to error without leaking key
 */
const { normalizeObservations, fetchSeries } = require('../../src/fred');

describe('normalizeObservations (REQ-001, NFR-003, EDGE-001)', () => {
  test('maps date + numeric value, ascending', () => {
    const json = {
      observations: [
        { date: '2020-01-01', value: '1.5' },
        { date: '2020-02-01', value: '1.7' },
      ],
    };
    expect(normalizeObservations(json)).toEqual([
      { date: '2020-01-01', value: 1.5 },
      { date: '2020-02-01', value: 1.7 },
    ]);
  });

  test('excludes FRED missing marker "." (NFR-003, EDGE-001)', () => {
    const json = {
      observations: [
        { date: '2020-01-01', value: '.' },
        { date: '2020-02-01', value: '2.0' },
      ],
    };
    expect(normalizeObservations(json)).toEqual([{ date: '2020-02-01', value: 2.0 }]);
  });

  test('handles empty / missing observations array', () => {
    expect(normalizeObservations({ observations: [] })).toEqual([]);
    expect(normalizeObservations({})).toEqual([]);
  });
});

describe('fetchSeries (REQ-001, REQ-002, EDGE-004, EDGE-005)', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
    jest.restoreAllMocks();
  });

  test('injects api_key and series_id into the FRED request (REQ-002)', async () => {
    let calledUrl = '';
    global.fetch = jest.fn(async (url) => {
      calledUrl = String(url);
      return { ok: true, json: async () => ({ observations: [{ date: '2020-01-01', value: '1.0' }] }) };
    });
    const out = await fetchSeries('FEDFUNDS', 'KEY123');
    expect(calledUrl).toContain('series_id=FEDFUNDS');
    expect(calledUrl).toContain('api_key=KEY123');
    expect(calledUrl).toContain('file_type=json');
    expect(out).toEqual({ series_id: 'FEDFUNDS', observations: [{ date: '2020-01-01', value: 1.0 }] });
  });

  test('throws on FRED non-ok response, without leaking the key (EDGE-005)', async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 400, json: async () => ({ error_message: 'Bad Request' }) }));
    await expect(fetchSeries('FEDFUNDS', 'SECRETKEY')).rejects.toThrow();
    await expect(fetchSeries('FEDFUNDS', 'SECRETKEY')).rejects.not.toThrow(/SECRETKEY/);
  });

  test('propagates network errors (EDGE-004)', async () => {
    global.fetch = jest.fn(async () => {
      throw new Error('network down');
    });
    await expect(fetchSeries('FEDFUNDS', 'KEY')).rejects.toThrow();
  });
});
