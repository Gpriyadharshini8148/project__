/**
 * run-and-merge.cjs
 * 
 * Runs each test spec file one by one, collects their blob reports,
 * then merges into ONE single Playwright HTML report.
 * 
 * Usage: node run-and-merge.cjs
 *        node run-and-merge.cjs --workers=3
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ── Config ──────────────────────────────────────────────────────────────────
const WORKERS   = process.argv.find(a => a.startsWith('--workers='))?.split('=')[1] || '3';
const BLOB_ACCUM = path.join(__dirname, 'merged-blobs');  // accumulation dir
const BLOB_TEMP  = path.join(__dirname, 'blob-report');   // playwright default blob dir
const HTML_OUT   = path.join(__dirname, 'merged-report'); // final merged HTML report

const SPEC_FILES = [
  'tests/customer/01_searchDealer.spec.ts',
  'tests/customer/02_appStatus.spec.ts',
  'tests/customer/03_zipCode.spec.ts',
  'tests/customer/04_mitc.spec.ts',
  'tests/customer/05_panVerification.spec.ts',
  'tests/customer/06_productSelection.spec.ts',
  'tests/customer/07_incomeDeclaration.spec.ts',
  'tests/customer/08_kyc.spec.ts',
  'tests/customer/09_poi.spec.ts',
  'tests/customer/10_poa.spec.ts',
  'tests/customer/11_surrogateDetails.spec.ts',
  'tests/customer/12_approvalDetails.spec.ts',
  'tests/customer/13_additionalDetails.spec.ts',
  'tests/customer/14_reappraisal.spec.ts',
  'tests/customer/15_assetCart.spec.ts',
];
// ────────────────────────────────────────────────────────────────────────────

function clearDir(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.readdirSync(src).forEach(file => {
    const srcPath  = path.join(src, file);
    const destPath = path.join(dest, file);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
      copyDir(srcPath, destPath);
    } else {
      // Use unique name to avoid collisions (prefix with spec index)
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// ── Main ────────────────────────────────────────────────────────────────────
console.log('🚀 Starting combined test run and merge');
console.log(`   Workers: ${WORKERS}`);
console.log(`   Specs:   ${SPEC_FILES.length} files\n`);

// Prepare directories
clearDir(BLOB_ACCUM);
console.log(`✓ Cleared accumulation dir: ${BLOB_ACCUM}\n`);

const results = [];

for (let i = 0; i < SPEC_FILES.length; i++) {
  const spec = SPEC_FILES[i];
  const specName = path.basename(spec, '.spec.ts');
  
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`[${i + 1}/${SPEC_FILES.length}] Running: ${specName}`);
  console.log('─'.repeat(60));

  // Clear the temp blob dir before each run
  clearDir(BLOB_TEMP);

  const cmd = `npx playwright test ${spec} --workers=${WORKERS}`;
  console.log(`Command: ${cmd}\n`);

  const start = Date.now();
  const result = spawnSync(cmd, {
    shell: true,
    stdio: 'inherit',
    cwd: __dirname,
    env: {
      ...process.env,
      // Ensure blob reporter outputs to our temp dir
      PLAYWRIGHT_BLOB_OUTPUT_DIR: BLOB_TEMP,
    }
  });
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const status = result.status === 0 ? '✅ PASS' : '❌ FAIL';
  
  console.log(`\n${status} — ${specName} (${elapsed}s)`);
  results.push({ spec: specName, status: result.status === 0 ? 'PASS' : 'FAIL', elapsed });

  // Copy blob files from temp to accumulation dir with unique prefix
  if (fs.existsSync(BLOB_TEMP)) {
    const destWithPrefix = path.join(BLOB_ACCUM, `suite-${String(i + 1).padStart(2, '0')}`);
    fs.mkdirSync(destWithPrefix, { recursive: true });
    copyDir(BLOB_TEMP, destWithPrefix);
    console.log(`✓ Blob report saved to: suite-${String(i + 1).padStart(2, '0')}/`);
  }
}

// ── Print run summary ────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(60)}`);
console.log('📋 RUN SUMMARY');
console.log('═'.repeat(60));
results.forEach((r, i) => {
  const icon = r.status === 'PASS' ? '✅' : '❌';
  console.log(`  ${icon} [${i + 1}] ${r.spec} — ${r.elapsed}s`);
});
console.log('═'.repeat(60));

// ── Merge all blob reports into one HTML ──────────────────────────────────
console.log('\n🔀 Merging all blob reports into single HTML report...');

// List all suite subdirs that contain blob data
const suiteDirs = fs.readdirSync(BLOB_ACCUM)
  .filter(f => fs.statSync(path.join(BLOB_ACCUM, f)).isDirectory())
  .map(f => path.join(BLOB_ACCUM, f));

console.log(`   Found ${suiteDirs.length} blob report groups`);

// Playwright merge-reports needs all blobs flat in one dir.
// Flatten all suite blob contents into a single flat dir.
const flatBlobs = path.join(__dirname, 'flat-blobs');
clearDir(flatBlobs);

for (const suiteDir of suiteDirs) {
  const files = fs.readdirSync(suiteDir);
  for (const file of files) {
    const src  = path.join(suiteDir, file);
    const stat = fs.statSync(src);
    if (stat.isFile()) {
      // Prefix with suite folder name to keep unique
      const prefix = path.basename(suiteDir);
      const dest = path.join(flatBlobs, `${prefix}-${file}`);
      fs.copyFileSync(src, dest);
    } else if (stat.isDirectory() && file === 'data') {
      // Copy data dir files with prefix
      const dataFiles = fs.readdirSync(src);
      for (const df of dataFiles) {
        const dfSrc  = path.join(src, df);
        const dfStat = fs.statSync(dfSrc);
        if (dfStat.isFile()) {
          // Data files go into flat-blobs/data/
          const dataOut = path.join(flatBlobs, 'data');
          if (!fs.existsSync(dataOut)) fs.mkdirSync(dataOut);
          fs.copyFileSync(dfSrc, path.join(dataOut, df));
        }
      }
    }
  }
}

clearDir(HTML_OUT);

const mergeCmd = `npx playwright merge-reports --reporter html --config playwright.config.ts ./flat-blobs`;
console.log(`\nRunning: ${mergeCmd}`);

const mergeResult = spawnSync(mergeCmd, {
  shell: true,
  stdio: 'inherit',
  cwd: __dirname,
  env: {
    ...process.env,
    PLAYWRIGHT_HTML_REPORT: HTML_OUT,
  }
});

if (mergeResult.status === 0) {
  console.log(`\n✅ Merged HTML report created at: ${HTML_OUT}`);
  console.log(`\n   Open with: npx playwright show-report merged-report`);

  // Auto-open
  spawnSync('npx playwright show-report merged-report', {
    shell: true,
    cwd: __dirname,
    detached: true,
    stdio: 'ignore'
  });
} else {
  console.log('\n⚠  Merge failed. Check output above for details.');
  console.log('   You can still view individual suite reports in the final/ folder.');
}

console.log('\n🏁 Done!');
