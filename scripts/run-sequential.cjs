/**
 * run-sequential.cjs
 *
 * Sequential File Runner — Azure Windows Server Mode
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs each test FILE one-by-one (sequentially).
 * Within each file, ALL test cases run IN PARALLEL using exactly as many
 * workers as there are test cases in that file (dynamic — no hardcoding).
 *
 * Usage:
 *   node scripts/run-sequential.cjs            → full run
 *   node scripts/run-sequential.cjs --dry-run  → count tests only, no execution
 *
 * Add/remove files by editing the TEST_FILES array below.
 * Adjust worker cap by setting the MAX_WORKERS env variable:
 *   $env:MAX_WORKERS=32; npm run test:server-run
 */

'use strict';

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');


//   EDIT THIS LIST to add/remove/reorder files.
//    Phase 2 files are commented out — just uncomment when ready.

const TEST_FILES = [
  // ── Phase 1 ───────────
  { path: 'tests/customer/01_searchDealer.spec.ts' },
  { path: 'tests/customer/02_appStatus.spec.ts' },
  { path: 'tests/customer/03_zipCode.spec.ts' },
  { path: 'tests/customer/04_mitc.spec.ts' },
  { path: 'tests/customer/05_panVerification.spec.ts' },
  { path: 'tests/customer/06_productSelection.spec.ts', grep: '06A' },
  { path: 'tests/customer/07_incomeDeclaration.spec.ts', grep: '07A' },
  { path: 'tests/customer/08_kyc.spec.ts', grep: '08A' },
  { path: 'tests/customer/09_poi.spec.ts', grep: '09A' },
  { path: 'tests/customer/10_poa.spec.ts', grep: '10A' },
  { path: 'tests/customer/11_surrogateDetails.spec.ts', grep: "11A" },
  { path: 'tests/customer/12_approvalDetails.spec.ts', grep: '12A' },
  { path: 'tests/customer/13_additionalDetails.spec.ts', grep: '13A' },
  { path: 'tests/customer/14_reappraisal.spec.ts', grep: '14A' },
  { path: 'tests/customer/15_assetCart.spec.ts', grep: '15A' },
];

// Configuration

// Workers per file = number of test cases in that file, capped at MAX_WORKERS.
// Default is 20. Override via: $env:MAX_WORKERS=10; npm run test:server-run
const MAX_WORKERS = parseInt(process.env.MAX_WORKERS || '20', 10);
const DRY_RUN = process.argv.includes('--dry-run');
const CONFIG_FILE = 'playwright.config.ts';

// Blob reports from each file accumulate here, then get merged into one report
const BLOB_DIR = 'blob-report';
// playwright merge-reports outputs HTML to playwright-report/ by default
const MERGED_HTML_DIR = 'playwright-report';
const MERGED_JSON_FILE = 'reports/test-results.json';


// Helpers

function hr(char = '═', len = 62) {
  return char.repeat(len);
}

function log(msg) {
  console.log(msg);
}

/**
 * Count the number of active test() blocks in a file.
 * First tries playwright --list --reporter=json, then falls back to regex.
 */
function countTests(filePath, grepPattern) {
  try {
    const args = ['playwright', 'test', filePath, '--list', '--reporter=json', `--config=${CONFIG_FILE}`];
    if (grepPattern) args.push(`--grep="${grepPattern}"`);

    const result = spawnSync(
      'npx',
      args,
      { encoding: 'utf8', shell: true, timeout: 60_000 }
    );

    const raw = (result.stdout || '').trim();
    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
      const suites = parsed.suites || [];
      let count = 0;
      function countSpecs(suite) {
        if (suite.specs) count += suite.specs.length;
        if (suite.suites) suite.suites.forEach(countSpecs);
      }
      suites.forEach(countSpecs);
      if (count > 0) return count;
    }
  } catch (_) { /* fall through */ }

  // ── Fallback: regex grep on the file ─────────────
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = content.match(/^\s*test\s*\(/gm) || [];
    return matches.length;
  } catch (_) {
    return 1; // safe default
  }
}

/**
 * Run a single test file with the given worker count.
 * Uses blob reporter so results ACCUMULATE across all file runs.
 * Streams live Playwright output to console via the list reporter.
 */
function runFile(filePath, workers, index, grepPattern) {
  const start = Date.now();

  // Set a unique output directory for the blob report of this file
  // so that subsequent runs don't clear the previous file's report
  const env = Object.assign({}, process.env, {
    PLAYWRIGHT_BLOB_OUTPUT_DIR: path.join(BLOB_DIR, String(index))
  });

  const args = [
    'playwright', 'test', filePath,
    `--workers=${workers}`,
    `--config=${CONFIG_FILE}`,
    // blob  → saves raw results into PLAYWRIGHT_BLOB_OUTPUT_DIR
    // list  → prints live test results to console
    '--reporter=blob,list',
  ];
  if (grepPattern) args.push(`--grep="${grepPattern}"`);

  const result = spawnSync(
    'npx',
    args,
    { env, encoding: 'utf8', shell: true, stdio: 'inherit', timeout: 30 * 60 * 1000 }
  );
  return { exitCode: result.status ?? 1, durationMs: Date.now() - start };
}

/**
 * Merge all accumulated blob reports into one combined HTML + JSON report.
 * Called once after all files have finished running.
 */
function mergeReports() {
  log('');
  log('  \u23f3 Merging results from all files into one combined report...');

  // Ensure reports/ dir exists for JSON output
  if (!fs.existsSync('reports')) fs.mkdirSync('reports', { recursive: true });

  // ── Collect all zip files from subdirs (blob-report/0/, /1/, /2/ ...) ────
  // merge-reports only accepts ONE directory, so we copy all zips into a
  // temporary flat folder first, then merge from there.
  const TEMP_DIR = path.join(BLOB_DIR + '-merge-temp');

  // Clean and recreate temp dir
  if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  let zipCount = 0;
  if (fs.existsSync(BLOB_DIR)) {
    const entries = fs.readdirSync(BLOB_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subDir = path.join(BLOB_DIR, entry.name);
        const zips = fs.readdirSync(subDir).filter(f => f.endsWith('.zip'));
        zips.forEach(zip => {
          fs.copyFileSync(
            path.join(subDir, zip),
            path.join(TEMP_DIR, `report-${entry.name}.zip`)
          );
          zipCount++;
        });
      } else if (entry.name.endsWith('.zip')) {
        // Handle zips directly in blob-report/ root (fallback)
        fs.copyFileSync(
          path.join(BLOB_DIR, entry.name),
          path.join(TEMP_DIR, entry.name)
        );
        zipCount++;
      }
    }
  }

  if (zipCount === 0) {
    log('  \u26a0\ufe0f  No blob report zip files found — skipping merge.');
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    return;
  }

  log(`  \u2192 Collected ${zipCount} blob zip(s) — merging...`);

  // ── HTML report ───────────────────────────────────────────────────────────
  const htmlResult = spawnSync(
    'npx',
    ['playwright', 'merge-reports', '--reporter=html', TEMP_DIR],
    { encoding: 'utf8', shell: true, stdio: 'inherit', timeout: 60_000 }
  );

  if (htmlResult.status === 0) {
    log(`  \u2705 Combined HTML report  \u2192 ${MERGED_HTML_DIR}/index.html`);
  } else {
    log(`  \u26a0\ufe0f  HTML merge had issues (exit code ${htmlResult.status})`);
  }

  // ── Allure report ─────────────────────────────────────────────────────────
  if (fs.existsSync('allure-results')) fs.rmSync('allure-results', { recursive: true, force: true });
  if (fs.existsSync('allure-report')) fs.rmSync('allure-report', { recursive: true, force: true });

  const allureResult = spawnSync(
    'npx',
    ['playwright', 'merge-reports', '--reporter=allure-playwright', TEMP_DIR],
    { encoding: 'utf8', shell: true, stdio: 'inherit', timeout: 60_000 }
  );

  if (allureResult.status === 0) {
    spawnSync('npx', ['allure', 'generate', './allure-results', '-o', './allure-report', '--clean'], { shell: true, stdio: 'ignore' });
    log(`  \u2705 Combined Allure report \u2192 ./allure-report/index.html`);
  } else {
    log(`  \u26a0\ufe0f  Allure merge had issues`);
  }

  // ── JSON report ───────────────────────────────────────────────────────────
  const jsonResult = spawnSync(
    'npx',
    ['playwright', 'merge-reports', '--reporter=json', TEMP_DIR],
    { encoding: 'utf8', shell: true, stdio: 'pipe', timeout: 60_000 }
  );

  if (jsonResult.status === 0 && jsonResult.stdout) {
    try {
      const raw = jsonResult.stdout.trim();
      const jsonStart = raw.indexOf('{');
      const jsonEnd = raw.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        fs.writeFileSync(MERGED_JSON_FILE, raw.slice(jsonStart, jsonEnd + 1), 'utf8');
        log(`  \u2705 Combined JSON report   \u2192 ${MERGED_JSON_FILE}`);
      }
    } catch (_) {
      log('  \u26a0\ufe0f  Could not save JSON report');
    }
  }

  // ── Clean up temp dir ─────────────────────────────────────────────────────
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
}

function formatDuration(ms) {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

// Main

async function main() {
  const totalFiles = TEST_FILES.length;
  const overallStart = Date.now();

  log('');
  log(hr());
  log('  SEQUENTIAL FILE RUNNER \u2014 Azure Windows Server Mode');
  log(`  Phase 1: ${totalFiles} file(s)   |   MAX_WORKERS cap: ${MAX_WORKERS}`);
  if (DRY_RUN) log('  \u26a0\ufe0f  DRY RUN \u2014 test counts only, no execution');
  log(hr());
  log('');

  // Validate all files exist before starting
  const missing = TEST_FILES.filter(f => !fs.existsSync(f.path));
  if (missing.length > 0) {
    log('\u274c ERROR: The following files were not found:');
    missing.forEach(f => log(`   \u2022 ${f.path}`));
    log('');
    log('Fix the TEST_FILES list in scripts/run-sequential.cjs and retry.');
    process.exit(1);
  }

  // Clean blob-report dir so we start fresh (no leftover data from previous run)
  if (!DRY_RUN && fs.existsSync(BLOB_DIR)) {
    fs.rmSync(BLOB_DIR, { recursive: true, force: true });
    log(`  \u267b\ufe0f  Cleared old blob reports from previous run`);
    log('');
  }

  const results = [];

  for (let i = 0; i < TEST_FILES.length; i++) {
    const fileObj = TEST_FILES[i];
    const filePath = fileObj.path;
    const grepPattern = fileObj.grep;
    const label = `[${i + 1}/${totalFiles}]`;

    log(`${label} ${filePath}${grepPattern ? ` (grep: ${grepPattern})` : ''}`);
    log('  \u2192 Counting test cases...');

    const testCount = countTests(filePath, grepPattern);
    const workers = Math.min(testCount, MAX_WORKERS);

    log(`  \u2192 Detected: ${testCount} test case(s)`);
    log(`  \u2192 Workers:  ${workers} (all ${testCount} running in parallel${workers < testCount ? ` \u2014 capped at ${MAX_WORKERS}` : ''})`);

    if (DRY_RUN) {
      log('  \u2192 \u23ed  Skipped (dry run)');
      log('');
      results.push({ filePath, testCount, workers, status: 'skipped', passed: null, duration: 0 });
      continue;
    }

    log('  \u2192 Launching...');
    log(hr('\u2500'));

    const { exitCode, durationMs } = runFile(filePath, workers, i, grepPattern);

    log(hr('\u2500'));
    const passed = exitCode === 0;
    log(`  \u2192 ${passed ? '\u2705 PASSED' : '\u274c FAILED'}   Time: ${formatDuration(durationMs)}`);
    log('');

    results.push({ filePath, testCount, workers, status: passed ? 'PASSED' : 'FAILED', passed, duration: durationMs });

    // NOTE: We do NOT stop on failure — we let all files run so the final
    // merged report shows results from every file, not just up to the first failure.
  }

  // ── Final Summary ─────────────────────────────────────────────────────────
  const totalDuration = Date.now() - overallStart;
  const passedFiles = results.filter(r => r.passed === true).length;
  const failedFiles = results.filter(r => r.passed === false).length;

  log(hr());
  log('  FINAL SUMMARY \u2014 Phase 1');
  log(hr('\u2500'));
  log(`  ${'File'.padEnd(48)} ${'Tests'.padEnd(7)} ${'Workers'.padEnd(9)} Status`);
  log(`  ${'\u2500'.repeat(48)} ${'\u2500'.repeat(7)} ${'\u2500'.repeat(9)} ${'\u2500'.repeat(8)}`);
  results.forEach(r => {
    const name = r.filePath.replace('tests/', '').padEnd(48);
    const icon = r.passed === true ? '\u2705' : r.passed === false ? '\u274c' : '\u23ed';
    log(`  ${name} ${String(r.testCount).padEnd(7)} ${String(r.workers).padEnd(9)} ${icon} ${r.status}`);
  });
  log(hr('\u2500'));

  if (!DRY_RUN) {
    log(`  Files run:     ${totalFiles} / ${totalFiles}`);
    log(`  \u2705 Passed:     ${passedFiles}`);
    log(`  \u274c Failed:     ${failedFiles}`);
    log(`  Total Time:    ${formatDuration(totalDuration)}`);
    log(hr());
    log('');

    // ── Merge all blob reports into ONE combined HTML report ───────────────
    mergeReports();

    log('');
    log('  \ud83d\udcca View the full combined report by running:');
    log('       npm run report');
    log('');
  } else {
    log(`  Dry run complete. ${totalFiles} file(s) ready to run.`);
    log('  Run without --dry-run to execute: npm run test:server-run');
    log(hr());
    log('');
  }

  if (failedFiles > 0) {
    log('\u274c Failed files:');
    results.filter(r => !r.passed).forEach(r => log(`   \u2022 ${r.filePath}`));
    log('');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Unexpected error in runner:', err);
  process.exit(1);
});
