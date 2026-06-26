/**
 * Dashboard frontend — fetches category metadata and renders one line chart
 * per category from the proxy. Per-card errors are isolated (REQ-010).
 * @requirement REQ-004 5 category cards
 * @requirement REQ-005..REQ-009 each category chart with its indicators
 * @requirement REQ-010 per-card error state, dashboard does not crash
 */
/* global Chart */

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    let detail = '';
    try {
      detail = (await res.json()).error || '';
    } catch (_) {
      /* ignore body parse errors */
    }
    throw new Error(detail || `요청 실패 (${res.status})`);
  }
  return res.json();
}

function buildCard(category) {
  const card = document.createElement('section');
  card.className = 'card';
  card.dataset.category = category.name;

  const h2 = document.createElement('h2');
  h2.textContent = category.name;
  const ind = document.createElement('p');
  ind.className = 'ind';

  const wrap = document.createElement('div');
  wrap.className = 'chart-wrap';
  const canvas = document.createElement('canvas');
  wrap.appendChild(canvas);

  const status = document.createElement('p');
  status.className = 'status';
  status.textContent = '로딩 중…';

  card.append(h2, ind, wrap, status);
  return { card, canvas, status, ind };
}

async function renderCategory(category, series) {
  const { card, canvas, status, ind } = buildCard(category);
  document.getElementById('dashboard').appendChild(card);
  ind.textContent = category.ids.map((id) => (series[id] ? series[id].label : id)).join(' · ');

  try {
    const results = await Promise.all(
      category.ids.map(async (id) => {
        const data = await getJson(`/api/series/${id}`);
        return { id, data };
      })
    );

    // Use the union of observation dates as category labels (dependency-free —
    // avoids needing a Chart.js time-scale date adapter).
    const labelSet = new Set();
    results.forEach((r) => r.data.observations.forEach((o) => labelSet.add(o.date)));
    const labels = Array.from(labelSet).sort();

    const datasets = results.map((r, i) => {
      const byDate = new Map(r.data.observations.map((o) => [o.date, o.value]));
      return {
        label: series[r.id] ? series[r.id].label : r.id,
        data: labels.map((d) => (byDate.has(d) ? byDate.get(d) : null)),
        borderColor: COLORS[i % COLORS.length],
        backgroundColor: 'transparent',
        pointRadius: 0,
        borderWidth: 1.5,
        spanGaps: true,
        tension: 0.1,
      };
    });

    // eslint-disable-next-line no-new
    new Chart(canvas, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { x: { ticks: { maxTicksLimit: 6, autoSkip: true } } },
        plugins: { legend: { display: datasets.length > 1, position: 'bottom' } },
      },
    });
    status.remove();
    card.dataset.state = 'loaded';
  } catch (err) {
    status.textContent = `데이터를 불러오지 못했습니다: ${err.message}`;
    status.className = 'status error';
    card.dataset.state = 'error';
  }
}

async function init() {
  const dashboard = document.getElementById('dashboard');
  try {
    const meta = await getJson('/api/meta');
    // Render categories sequentially to preserve order; each isolates its own errors.
    for (const category of meta.categories) {
      // eslint-disable-next-line no-await-in-loop
      await renderCategory(category, meta.series);
    }
  } catch (err) {
    const p = document.createElement('p');
    p.className = 'status error';
    p.textContent = `메타데이터 로드 실패: ${err.message}`;
    dashboard.appendChild(p);
  } finally {
    dashboard.setAttribute('aria-busy', 'false');
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', init);
}
