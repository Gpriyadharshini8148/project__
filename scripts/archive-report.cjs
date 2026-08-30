/**
 * archive-report.cjs
 * ───────────────────────────────────────────────────────────────────────────
 * Standalone script — does NOT modify any existing files.
 *
 * What it does:
 *   1. Reads the latest test results from  reports/test-results.json
 *   2. Zips the entire  playwright-report/  folder
 *   3. Saves the zip to  reports/archive/YYYY-MM-DD_HH-MM-SS_NNpassed_MMfailed.zip
 *   4. Keeps the last KEEP_LATEST archives (auto-deletes oldest)
 *
 * Usage:
 *   node scripts/archive-report.cjs           → archive latest report
 *   npm run archive-report                    → same via npm
 *
 * This script runs automatically after  npm run test:server-run  if you add
 * it as a posttest hook, but it does NOT change run-sequential.cjs at all.
 */

'use strict';

const { execSync, spawnSync } = require('child_process');
const path  = require('path');
const fs    = require('fs');

// ── Config ──────────────────────────────────────────────────────────────────
const REPORT_DIR    = 'playwright-report';           // folder to zip
const ARCHIVE_DIR   = path.join('reports', 'archive'); // where ZIPs are stored
const JSON_RESULTS  = path.join('reports', 'test-results.json');
const KEEP_LATEST   = 20;   // keep last N zips, delete older ones

// ── Helpers ─────────────────────────────────────────────────────────────────
function pad(n) { return String(n).padStart(2, '0'); }

function getTimestamp() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` +
         `_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

function getTestSummary() {
  try {
    if (!fs.existsSync(JSON_RESULTS)) return { passed: '?', failed: '?' };
    const raw  = JSON.parse(fs.readFileSync(JSON_RESULTS, 'utf8'));
    const stats = raw.stats || {};
    return {
      passed: stats.expected  ?? '?',
      failed: stats.unexpected ?? '?',
    };
  } catch {
    return { passed: '?', failed: '?' };
  }
}

function pruneOldArchives() {
  const files = fs.readdirSync(ARCHIVE_DIR)
    .filter(f => f.endsWith('.zip'))
    .map(f => ({ name: f, mtime: fs.statSync(path.join(ARCHIVE_DIR, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);   // newest first

  const toDelete = files.slice(KEEP_LATEST);
  toDelete.forEach(f => {
    fs.rmSync(path.join(ARCHIVE_DIR, f.name));
    console.log(`  🗑  Deleted old archive: ${f.name}`);
  });
}

// ── Main ────────────────────────────────────────────────────────────────────
(function main() {
  console.log('\n══════════════════════════════════════════════');
  console.log('  REPORT ARCHIVER');
  console.log('══════════════════════════════════════════════');

  // 1. Validate source exists
  if (!fs.existsSync(REPORT_DIR)) {
    console.error(`\n✗ Report folder not found: ${REPORT_DIR}`);
    console.error('  Run tests first:  npm run test:server-run');
    process.exit(1);
  }

  // 2. Ensure archive dir exists
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });

  // 3. Build zip filename
  const ts      = getTimestamp();
  const summary = getTestSummary();
  const zipName = `report_${ts}_${summary.passed}passed_${summary.failed}failed.zip`;
  const zipPath = path.join(ARCHIVE_DIR, zipName);

  // 4. Create ZIP using PowerShell (no extra npm packages needed)
  console.log(`\n  📦 Creating archive...`);
  console.log(`     Source : ${REPORT_DIR}/`);
  console.log(`     Output : ${zipPath}`);

  const result = spawnSync(
    'powershell',
    [
      '-NoProfile', '-Command',
      `Compress-Archive -Path "${REPORT_DIR}\\*" -DestinationPath "${zipPath}" -Force`,
    ],
    { encoding: 'utf8', shell: false }
  );

  if (result.status !== 0) {
    console.error('\n✗ ZIP creation failed:');
    console.error(result.stderr || result.stdout);
    process.exit(1);
  }

  const sizeMB = (fs.statSync(zipPath).size / 1024 / 1024).toFixed(2);
  console.log(`\n  ✅ Archived: ${zipName}  (${sizeMB} MB)`);

  // 5. Prune old archives
  pruneOldArchives();

  // 6. List all archives
  const allZips = fs.readdirSync(ARCHIVE_DIR)
    .filter(f => f.endsWith('.zip'))
    .sort()
    .reverse();

  console.log(`\n  📁 All archives in ${ARCHIVE_DIR}/  (${allZips.length} total):`);
  allZips.forEach((z, i) => {
    const size = (fs.statSync(path.join(ARCHIVE_DIR, z)).size / 1024 / 1024).toFixed(2);
    console.log(`     ${String(i + 1).padStart(2, ' ')}. ${z}  [${size} MB]`);
  });

  console.log('\n══════════════════════════════════════════════');
  console.log(`  To open any archive:`);
  console.log(`    1. Extract the zip`);
  console.log(`    2. cd into the extracted folder`);
  console.log(`    3. npx playwright show-report .`);
  console.log('══════════════════════════════════════════════\n');
})();
