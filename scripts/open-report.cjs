/**
 * open-report.cjs
 * ───────────────────────────────────────────────────────────────
 * Kills any process using the report port, then opens the report.
 * Auto-launches the browser so you don't need to type the URL.
 * Prevents the EADDRINUSE error when running `npm run report`.
 */

'use strict';

const { spawnSync, spawn, exec } = require('child_process');
const PORT = 9323;
const REPORT_DIR = 'playwright-report';

// ── 1. Kill any process already using the port ─────────────────
const netstat = spawnSync(
  'netstat', ['-ano'],
  { encoding: 'utf8', shell: true }
);

const lines = (netstat.stdout || '').split('\n');
const pids = new Set();

lines.forEach(line => {
  const match = line.match(/:(\d+)\s+.*LISTENING\s+(\d+)/);
  if (match && parseInt(match[1]) === PORT) {
    pids.add(match[2]);
  }
});

if (pids.size > 0) {
  console.log(`\n    Freeing port ${PORT} (PIDs: ${[...pids].join(', ')})...`);
  pids.forEach(pid => {
    spawnSync('taskkill', ['/PID', pid, '/F'], { shell: true });
  });
  const wait = Date.now() + 800;
  while (Date.now() < wait) { /* spin */ }
  console.log(`  ✅ Port ${PORT} is now free.\n`);
} else {
  console.log(`\n  ✅ Port ${PORT} is free.\n`);
}

// ── 2. Start the report server ──────────────────────────────────
console.log(`   Opening report at http://localhost:${PORT}`);
console.log(`  Press Ctrl+C to close.\n`);

const child = spawn(
  'npx',
  ['playwright', 'show-report', REPORT_DIR, `--port`, String(PORT)],
  { shell: true, stdio: 'inherit' }
);

// ── 3. Auto-open browser after 1.5s (gives server time to start) ──
setTimeout(() => {
  // Windows: start command opens default browser
  exec(`start http://localhost:${PORT}`, { shell: true });
  console.log(`  🌐 Browser opened → http://localhost:${PORT}\n`);
}, 1500);

child.on('exit', code => process.exit(code ?? 0));
