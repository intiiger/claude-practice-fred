/**
 * Series allowlist + category metadata — single source of truth for the 8
 * representative indicators across 5 categories.
 * @requirement REQ-003 allowlist (open-proxy/SSRF guard)
 * @requirement REQ-004 5 category cards
 * @requirement REQ-005..REQ-009 category → indicator mapping
 */

// SERIES[id] = { id, label, category, units }
const SERIES = {
  FEDFUNDS: { id: 'FEDFUNDS', label: '기준금리', category: '금리', units: '%' },
  DGS10: { id: 'DGS10', label: '국채금리(10Y)', category: '금리', units: '%' },
  CPIAUCSL: { id: 'CPIAUCSL', label: '소비자물가 CPI', category: '물가', units: 'Index' },
  UNRATE: { id: 'UNRATE', label: '실업률', category: '고용', units: '%' },
  GDPC1: { id: 'GDPC1', label: '실질 GDP', category: '성장', units: 'Bil$' },
  INDPRO: { id: 'INDPRO', label: '산업생산', category: '성장', units: 'Index' },
  SP500: { id: 'SP500', label: 'S&P 500', category: '시장', units: 'Index' },
  DTWEXBGS: { id: 'DTWEXBGS', label: '달러지수', category: '시장', units: 'Index' },
};

// Ordered categories for deterministic dashboard rendering.
const CATEGORIES = [
  { name: '금리', ids: ['FEDFUNDS', 'DGS10'] },
  { name: '물가', ids: ['CPIAUCSL'] },
  { name: '고용', ids: ['UNRATE'] },
  { name: '성장', ids: ['GDPC1', 'INDPRO'] },
  { name: '시장', ids: ['SP500', 'DTWEXBGS'] },
];

/**
 * @returns {boolean} true only for ids present in the allowlist.
 */
function isAllowed(id) {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(SERIES, id);
}

module.exports = { SERIES, CATEGORIES, isAllowed };
