/**
 * global-setup.ts
 *
 * Runs ONCE before any test file executes.
 * Logs in to FOS (Salesforce) and saves the authenticated browser state
 * (cookies + localStorage) to .auth/global-auth.json.
 *
 * Every test worker then restores this saved session automatically via
 * `storageState` in playwright.config.ts — no per-test login needed.
 *
 * SESSION STRATEGY (fast time-based, zero network overhead):
 *   < 8 hours old  →  reuse saved session instantly (no browser launched)
 *   > 8 hours old  →  fresh login, overwrite saved session
 *   no file        →  fresh login
 *
 * To force a fresh login: delete .auth/global-auth.json
 */

import { chromium } from '@playwright/test';
import { LoginPage } from '../pages/common/LoginPage';
import { config } from '../config/environment.config';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const AUTH_FILE = '.auth/global-auth.json';
const SESSION_MAX_AGE_HOURS = 8;

async function globalSetup(): Promise<void> {
  console.log('\n══════════════════════════════════════════════');
  console.log('  GLOBAL SETUP — FOS Session');
  console.log('══════════════════════════════════════════════');

  // Fast time-based check — zero network overhead, no browser launched
  if (fs.existsSync(AUTH_FILE)) {
    const ageHrs = (Date.now() - fs.statSync(AUTH_FILE).mtimeMs) / (1000 * 60 * 60);

    if (ageHrs < SESSION_MAX_AGE_HOURS) {
      const remaining = (SESSION_MAX_AGE_HOURS - ageHrs).toFixed(1);
      console.log(`✓ Reusing session (${ageHrs.toFixed(1)}h old, valid ~${remaining}h more)`);
      console.log('══════════════════════════════════════════════\n');
      return;  // instant return — no browser, no network
    }

    console.log(`  Session is ${ageHrs.toFixed(1)}h old — logging in fresh...`);
  } else {
    console.log('  No session file — logging in fresh...');
  }

  // Fresh login
  const browser = await chromium.launch({
    headless: process.env.HEADLESS === 'true',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
  });

  const context  = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page     = await context.newPage();
  const loginPage = new LoginPage(page);

  try {
    await loginPage.loginToFOS(
      config.urls.fosCustomer,
      config.credentials.fosUsername,
      config.credentials.fosPassword,
    );

    const authDir = path.join(process.cwd(), '.auth');
    if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

    await context.storageState({ path: AUTH_FILE });
    console.log('✓ Auth session saved → .auth/global-auth.json');
    console.log('  All tests will reuse this session (no per-test login).');
  } catch (error) {
    console.error('✗ Global setup FAILED during login:', error);
    throw error;
  } finally {
    await browser.close();
  }

  console.log('══════════════════════════════════════════════\n');
}

export default globalSetup;
