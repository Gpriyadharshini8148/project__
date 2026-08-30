import { defineConfig, devices, firefox } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({

  globalSetup: './tests/global-setup.ts',

  testDir: './tests',
  timeout: 5 * 60 * 1000,
  expect: { timeout: 30000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : (process.env.PW_RETRIES ? parseInt(process.env.PW_RETRIES) : 0),
  workers: process.env.MAX_WORKERS ? parseInt(process.env.MAX_WORKERS) : 2,
  reporter: [
    ['blob', { outputDir: 'blob-report' }],
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['json', { outputFile: 'reports/test-results.json' }],
    ['list'],
    ['allure-playwright', { detail: true, outputFolder: 'allure-results', suiteTitle: false }]
  ],
  use: {
    storageState: '.auth/global-auth.json',
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'on',
    actionTimeout: 30000,
    navigationTimeout: 60000,
    headless: process.env.HEADLESS !== 'false',
    launchOptions: {
      slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
      args: ['--start-maximized'],
    },
    viewport: { width: 1920, height: 1080 },
  },

  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      //grep: /@chrome/,
    },
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    //   //grep: /@firefox/
    // }
  ],
  outputDir: 'test-results/'
});
