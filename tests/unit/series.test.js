/**
 * Unit tests for src/series.js — allowlist + category metadata.
 * @requirement REQ-003 series_id allowlist
 * @requirement REQ-004 5 category cards
 * @requirement REQ-005..REQ-009 category → indicator mapping
 */
const { SERIES, CATEGORIES, isAllowed } = require('../../src/series');

describe('series allowlist (REQ-003)', () => {
  test('isAllowed returns true for the 8 representative series', () => {
    const ids = ['FEDFUNDS', 'DGS10', 'CPIAUCSL', 'UNRATE', 'GDPC1', 'INDPRO', 'SP500', 'DTWEXBGS'];
    ids.forEach((id) => expect(isAllowed(id)).toBe(true));
  });

  test('isAllowed rejects ids outside the allowlist (SSRF/open-proxy guard)', () => {
    expect(isAllowed('GDP')).toBe(false);
    expect(isAllowed('../etc')).toBe(false);
    expect(isAllowed('')).toBe(false);
    expect(isAllowed(undefined)).toBe(false);
  });

  test('SERIES contains exactly the 8 allowed ids', () => {
    expect(Object.keys(SERIES).sort()).toEqual(
      ['CPIAUCSL', 'DGS10', 'DTWEXBGS', 'FEDFUNDS', 'GDPC1', 'INDPRO', 'SP500', 'UNRATE'].sort()
    );
  });
});

describe('category metadata (REQ-004..REQ-009)', () => {
  test('CATEGORIES has the 5 categories in order', () => {
    expect(CATEGORIES.map((c) => c.name)).toEqual(['금리', '물가', '고용', '성장', '시장']);
  });

  test('금리 maps to FEDFUNDS + DGS10 (REQ-005)', () => {
    expect(CATEGORIES.find((c) => c.name === '금리').ids).toEqual(['FEDFUNDS', 'DGS10']);
  });

  test('물가 maps to CPIAUCSL (REQ-006)', () => {
    expect(CATEGORIES.find((c) => c.name === '물가').ids).toEqual(['CPIAUCSL']);
  });

  test('고용 maps to UNRATE (REQ-007)', () => {
    expect(CATEGORIES.find((c) => c.name === '고용').ids).toEqual(['UNRATE']);
  });

  test('성장 maps to GDPC1 + INDPRO (REQ-008)', () => {
    expect(CATEGORIES.find((c) => c.name === '성장').ids).toEqual(['GDPC1', 'INDPRO']);
  });

  test('시장 maps to SP500 + DTWEXBGS (REQ-009)', () => {
    expect(CATEGORIES.find((c) => c.name === '시장').ids).toEqual(['SP500', 'DTWEXBGS']);
  });

  test('every id referenced by a category exists in SERIES', () => {
    CATEGORIES.forEach((c) => c.ids.forEach((id) => expect(SERIES[id]).toBeDefined()));
  });
});
