const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const testResultsPath = path.join(__dirname, '..', 'reports', 'test-results.json');
const lastRunPath = path.join(__dirname, '..', 'test-results', '.last-run.json');

if (!fs.existsSync(testResultsPath)) {
  console.error("No reports/test-results.json found. Cannot determine failed/skipped tests.");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(testResultsPath, 'utf8'));
const testsToRetry = [];

function extractTests(suites) {
  for (const suite of suites) {
    for (const spec of (suite.specs || [])) {
      for (const test of (spec.tests || [])) {
        const status = test.status || (test.results && test.results.length > 0 ? test.results[0].status : test.expectedStatus);
        if (status === 'skipped' || status === 'failed' || status === 'timedOut' || status === 'interrupted' || !spec.ok) {
          const testId = test.testId || test.id;
          if (testId && !testsToRetry.includes(testId)) {
            testsToRetry.push(testId);
          }
        }
      }
    }
    if (suite.suites) extractTests(suite.suites);
  }
}

extractTests(data.suites || []);

console.log(`Found ${testsToRetry.length} failed/skipped tests to retry.`);

if (testsToRetry.length === 0) {
  console.log("Nothing to retry.");
  process.exit(0);
}

// Write to .last-run.json
fs.mkdirSync(path.dirname(lastRunPath), { recursive: true });
fs.writeFileSync(lastRunPath, JSON.stringify({ status: "failed", failedTests: testsToRetry }, null, 2));

console.log("Executing Playwright retry...");

// Run playwright test --last-failed
const result = spawnSync('npx', [
  'playwright', 'test',
  '--last-failed',
  '--config=playwright.config.ts',
  '--reporter=blob,list'
], { stdio: 'inherit', shell: true });

if (result.status !== 0) {
  console.log("Retry run still had failures.");
} else {
  console.log("All retried tests passed!");
}

console.log("Generating combined HTML report for this retry run...");
spawnSync('npx', ['playwright', 'show-report', 'blob-report'], { stdio: 'inherit', shell: true });
