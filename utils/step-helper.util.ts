import { test } from '@playwright/test';
import { Page } from '@playwright/test';

/**
 * Step Helper Utility
 * Provides step tracking and screenshot functionality for test reporting
 */

let _stepCounter = 0;

/**
 * Reset step counter (call in beforeEach)
 */
export function resetStepCounter(): void {
  _stepCounter = 0;
}

/**
 * Step Options
 */
export interface StepOptions {
  fullPage?: boolean;
  skipShot?: boolean;
  retries?: number;
}

/**
 * Execute a step with automatic screenshot capture
 * @param page - Playwright page instance
 * @param stepName - Name of the step
 * @param fn - Function to execute
 * @param opts - Step options
 */
export async function step(
  page: Page,
  stepName: string,
  fn: () => Promise<void>,
  opts: StepOptions = {}
): Promise<void> {
  const { fullPage = false, skipShot = false, retries = 0 } = opts;

  _stepCounter++;
  const index = _stepCounter;
  const timestamp = new Date().toISOString();
  const startedAt = Date.now();

  let status: 'passed' | 'failed' = 'passed';
  let error: string | null = null;
  let attempts = 0;

  // Run function inside test.step (with optional retry)
  try {
    await test.step(stepName, async () => {
      while (true) {
        attempts++;
        try {
          await fn();
          break;
        } catch (err) {
          if (attempts > retries) throw err;
          // Wait with exponential backoff
          await new Promise(r => setTimeout(r, 500 * attempts));
        }
      }
    });
  } catch (err) {
    status = 'failed';
    error = err instanceof Error ? err.message : String(err);
  }

  const duration = Date.now() - startedAt;

  // Screenshot after step (pass or fail)
  let screenshot: string | null = null;
  if (!skipShot) {
    try {
      const buffer = await page.screenshot({ fullPage });
      screenshot = buffer.toString('base64');
    } catch {
      // Page closed or mid-navigation - skip silently
    }
  }

  // Attach structured payload for custom reporter
  test.info().attach('step-data', {
    body: Buffer.from(JSON.stringify({
      index,
      stepName,
      status,
      error,
      timestamp,
      duration,
      attempts,
      screenshot,
    })),
    contentType: 'application/json',
  });

  if (status === 'failed' && error) {
    throw new Error(error);
  }
}

/**
 * Create a logical group label in trace viewer (no screenshot)
 * @param groupName - Name of the group
 * @param fn - Function to execute
 */
export async function stepGroup(groupName: string, fn: () => Promise<void>): Promise<void> {
  await test.step(`▸ ${groupName}`, fn);
}

/**
 * Wrap a function in a named step (simpler syntax)
 */
export function withStep(stepName: string) {
  return function <T>(fn: () => Promise<T>): Promise<T> {
    return test.step(stepName, fn);
  };
}
