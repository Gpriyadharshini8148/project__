#!/usr/bin/env node
/**
 * generate-allure-report.cjs
 * Node.js-only Allure report generator — no Java required.
 * Reads allure-results/*.json and produces a self-contained HTML report.
 *
 * Usage:  node scripts/generate-allure-report.cjs
 *         node scripts/generate-allure-report.cjs --open
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// ── Config ───────────────────────────────────────────────────────────────────
const RESULTS_DIR = path.resolve('allure-results');
const OUTPUT_DIR  = path.resolve('allure-report');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'index.html');
const OPEN_AFTER  = process.argv.includes('--open');

// ── Load results ─────────────────────────────────────────────────────────────
if (!fs.existsSync(RESULTS_DIR)) {
  console.error(`❌ allure-results folder not found at: ${RESULTS_DIR}`);
  console.error('   Run your tests first: npm run test:server-run');
  process.exit(1);
}

const resultFiles = fs.readdirSync(RESULTS_DIR).filter(f => f.endsWith('-result.json'));
if (resultFiles.length === 0) {
  console.error('❌ No *-result.json files found in allure-results/');
  process.exit(1);
}

console.log(`📂 Loading ${resultFiles.length} result file(s) from allure-results...`);

const tests = resultFiles.map(file => {
  try {
    const raw = fs.readFileSync(path.join(RESULTS_DIR, file), 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}).filter(Boolean);

// ── Aggregate stats ───────────────────────────────────────────────────────────
const stats = { passed: 0, failed: 0, broken: 0, skipped: 0, total: 0 };
const suiteMap = {}; // suiteName -> { passed, failed, broken, skipped, tests[] }

tests.forEach(t => {
  const status = (t.status || 'unknown').toLowerCase();
  stats.total++;
  if (status === 'passed')  stats.passed++;
  else if (status === 'failed')  stats.failed++;
  else if (status === 'broken')  stats.broken++;
  else if (status === 'skipped') stats.skipped++;

  // Determine suite label
  const suiteLbl = (t.labels || []).find(l => l.name === 'suite')?.value
    || (t.labels || []).find(l => l.name === 'subSuite')?.value
    || (t.labels || []).find(l => l.name === 'package')?.value
    || 'Unknown Suite';

  if (!suiteMap[suiteLbl]) suiteMap[suiteLbl] = { passed:0, failed:0, broken:0, skipped:0, tests:[] };
  suiteMap[suiteLbl][status] = (suiteMap[suiteLbl][status] || 0) + 1;
  suiteMap[suiteLbl].tests.push(t);
});

const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : '0.0';

// Duration helpers
function durationMs(t) {
  if (t.start && t.stop) return t.stop - t.start;
  return 0;
}
function fmtDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms/1000).toFixed(1)}s`;
  const m = Math.floor(ms/60000), s = ((ms % 60000)/1000).toFixed(0);
  return `${m}m ${s}s`;
}

const totalDurationMs = tests.reduce((acc, t) => acc + durationMs(t), 0);
const runDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

// ── Build suite rows ──────────────────────────────────────────────────────────
function statusBadge(status) {
  const map = { passed:'badge-passed', failed:'badge-failed', broken:'badge-broken', skipped:'badge-skipped' };
  const icons = { passed:'✓', failed:'✗', broken:'⚡', skipped:'⊘' };
  const cls = map[(status||'').toLowerCase()] || 'badge-skipped';
  return `<span class="badge ${cls}">${icons[(status||'').toLowerCase()] || '?'} ${status || 'unknown'}</span>`;
}

function stepList(steps, depth) {
  if (!steps || steps.length === 0) return '';
  const indent = depth * 16;
  return steps.map(s => {
    const cls = (s.status || 'unknown').toLowerCase();
    const icon = cls === 'passed' ? '✓' : cls === 'failed' ? '✗' : '·';
    const sub = stepList(s.steps, depth + 1);
    return `<div class="step step-${cls}" style="margin-left:${indent}px">
      <span class="step-icon">${icon}</span> ${escHtml(s.name || '')}
      ${fmtDuration(durationMs(s))}
      ${sub}
    </div>`;
  }).join('');
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

let testRows = '';
let suiteBlocks = '';
let testIdx = 0;

Object.entries(suiteMap)
  .sort(([a],[b]) => a.localeCompare(b))
  .forEach(([suiteName, sd]) => {
    const suiteTotal = sd.tests.length;
    const suitePass  = sd.passed || 0;
    const suiteRate  = ((suitePass / suiteTotal) * 100).toFixed(0);
    const suiteCls   = sd.failed > 0 || sd.broken > 0 ? 'suite-fail' : 'suite-pass';

    let testRowsInSuite = '';
    sd.tests
      .sort((a,b) => (a.name||'').localeCompare(b.name||''))
      .forEach(t => {
        testIdx++;
        const tid = `test-${testIdx}`;
        const statusCls = (t.status||'unknown').toLowerCase();
        const dur = fmtDuration(durationMs(t));
        const errMsg = t.statusDetails?.message ? escHtml(t.statusDetails.message) : '';
        const steps  = stepList(t.steps || [], 0);

        testRowsInSuite += `
        <tr class="test-row test-${statusCls}" onclick="toggleDetail('${tid}')">
          <td class="td-status">${statusBadge(t.status)}</td>
          <td class="td-name">${escHtml(t.name || t.fullName || 'Unnamed test')}</td>
          <td class="td-dur">${dur}</td>
          <td class="td-toggle"><span class="chevron">▶</span></td>
        </tr>
        <tr id="${tid}" class="detail-row" style="display:none">
          <td colspan="4">
            <div class="detail-panel">
              ${errMsg ? `<div class="error-block"><strong>Error:</strong><pre>${errMsg}</pre></div>` : ''}
              ${t.statusDetails?.trace ? `<div class="trace-block"><pre>${escHtml(t.statusDetails.trace)}</pre></div>` : ''}
              ${steps ? `<div class="steps-block"><strong>Steps:</strong>${steps}</div>` : ''}
            </div>
          </td>
        </tr>`;

        testRows += testRowsInSuite.slice(testRowsInSuite.lastIndexOf('<tr class="test-row'));
      });

    suiteBlocks += `
    <div class="suite-card ${suiteCls}">
      <div class="suite-header" onclick="toggleSuite(this)">
        <div class="suite-title">
          <span class="suite-chevron">▶</span>
          <strong>${escHtml(suiteName)}</strong>
        </div>
        <div class="suite-meta">
          <span class="sm passed-c">✓ ${sd.passed||0}</span>
          <span class="sm failed-c">✗ ${(sd.failed||0)+(sd.broken||0)}</span>
          <span class="sm skipped-c">⊘ ${sd.skipped||0}</span>
          <span class="sm rate-c">${suiteRate}%</span>
        </div>
      </div>
      <div class="suite-body" style="display:none">
        <table class="test-table">
          <thead><tr><th>Status</th><th>Test Name</th><th>Duration</th><th></th></tr></thead>
          <tbody>${testRowsInSuite}</tbody>
        </table>
      </div>
    </div>`;
  });

// ── Donut SVG ─────────────────────────────────────────────────────────────────
function donutSvg(passed, failed, broken, skipped, total) {
  if (total === 0) return '<div class="no-data">No test data</div>';
  const R = 70, C = 2 * Math.PI * R;
  const segments = [
    { val: passed,  color: '#22c55e' },
    { val: failed,  color: '#ef4444' },
    { val: broken,  color: '#f97316' },
    { val: skipped, color: '#94a3b8' },
  ];
  let offset = 0;
  let paths = '';
  segments.forEach(seg => {
    if (!seg.val) return;
    const dash = (seg.val / total) * C;
    paths += `<circle r="${R}" cx="90" cy="90" fill="transparent" stroke="${seg.color}"
      stroke-width="28" stroke-dasharray="${dash} ${C - dash}"
      stroke-dashoffset="${-offset}" transform="rotate(-90 90 90)"/>`;
    offset += dash;
  });
  return `<svg width="180" height="180" viewBox="0 0 180 180">
    <circle r="${R}" cx="90" cy="90" fill="transparent" stroke="#1e293b" stroke-width="28"/>
    ${paths}
    <text x="90" y="86" text-anchor="middle" fill="#f1f5f9" font-size="26" font-weight="bold">${((passed/total)*100).toFixed(0)}%</text>
    <text x="90" y="108" text-anchor="middle" fill="#94a3b8" font-size="12">pass rate</text>
  </svg>`;
}

// ── HTML output ───────────────────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Allure Test Report — SFDC POS</title>
<style>
  :root {
    --bg: #0f172a; --surface: #1e293b; --surface2: #263047;
    --border: #334155; --text: #e2e8f0; --muted: #94a3b8;
    --passed: #22c55e; --failed: #ef4444; --broken: #f97316; --skipped: #94a3b8;
    --accent: #6366f1;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: var(--bg); color: var(--text); font-size: 14px; }
  a { color: var(--accent); }

  /* Header */
  .header { background: linear-gradient(135deg,#1e293b 0%,#0f172a 100%);
    border-bottom: 1px solid var(--border); padding: 24px 40px; display:flex; align-items:center; gap:20px; }
  .header-logo { font-size:28px; }
  .header-title h1 { font-size:22px; font-weight:700; color:#f1f5f9; }
  .header-title p  { color:var(--muted); font-size:13px; margin-top:2px; }

  /* Main layout */
  .container { max-width: 1400px; margin: 0 auto; padding: 32px 40px; }

  /* Summary cards */
  .summary-grid { display:grid; grid-template-columns:auto 1fr; gap:32px; align-items:start; margin-bottom:36px; }
  .donut-wrap { display:flex; flex-direction:column; align-items:center; gap:12px; background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:28px 32px; }
  .legend { display:flex; flex-direction:column; gap:6px; font-size:13px; }
  .legend-item { display:flex; align-items:center; gap:8px; }
  .legend-dot { width:10px;height:10px;border-radius:50%; }

  .stat-cards { display:grid; grid-template-columns:repeat(auto-fill, minmax(160px,1fr)); gap:16px; }
  .stat-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:20px; text-align:center; }
  .stat-card .num { font-size:36px; font-weight:800; margin-bottom:4px; }
  .stat-card .lbl { font-size:12px; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; }
  .stat-card.passed .num { color:var(--passed); }
  .stat-card.failed  .num { color:var(--failed); }
  .stat-card.broken  .num { color:var(--broken); }
  .stat-card.skipped .num { color:var(--skipped); }
  .stat-card.total   .num { color:var(--accent); }
  .stat-card.duration .num { color:#38bdf8; font-size:24px; }

  /* Filter bar */
  .filter-bar { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:24px; }
  .filter-btn { background:var(--surface2); border:1px solid var(--border); color:var(--text); padding:7px 16px; border-radius:8px; cursor:pointer; font-size:13px; transition:all .15s; }
  .filter-btn:hover, .filter-btn.active { background:var(--accent); border-color:var(--accent); color:#fff; }

  /* Suites */
  .suites-section h2 { font-size:17px; font-weight:700; margin-bottom:16px; color:#f1f5f9; }
  .suite-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; margin-bottom:12px; overflow:hidden; transition:box-shadow .15s; }
  .suite-card:hover { box-shadow:0 0 0 1px var(--accent)44; }
  .suite-card.suite-fail { border-left:3px solid var(--failed); }
  .suite-card.suite-pass { border-left:3px solid var(--passed); }
  .suite-header { display:flex; justify-content:space-between; align-items:center; padding:14px 20px; cursor:pointer; user-select:none; }
  .suite-header:hover { background:var(--surface2); }
  .suite-title { display:flex; align-items:center; gap:10px; font-size:14px; }
  .suite-chevron { font-size:10px; color:var(--muted); transition:transform .2s; }
  .suite-meta { display:flex; gap:16px; font-size:13px; }
  .sm { font-weight:600; }
  .passed-c { color:var(--passed); }
  .failed-c  { color:var(--failed); }
  .skipped-c { color:var(--skipped); }
  .rate-c   { color:var(--accent); }
  .suite-body { padding:0 12px 12px; }

  /* Test table */
  .test-table { width:100%; border-collapse:collapse; }
  .test-table thead th { background:var(--surface2); color:var(--muted); font-size:11px; text-transform:uppercase; letter-spacing:.5px; padding:8px 12px; text-align:left; }
  .test-row { cursor:pointer; transition:background .1s; }
  .test-row:hover { background:var(--surface2); }
  .test-row td { padding:10px 12px; border-bottom:1px solid var(--border)55; vertical-align:middle; }
  .td-name { max-width:600px; word-break:break-word; }
  .td-dur  { color:var(--muted); white-space:nowrap; }
  .td-status { width:120px; }
  .td-toggle { width:30px; color:var(--muted); }
  .chevron { font-size:10px; }

  /* Badges */
  .badge { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:6px; font-size:12px; font-weight:600; }
  .badge-passed  { background:#14532d44; color:var(--passed); }
  .badge-failed  { background:#7f1d1d44; color:var(--failed); }
  .badge-broken  { background:#7c2d1244; color:var(--broken); }
  .badge-skipped { background:#1e293b;   color:var(--skipped); }

  /* Detail panel */
  .detail-row td { padding:0; background:var(--bg); }
  .detail-panel { padding:16px 20px; border-top:1px solid var(--border); }
  .error-block { background:#7f1d1d22; border:1px solid #ef444433; border-radius:8px; padding:12px; margin-bottom:12px; }
  .error-block pre { color:#fca5a5; font-size:12px; white-space:pre-wrap; word-break:break-all; margin-top:6px; max-height:200px; overflow-y:auto; }
  .trace-block pre { color:var(--muted); font-size:11px; white-space:pre-wrap; max-height:150px; overflow-y:auto; margin-top:6px; }
  .steps-block { margin-top:8px; }
  .step { padding:3px 0; font-size:12px; display:flex; align-items:baseline; gap:6px; flex-wrap:wrap; }
  .step-icon { font-size:10px; }
  .step-passed .step-icon { color:var(--passed); }
  .step-failed  .step-icon { color:var(--failed); }

  /* Search */
  .search-input { background:var(--surface); border:1px solid var(--border); color:var(--text); padding:9px 14px; border-radius:8px; font-size:14px; width:280px; outline:none; }
  .search-input:focus { border-color:var(--accent); }

  /* Progress bar */
  .progress-bar { height:6px; border-radius:3px; background:var(--surface2); margin:12px 0; overflow:hidden; }
  .progress-fill { height:100%; border-radius:3px; background:linear-gradient(90deg,var(--passed),#16a34a); transition:width .3s; }

  /* Scrollbar */
  ::-webkit-scrollbar { width:6px; height:6px; }
  ::-webkit-scrollbar-track { background:var(--bg); }
  ::-webkit-scrollbar-thumb { background:var(--border); border-radius:3px; }

  /* Responsive */
  @media(max-width:768px) {
    .container { padding:16px; }
    .summary-grid { grid-template-columns:1fr; }
  }

  .no-data { color:var(--muted); text-align:center; padding:40px; }
  .generated-at { color:var(--muted); font-size:12px; text-align:right; margin-bottom:16px; }
</style>
</head>
<body>

<div class="header">
  <div class="header-logo">🎭</div>
  <div class="header-title">
    <h1>SFDC POS — Playwright Test Report</h1>
    <p>Generated: ${runDate} &nbsp;·&nbsp; ${stats.total} tests &nbsp;·&nbsp; ${resultFiles.length} result file(s)</p>
  </div>
</div>

<div class="container">

  <!-- Summary -->
  <div class="summary-grid">
    <div class="donut-wrap">
      ${donutSvg(stats.passed, stats.failed, stats.broken, stats.skipped, stats.total)}
      <div class="legend">
        <div class="legend-item"><div class="legend-dot" style="background:#22c55e"></div>Passed (${stats.passed})</div>
        <div class="legend-item"><div class="legend-dot" style="background:#ef4444"></div>Failed (${stats.failed})</div>
        <div class="legend-item"><div class="legend-dot" style="background:#f97316"></div>Broken (${stats.broken})</div>
        <div class="legend-item"><div class="legend-dot" style="background:#94a3b8"></div>Skipped (${stats.skipped})</div>
      </div>
    </div>
    <div class="stat-cards">
      <div class="stat-card total">   <div class="num">${stats.total}</div>   <div class="lbl">Total</div></div>
      <div class="stat-card passed">  <div class="num">${stats.passed}</div>  <div class="lbl">Passed</div></div>
      <div class="stat-card failed">  <div class="num">${stats.failed}</div>  <div class="lbl">Failed</div></div>
      <div class="stat-card broken">  <div class="num">${stats.broken}</div>  <div class="lbl">Broken</div></div>
      <div class="stat-card skipped"> <div class="num">${stats.skipped}</div> <div class="lbl">Skipped</div></div>
      <div class="stat-card duration"><div class="num">${fmtDuration(totalDurationMs)}</div><div class="lbl">Total Time</div></div>
      <div class="stat-card passed">  <div class="num">${passRate}%</div>     <div class="lbl">Pass Rate</div></div>
    </div>
  </div>

  <!-- Progress -->
  <div class="progress-bar" title="${passRate}% passed">
    <div class="progress-fill" style="width:${passRate}%"></div>
  </div>

  <!-- Filters + Search -->
  <div class="filter-bar">
    <button class="filter-btn active" onclick="filterTests('all',this)">All (${stats.total})</button>
    <button class="filter-btn" onclick="filterTests('passed',this)">✓ Passed (${stats.passed})</button>
    <button class="filter-btn" onclick="filterTests('failed',this)">✗ Failed (${stats.failed})</button>
    <button class="filter-btn" onclick="filterTests('broken',this)">⚡ Broken (${stats.broken})</button>
    <button class="filter-btn" onclick="filterTests('skipped',this)">⊘ Skipped (${stats.skipped})</button>
    <input class="search-input" type="text" placeholder="🔍 Search test name…" oninput="searchTests(this.value)"/>
  </div>

  <!-- Suite blocks -->
  <div class="suites-section" id="suites-container">
    <h2>Test Suites (${Object.keys(suiteMap).length})</h2>
    ${suiteBlocks}
  </div>

</div>

<script>
function toggleDetail(id) {
  const row = document.getElementById(id);
  const btn = row.previousElementSibling.querySelector('.chevron');
  if (row.style.display === 'none') {
    row.style.display = '';
    if (btn) btn.textContent = '▼';
  } else {
    row.style.display = 'none';
    if (btn) btn.textContent = '▶';
  }
}

function toggleSuite(header) {
  const body = header.nextElementSibling;
  const chevron = header.querySelector('.suite-chevron');
  if (body.style.display === 'none') {
    body.style.display = '';
    if (chevron) chevron.style.transform = 'rotate(90deg)';
  } else {
    body.style.display = 'none';
    if (chevron) chevron.style.transform = '';
  }
}

function filterTests(status, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.suite-card').forEach(suite => {
    const rows = suite.querySelectorAll('.test-row');
    let anyVisible = false;
    rows.forEach(row => {
      const detailRow = row.nextElementSibling;
      const show = status === 'all' || row.classList.contains('test-' + status);
      row.style.display = show ? '' : 'none';
      if (detailRow && detailRow.classList.contains('detail-row')) {
        if (!show) detailRow.style.display = 'none';
      }
      if (show) anyVisible = true;
    });
    suite.style.display = anyVisible ? '' : 'none';
  });
}

function searchTests(q) {
  q = q.toLowerCase();
  document.querySelectorAll('.suite-card').forEach(suite => {
    const rows = suite.querySelectorAll('.test-row');
    let anyVisible = false;
    rows.forEach(row => {
      const name = row.querySelector('.td-name')?.textContent?.toLowerCase() || '';
      const show = !q || name.includes(q);
      row.style.display = show ? '' : 'none';
      const detail = row.nextElementSibling;
      if (detail && detail.classList.contains('detail-row') && !show) detail.style.display = 'none';
      if (show) anyVisible = true;
    });
    suite.style.display = anyVisible ? '' : 'none';
    if (anyVisible && q) {
      const body = suite.querySelector('.suite-body');
      if (body) body.style.display = '';
    }
  });
}
</script>
</body>
</html>`;

// ── Write output ──────────────────────────────────────────────────────────────
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(OUTPUT_FILE, html, 'utf8');

console.log(`\n✅ Allure report generated!`);
console.log(`   📄 File: ${OUTPUT_FILE}`);
console.log(`   📊 ${stats.total} tests — ✓ ${stats.passed} passed / ✗ ${stats.failed} failed / ⚡ ${stats.broken} broken / ⊘ ${stats.skipped} skipped`);
console.log(`   🎯 Pass rate: ${passRate}%`);
console.log(`   ⏱  Total time: ${fmtDuration(totalDurationMs)}\n`);

if (OPEN_AFTER) {
  console.log('🌐 Opening report in browser...');
  const start = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  try { execSync(`${start} "${OUTPUT_FILE}"`); } catch { console.log(`   → Open manually: ${OUTPUT_FILE}`); }
}
