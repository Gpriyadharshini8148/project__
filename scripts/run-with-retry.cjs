/**
 * run-with-retry.cjs
 *
 * Smart Sequential Runner with Automatic Retry + Merged Report
 * ─────────────────────────────────────────────────────────────────────────────
 * PIPELINE FLOW:
 *   1. Run each test FILE sequentially (files run one by one).
 *   2. Within each file, all test cases run IN PARALLEL (workers = test count).
 *   3. After ALL files finish → Playwright detects which tests failed.
 *   4. Re-run only the failed test cases using --last-failed flag.
 *   5. Retry blob reports are saved separately so original passes are kept.
 *   6. Merge ALL blob reports (original passes + re-run results) into ONE report.
 *
 * Usage:
 *   node scripts/run-with-retry.cjs            -> full run + retry + merge
 *   node scripts/run-with-retry.cjs --dry-run  -> count tests only, no execution
 *   node scripts/run-with-retry.cjs --no-retry -> skip the retry phase
 *
 * Env vars:
 *   MAX_WORKERS=20   -> cap on parallel workers per file (default: 20)
 *   MAX_RETRIES=1    -> how many retry rounds (default: 1)
 */

'use strict';

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// TEST FILE LIST
const TEST_FILES = [
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
  { path: 'tests/customer/11_surrogateDetails.spec.ts', grep: '11A' },
  { path: 'tests/customer/12_approvalDetails.spec.ts', grep: '12A' },
  { path: 'tests/customer/13_additionalDetails.spec.ts', grep: '13A' },
  { path: 'tests/customer/14_reappraisal.spec.ts', grep: '14A' },
  { path: 'tests/customer/15_assetCart.spec.ts', grep: '15A' },
];

// CONFIGURATION
const MAX_WORKERS  = parseInt(process.env.MAX_WORKERS  || '20', 10);
const MAX_RETRIES  = parseInt(process.env.MAX_RETRIES  || '1',  10);
const DRY_RUN      = process.argv.includes('--dry-run');
const NO_RETRY     = process.argv.includes('--no-retry');
const CONFIG_FILE  = 'playwright.config.ts';

const BLOB_DIR         = 'blob-report';
const RETRY_BLOB_DIR   = 'blob-report-retry';
const MERGED_HTML_DIR  = 'playwright-report';
const MERGED_JSON_FILE = 'reports/test-results.json';

// HELPERS
function hr(char = '=', len = 62) { return char.repeat(len); }
function log(msg) { console.log(msg); }
function formatDuration(ms) {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

function countTests(filePath, grepPattern) {
  try {
    const args = ['playwright', 'test', filePath, '--list', '--reporter=json', `--config=${CONFIG_FILE}`];
    if (grepPattern) args.push(`--grep="${grepPattern}"`);
    const result = spawnSync('npx', args, { encoding: 'utf8', shell: true, timeout: 60000 });
    const raw = (result.stdout || '').trim();
    const jsonStart = raw.indexOf('{');
    const jsonEnd   = raw.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
      let count = 0;
      function countSpecs(suite) {
        if (suite.specs)  count += suite.specs.length;
        if (suite.suites) suite.suites.forEach(countSpecs);
      }
      (parsed.suites || []).forEach(countSpecs);
      if (count > 0) return count;
    }
  } catch (_) {}
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return (content.match(/^\s*test\s*\(/gm) || []).length;
  } catch (_) { return 1; }
}

function runFile(filePath, workers, blobSubDir, grepPattern) {
  const start = Date.now();
  const index = path.basename(blobSubDir);
  const jsonReportPath = path.join('test-results', `report-${index}.json`);
  const env = Object.assign({}, process.env, { 
    PLAYWRIGHT_BLOB_OUTPUT_DIR: blobSubDir,
    PLAYWRIGHT_JSON_OUTPUT_NAME: jsonReportPath
  });
  const args = [
    'playwright', 'test', filePath,
    `--workers=${workers}`,
    `--config=${CONFIG_FILE}`,
    '--reporter=blob,list,json',
  ];
  if (grepPattern) args.push(`--grep="${grepPattern}"`);
  const result = spawnSync('npx', args, { env, encoding: 'utf8', shell: true, stdio: 'inherit', timeout: 30 * 60 * 1000 });
  return { exitCode: result.status ?? 1, durationMs: Date.now() - start };
}

function runRetry(retryRound) {
  log('');
  log(hr());
  log(`  RETRY ROUND ${retryRound} -- Re-running failed tests only (--last-failed)`);
  log(hr('-'));
  const blobSubDir = path.join(RETRY_BLOB_DIR, String(retryRound));
  const env = Object.assign({}, process.env, { PLAYWRIGHT_BLOB_OUTPUT_DIR: blobSubDir });
  const start = Date.now();
  const result = spawnSync(
    'npx',
    [
      'playwright', 'test',
      '--last-failed',
      `--config=${CONFIG_FILE}`,
      `--workers=${MAX_WORKERS}`,
      '--reporter=blob,list',
    ],
    { env, encoding: 'utf8', shell: true, stdio: 'inherit', timeout: 60 * 60 * 1000 }
  );
  return { exitCode: result.status ?? 1, durationMs: Date.now() - start };
}

function mergeAllReports() {
  log('');
  log('  Merging all results (original + retries) into one combined report...');
  if (!fs.existsSync('reports')) fs.mkdirSync('reports', { recursive: true });

  const TEMP_DIR = 'blob-merge-temp';
  if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  let zipCount = 0;

  function collectZips(sourceRootDir, prefix) {
    if (!fs.existsSync(sourceRootDir)) return;
    const entries = fs.readdirSync(sourceRootDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subDir = path.join(sourceRootDir, entry.name);
        fs.readdirSync(subDir).filter(f => f.endsWith('.zip')).forEach(zip => {
          fs.copyFileSync(path.join(subDir, zip), path.join(TEMP_DIR, `${prefix}-${entry.name}-${zip}`));
          zipCount++;
        });
      } else if (entry.name.endsWith('.zip')) {
        fs.copyFileSync(path.join(sourceRootDir, entry.name), path.join(TEMP_DIR, `${prefix}-${entry.name}`));
        zipCount++;
      }
    }
  }

  // Original blobs first, retry blobs last (retry results WIN on conflict)
  collectZips(BLOB_DIR,       'orig');
  collectZips(RETRY_BLOB_DIR, 'retry');

  if (zipCount === 0) {
    log('  WARNING: No blob zip files found -- skipping merge.');
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    return;
  }

  log(`  -> Collected ${zipCount} blob zip(s) -- merging...`);

  // HTML
  const htmlResult = spawnSync('npx',
    ['playwright', 'merge-reports', '--reporter=html', TEMP_DIR],
    { encoding: 'utf8', shell: true, stdio: 'inherit', timeout: 60000 });
  log(htmlResult.status === 0
    ? `  OK Combined HTML report  -> ${MERGED_HTML_DIR}/index.html`
    : `  WARNING HTML merge had issues (exit ${htmlResult.status})`);

  // JSON
  const jsonResult = spawnSync('npx',
    ['playwright', 'merge-reports', '--reporter=json', TEMP_DIR],
    { encoding: 'utf8', shell: true, stdio: 'pipe', timeout: 60000 });
  if (jsonResult.status === 0 && jsonResult.stdout) {
    try {
      const raw = jsonResult.stdout.trim();
      const s = raw.indexOf('{'); const e = raw.lastIndexOf('}');
      if (s !== -1 && e !== -1) {
        fs.writeFileSync(MERGED_JSON_FILE, raw.slice(s, e + 1), 'utf8');
        log(`  OK Combined JSON report   -> ${MERGED_JSON_FILE}`);
      }
    } catch (_) { log('  WARNING Could not save JSON report'); }
  }

  // Allure
  ['allure-results', 'allure-report'].forEach(d => {
    if (fs.existsSync(d)) fs.rmSync(d, { recursive: true, force: true });
  });
  const allureResult = spawnSync('npx',
    ['playwright', 'merge-reports', '--reporter=allure-playwright', TEMP_DIR],
    { encoding: 'utf8', shell: true, stdio: 'inherit', timeout: 60000 });
  if (allureResult.status === 0) {
    spawnSync('npx', ['allure', 'generate', './allure-results', '-o', './allure-report', '--clean'],
      { shell: true, stdio: 'ignore' });
    log('  OK Combined Allure report -> ./allure-report/index.html');
  }

  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
}

// MAIN
async function main() {
  const totalFiles   = TEST_FILES.length;
  const overallStart = Date.now();

  log('');
  log(hr());
  log('  SMART RUNNER -- Sequential Files + Parallel Tests + Auto Retry');
  log(`  Files: ${totalFiles}  |  MAX_WORKERS: ${MAX_WORKERS}  |  MAX_RETRIES: ${NO_RETRY ? 0 : MAX_RETRIES}`);
  if (DRY_RUN) log('  WARNING DRY RUN -- test counts only, no execution');
  log(hr());
  log('');

  const missing = TEST_FILES.filter(f => !fs.existsSync(f.path));
  if (missing.length > 0) {
    log('ERROR: The following files were not found:');
    missing.forEach(f => log(`   - ${f.path}`));
    process.exit(1);
  }

  if (!DRY_RUN) {
    [BLOB_DIR, RETRY_BLOB_DIR].forEach(dir => {
      if (fs.existsSync(dir)) { fs.rmSync(dir, { recursive: true, force: true }); log(`  Cleared ${dir}`); }
    });
    log('');
  }

  // PHASE 1: Run all files
  const results = [];
  const masterFailedTests = [];
  for (let i = 0; i < TEST_FILES.length; i++) {
    const { path: filePath, grep: grepPattern } = TEST_FILES[i];
    log(`[${i + 1}/${totalFiles}] ${filePath}${grepPattern ? ` (grep: ${grepPattern})` : ''}`);
    log('  -> Counting test cases...');
    const testCount = countTests(filePath, grepPattern);
    const workers   = Math.min(testCount, MAX_WORKERS);
    log(`  -> Detected: ${testCount} test case(s)`);
    log(`  -> Workers:  ${workers}`);

    if (DRY_RUN) {
      log('  -> Skipped (dry run)'); log('');
      results.push({ filePath, testCount, workers, status: 'skipped', passed: null, durationMs: 0 });
      continue;
    }

    log('  -> Launching...');
    log(hr('-'));
    const blobSubDir = path.join(BLOB_DIR, String(i));
    const { exitCode, durationMs } = runFile(filePath, workers, blobSubDir, grepPattern);
    log(hr('-'));
    const passed = exitCode === 0;
    
    // Extract both failed and skipped tests from JSON report
    try {
      const jsonReportPath = path.join('test-results', `report-${i}.json`);
      if (fs.existsSync(jsonReportPath)) {
        const report = JSON.parse(fs.readFileSync(jsonReportPath, 'utf8'));
        function extractTests(suites) {
          for (const suite of suites) {
            for (const spec of (suite.specs || [])) {
              for (const test of (spec.tests || [])) {
                const status = test.status || (test.results && test.results.length > 0 ? test.results[0].status : test.expectedStatus);
                const expected = test.expectedStatus;
                // Add to retry list if failed, timedOut, interrupted, or skipped
                if (status === 'skipped' || expected === 'skipped' || status === 'failed' || status === 'timedOut' || status === 'interrupted' || !spec.ok) {
                  const testId = test.testId || test.id;
                  if (testId && !masterFailedTests.includes(testId)) {
                    masterFailedTests.push(testId);
                  }
                }
              }
            }
            if (suite.suites) extractTests(suite.suites);
          }
        }
        extractTests(report.suites || []);
      }
    } catch (e) {}

    // Fallback to .last-run.json for backwards safety
    if (!passed) {
      try {
        const lastRunPath = path.join('test-results', '.last-run.json');
        if (fs.existsSync(lastRunPath)) {
          const lastRun = JSON.parse(fs.readFileSync(lastRunPath, 'utf8'));
          if (Array.isArray(lastRun.failedTests)) {
            lastRun.failedTests.forEach(id => {
              if (!masterFailedTests.includes(id)) masterFailedTests.push(id);
            });
          }
        }
      } catch (e) {}
    }

    log(`  -> ${passed ? 'PASSED' : 'FAILED'}   Time: ${formatDuration(durationMs)}`);
    log('');
    results.push({ filePath, testCount, workers, passed, status: passed ? 'PASSED' : 'FAILED', durationMs });
  }

  if (DRY_RUN) {
    log(`  Dry run complete. ${totalFiles} file(s) ready to run.`);
    log(hr()); return;
  }

  const passedFiles1 = results.filter(r => r.passed === true).length;
  const failedFiles1 = results.filter(r => r.passed === false).length;

  log(hr());
  log('  PHASE 1 COMPLETE');
  log(hr('-'));
  results.forEach(r => log(`  ${r.passed ? 'OK' : 'FAIL'} ${r.filePath.padEnd(55)} ${r.status}`));
  log(hr('-'));
  log(`  Passed: ${passedFiles1}   Failed: ${failedFiles1}   Total: ${totalFiles}`);
  log('');

  // PHASE 2: Retry
  let finalExitCode = failedFiles1 > 0 ? 1 : 0;

  if (!NO_RETRY && failedFiles1 > 0) {
    try {
      const lastRunPath = path.join('test-results', '.last-run.json');
      if (!fs.existsSync('test-results')) fs.mkdirSync('test-results', { recursive: true });
      fs.writeFileSync(lastRunPath, JSON.stringify({ status: "failed", failedTests: masterFailedTests }, null, 2));
    } catch (e) {}

    log(hr());
    log(`  PHASE 2 -- Retrying failed tests (up to ${MAX_RETRIES} round(s))`);
    log('  Uses Playwright --last-failed: only the tests that failed are re-run.');
    log(hr());

    let retryFailed = true;
    for (let round = 1; round <= MAX_RETRIES && retryFailed; round++) {
      const { exitCode: retryExit, durationMs: retryMs } = runRetry(round);
      retryFailed = retryExit !== 0;
      log('');
      log(`  Retry Round ${round}: ${retryFailed ? 'Still failing' : 'All passed'}   Time: ${formatDuration(retryMs)}`);
    }
    finalExitCode = retryFailed ? 1 : 0;
    log(retryFailed
      ? `  WARNING Some tests still failing after ${MAX_RETRIES} retry round(s).`
      : '  All previously-failed tests passed on retry!');
  } else if (!NO_RETRY) {
    log('  No failures -- retry phase not needed.');
  }

  // PHASE 3: Merge
  log('');
  log(hr());
  log('  PHASE 3 -- Merging original + retry results into one combined report');
  log(hr());
  mergeAllReports();

  // FINAL SUMMARY
  const totalDuration = Date.now() - overallStart;
  log('');
  log(hr());
  log('  FINAL SUMMARY');
  log(hr('-'));
  log(`  Total time    : ${formatDuration(totalDuration)}`);
  log(`  Files run     : ${totalFiles}`);
  log(`  Passed (P1)   : ${passedFiles1}`);
  log(`  Failed (P1)   : ${failedFiles1}`);
  if (!NO_RETRY && failedFiles1 > 0) {
    log(`  Retry rounds  : ${MAX_RETRIES}`);
    log(`  Final outcome : ${finalExitCode === 0 ? 'All passed after retry' : 'Some tests still failing'}`);
  }
  log(hr('-'));
  log('  View the combined report:  npm run report');
  log(hr());

  process.exit(finalExitCode);
}

main().catch(err => { console.error('Unexpected error:', err); process.exit(1); });
