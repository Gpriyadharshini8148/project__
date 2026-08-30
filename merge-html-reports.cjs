/**
 * merge-html-reports.cjs
 * Reads each Playwright HTML report folder in `final/` and creates a
 * single combined landing page at `final/merged-index.html`.
 * Parses test stats from the data zip files (report.jsonl inside each zip).
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const finalDir = path.join(__dirname, 'final');
const outputFile = path.join(finalDir, 'merged-index.html');

// Folder-to-spec-name mapping
const suiteNames = {
  '1':  '01 - Search Dealer',
  '2':  '02 - App Status',
  '3':  '03 - Zip Code',
  '4':  '04 - MITC',
  '5':  '05 - PAN Verification',
  '6':  '06 - Product Selection',
  '7':  '07 - Income Declaration',
  '8':  '08 - KYC',
  '9':  '09 - POI',
  '10': '10 - POA',
  '11': '11 - Surrogate Details',
  '12': '12 - Approval Details',
  '13': '13 - Additional Details',
  '14': '14 - Reappraisal',
  '15': '15 - Asset Cart',
};

const folders = fs.readdirSync(finalDir)
  .filter(f => {
    const full = path.join(finalDir, f);
    return fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, 'index.html'));
  })
  .sort((a, b) => parseInt(a) - parseInt(b));

console.log(`Found ${folders.length} report folders:`, folders);

// Try to extract stats from data zip files using raw zip reading
function parseSummaryFromZips(folder) {
  const dataDir = path.join(finalDir, folder, 'data');
  let passed = 0, failed = 0, skipped = 0, flaky = 0, duration = 0;

  if (!fs.existsSync(dataDir)) return { passed, failed, skipped, flaky, total: 0, duration };

  const zips = fs.readdirSync(dataDir).filter(f => f.endsWith('.zip'));
  
  for (const zip of zips) {
    try {
      const zipPath = path.join(dataDir, zip);
      const buf = fs.readFileSync(zipPath);
      
      // Simple ZIP central directory parsing to find and read report.jsonl
      // Look for raw string patterns in the zip content
      const content = buf.toString('binary');
      
      // Try to find JSONL data embedded in the ZIP by looking for test result patterns
      const jsonMatches = content.match(/"ok":(true|false)/g) || [];
      const passCount = content.match(/"status":"passed"/g);
      const failCount = content.match(/"status":"failed"/g);
      const skipCount = content.match(/"status":"skipped"/g);
      
      if (passCount) passed += passCount.length;
      if (failCount) failed += failCount.length;
      if (skipCount) skipped += skipCount.length;
    } catch (e) {
      // Skip unreadable zips
    }
  }

  return { passed, failed, skipped, flaky, total: passed + failed + skipped + flaky, duration };
}

// Fallback: try to count tests from HTML title or any embedded JSON
function parseSummaryFromHtml(folder) {
  const htmlPath = path.join(finalDir, folder, 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf-8');

  // Try various patterns
  const patterns = [
    { passed: /"passed":(\d+)/, failed: /"failed":(\d+)/, skipped: /"skipped":(\d+)/ },
    { passed: /(\d+) passed/, failed: /(\d+) failed/, skipped: /(\d+) skipped/ },
  ];

  for (const p of patterns) {
    const pm = html.match(p.passed);
    const fm = html.match(p.failed);
    const sm = html.match(p.skipped);
    if (pm || fm) {
      return {
        passed: pm ? parseInt(pm[1]) : 0,
        failed: fm ? parseInt(fm[1]) : 0,
        skipped: sm ? parseInt(sm[1]) : 0,
        flaky: 0,
        total: 0,
        duration: 0,
      };
    }
  }
  return null;
}

const rows = folders.map(folder => {
  let summary = parseSummaryFromHtml(folder);
  if (!summary || summary.total === 0) {
    summary = parseSummaryFromZips(folder);
  }
  if (!summary.total) summary.total = summary.passed + summary.failed + summary.skipped + summary.flaky;

  const name = suiteNames[folder] || `Suite ${folder}`;
  const status = summary.failed === 0 && summary.total > 0 ? 'PASS' : (summary.total === 0 ? 'UNKNOWN' : 'FAIL');
  const reportLink = `./${folder}/index.html`;
  return { folder, name, status, reportLink, ...summary };
});

const totals = rows.reduce((acc, r) => {
  acc.passed  += r.passed;
  acc.failed  += r.failed;
  acc.skipped += r.skipped;
  acc.flaky   += r.flaky;
  acc.total   += r.total;
  acc.duration += r.duration;
  return acc;
}, { passed: 0, failed: 0, skipped: 0, flaky: 0, total: 0, duration: 0 });

const overallStatus = totals.failed === 0 ? 'PASS' : 'FAIL';
const passPercent = totals.total > 0 ? Math.round((totals.passed / totals.total) * 100) : 0;

console.log('Parsed summaries:', rows.map(r => `${r.name}: P=${r.passed} F=${r.failed} S=${r.skipped}`));

const rowsHtml = rows.map(r => `
  <tr class="${r.failed > 0 ? 'fail-row' : r.status === 'UNKNOWN' ? '' : 'pass-row'}">
    <td><a href="${r.reportLink}" target="_blank">${r.name}</a></td>
    <td class="status ${r.status === 'PASS' ? 'pass' : r.status === 'FAIL' ? 'fail' : 'unknown'}">${r.status}</td>
    <td class="num">${r.total || '—'}</td>
    <td class="num pass-num">${r.passed || '—'}</td>
    <td class="num fail-num">${r.failed || '—'}</td>
    <td class="num skip-num">${r.skipped || '—'}</td>
    <td><a href="${r.reportLink}" target="_blank" class="btn">Open Report ↗</a></td>
  </tr>
`).join('');

const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>SFDC POS — Merged Test Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; background: #0d1117; color: #c9d1d9; min-height: 100vh; }
    header { background: linear-gradient(135deg, #161b22 0%, #0d1117 100%); padding: 32px 48px; border-bottom: 1px solid #21262d; display:flex; align-items:center; gap:16px; }
    header .icon { font-size: 36px; }
    header h1 { font-size: 26px; font-weight: 700; color: #f0f6fc; }
    header p  { margin-top: 4px; color: #8b949e; font-size: 13px; }
    .summary-cards { display: flex; gap: 16px; padding: 28px 48px 20px; flex-wrap: wrap; }
    .card { background: #161b22; border: 1px solid #21262d; border-radius: 10px; padding: 18px 24px; flex: 1; min-width: 120px; text-align: center; transition: border-color 0.2s; }
    .card:hover { border-color: #58a6ff; }
    .card .label { font-size: 11px; color: #8b949e; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 500; }
    .card .value { font-size: 32px; font-weight: 700; margin-top: 8px; line-height: 1; }
    .card.overall .value { color: ${overallStatus === 'PASS' ? '#3fb950' : '#f85149'}; }
    .card.passed  .value { color: #3fb950; }
    .card.failed  .value { color: #f85149; }
    .card.skipped .value { color: #d29922; }
    .card.total   .value { color: #58a6ff; }
    .progress-section { padding: 0 48px 28px; }
    .progress-bar { background: #21262d; border-radius: 8px; height: 10px; overflow: hidden; }
    .progress-bar .fill { height: 100%; background: linear-gradient(90deg, #238636, #3fb950); border-radius: 8px; width: ${passPercent}%; }
    .progress-label { margin-top: 8px; font-size: 13px; color: #8b949e; }
    .table-wrapper { padding: 0 48px 48px; }
    .table-title { font-size: 16px; font-weight: 600; color: #f0f6fc; margin-bottom: 14px; }
    table { width: 100%; border-collapse: collapse; background: #161b22; border: 1px solid #21262d; border-radius: 10px; overflow: hidden; }
    th { background: #1c2128; color: #8b949e; font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; padding: 12px 16px; text-align: left; font-weight: 600; }
    td { padding: 14px 16px; border-top: 1px solid #21262d; font-size: 14px; }
    td a { color: #58a6ff; text-decoration: none; }
    td a:hover { text-decoration: underline; }
    .fail-row { background: rgba(248,81,73,0.04); }
    .pass-row { }
    .status { font-weight: 700; font-size: 12px; letter-spacing: 0.5px; }
    .status.pass { color: #3fb950; }
    .status.fail { color: #f85149; }
    .status.unknown { color: #8b949e; }
    .num { text-align: center; }
    .pass-num { color: #3fb950; font-weight: 600; }
    .fail-num { color: #f85149; font-weight: 600; }
    .skip-num { color: #d29922; }
    .btn { display: inline-block; padding: 6px 14px; background: #1f6feb; color: #fff !important; border-radius: 6px; font-size: 12px; font-weight: 600; text-decoration: none !important; transition: background 0.2s; }
    .btn:hover { background: #388bfd; }
    tfoot td { font-weight: 700; background: #1c2128; border-top: 2px solid #30363d; color: #f0f6fc; }
    .note { padding: 0 48px 20px; font-size: 12px; color: #8b949e; font-style: italic; }
  </style>
</head>
<body>
  <header>
    <div class="icon">📊</div>
    <div>
      <h1>SFDC POS — Merged Test Report</h1>
      <p>Combined results from <strong>${folders.length} test suites</strong> &nbsp;·&nbsp; Generated ${now} IST</p>
    </div>
  </header>

  <div class="summary-cards">
    <div class="card overall">
      <div class="label">Overall</div>
      <div class="value">${overallStatus}</div>
    </div>
    <div class="card total">
      <div class="label">Total Tests</div>
      <div class="value">${totals.total}</div>
    </div>
    <div class="card passed">
      <div class="label">Passed ✓</div>
      <div class="value">${totals.passed}</div>
    </div>
    <div class="card failed">
      <div class="label">Failed ✗</div>
      <div class="value">${totals.failed}</div>
    </div>
    <div class="card skipped">
      <div class="label">Skipped</div>
      <div class="value">${totals.skipped}</div>
    </div>
  </div>

  <div class="progress-section">
    <div class="progress-bar"><div class="fill"></div></div>
    <div class="progress-label">${passPercent}% passed (${totals.passed} / ${totals.total})</div>
  </div>

  <div class="table-wrapper">
    <div class="table-title">Suite Breakdown</div>
    <table>
      <thead>
        <tr>
          <th>Test Suite</th>
          <th>Status</th>
          <th style="text-align:center">Total</th>
          <th style="text-align:center">Passed</th>
          <th style="text-align:center">Failed</th>
          <th style="text-align:center">Skipped</th>
          <th>Report</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
      <tfoot>
        <tr>
          <td>TOTAL — ${folders.length} Suites</td>
          <td class="status ${overallStatus === 'PASS' ? 'pass' : 'fail'}">${overallStatus}</td>
          <td class="num">${totals.total}</td>
          <td class="num pass-num">${totals.passed}</td>
          <td class="num fail-num">${totals.failed}</td>
          <td class="num skip-num">${totals.skipped}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>
  </div>
  <div class="note">⚠ Test counts parsed from zip data — minor discrepancies possible. Click "Open Report ↗" for full details of each suite.</div>
</body>
</html>`;

fs.writeFileSync(outputFile, html, 'utf-8');
console.log(`\n✅ Merged report created: ${outputFile}`);
console.log(`   Open it in your browser directly or run: npx playwright show-report final`);
console.log(`\nTotal: ${totals.total} | Passed: ${totals.passed} | Failed: ${totals.failed} | Overall: ${overallStatus}`);
