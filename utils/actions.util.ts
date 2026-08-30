import { Page, Locator, expect } from '@playwright/test';

/**
 * Actions Utility
 * Wrapper class for common Playwright actions with logging and error handling
 */
export class Actions {
  constructor(private page: Page) {}

  /**
   * Navigate to a URL
   */
  async goto(url: string, description: string = 'Navigate'): Promise<void> {
    console.log(`[${description}] ${url}`);
    try {
      await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    } catch {
      await this.page.goto(url, { waitUntil: 'commit', timeout: 60000 });
    }
  }

  /**
   * Click on an element with visibility check
   */
  async click(locator: Locator, description: string = 'Click'): Promise<void> {
    console.log(`[${description}]`);
    await locator.scrollIntoViewIfNeeded().catch(() => {});
    await expect(locator).toBeVisible({ timeout: 15000 }).catch(() => {});
    await locator.click({ timeout: 15000 }).catch(async () => {
      await locator.evaluate((el: HTMLElement) => el.click()).catch(() => {});
    });
  }

  /**
   * Wait and click - waits for element to be visible and enabled before clicking
   */
  async waitAndClick(locator: Locator, timeout: number = 10000, description: string = 'Click'): Promise<void> {
    console.log(`[${description}]`);
    await expect(locator).toBeVisible({ timeout });
    await expect(locator).toBeEnabled({ timeout });
    await locator.click();
  }

  /**
   * Fill a text field
   */
  async fill(locator: Locator, value: string, description: string = 'Fill'): Promise<void> {
    console.log(`[${description}] ${value}`);
    await expect(locator).toBeVisible({ timeout: 5000 });
    await expect(locator).toBeEditable({ timeout: 5000 });
    
    // Robustly clear existing value
    await locator.focus();
    const existingValue = (await locator.inputValue().catch(() => '')).trim();
    if (existingValue) {
      await locator.click({ clickCount: 3 });
      await locator.press('Control+A');
      await locator.press('Backspace');
      console.log(`↺ Cleared existing value: "${existingValue}"`);
    }
    
    await locator.fill(value, { timeout: 5000 });
  }

  /**
   * Type text character by character (for inputs that need sequential typing)
   */
  async type(locator: Locator, value: string, delay: number = 100): Promise<void> {
    // Use Playwright's built-in type API which types character-by-character with optional delay
    await locator.type(value, { delay });
  }

  /**
   * Select from dropdown by clicking combobox then selecting value
   */
  async selectDropdown(combobox: Locator, value: string, description: string = 'Select'): Promise<void> {
    console.log(`[${description}] ${value}`);
    await this.click(combobox, 'Open dropdown');
    await this.click(this.page.locator(`//span[text()='${value}']`), `Select ${value}`);
  }

  /**
   * Select from dropdown by title attribute
   * Handles cases where multiple elements with same title exist
   */
  async selectByTitle(combobox: Locator, value: string): Promise<void> {
    await this.click(combobox, 'Open dropdown');
    
    // Wait for dropdown options to be visible
    await this.page.waitForTimeout(1000);
    
    // Find all elements with matching title and click the visible one
    const options = this.page.getByTitle(value, { exact: true });
    const count = await options.count();
    
    if (count === 0) {
      throw new Error(`No option found with title: ${value}`);
    }
    
    if (count === 1) {
      await this.click(options, `Select ${value}`);
    } else {
      // Multiple matches - click the first visible one
      console.log(`Found ${count} options with title '${value}', selecting first visible`);
      await this.click(options.first(), `Select ${value}`);
    }
    
    console.log(`✓ Selected: ${value}`);
  }

  /**
   * Select option from native select dropdown
   */
  async selectOption(locator: Locator, value: string, description: string = 'Select'): Promise<void> {
    console.log(`[${description}] ${value}`);
    await expect(locator).toBeVisible({ timeout: 5000 });
    await expect(locator).toBeEnabled({ timeout: 5000 });
    await locator.selectOption(value, { timeout: 5000 });
  }

  /**
   * Check a checkbox
   */
  async check(locator: Locator, description: string = 'Check'): Promise<void> {
    console.log(`[${description}]`);
    await locator.check();
  }

  /**
   * Uncheck a checkbox
   */
  async uncheck(locator: Locator, description: string = 'Uncheck'): Promise<void> {
    console.log(`[${description}]`);
    await locator.uncheck();
  }

  /**
   * Hover over an element
   */
  async hover(locator: Locator, description: string = 'Hover'): Promise<void> {
    console.log(`[${description}]`);
    await locator.hover();
  }

  /**
   * Wait for element to be visible
   */
  async waitForVisible(locator: Locator, timeout: number = 15000): Promise<void> {
    await expect(locator).toBeVisible({ timeout });
  }

  /**
   * Verify text content
   */
  async verifyText(locator: Locator, expectedText: string): Promise<void> {
    await expect(locator).toContainText(expectedText);
    console.log(`✓ Verified text: ${expectedText}`);
  }

  /**
   * Verify element value
   */
  async verifyValue(locator: Locator, expectedValue: string): Promise<void> {
    await expect(locator).toHaveValue(expectedValue);
    console.log(`✓ Verified value: ${expectedValue}`);
  }

  /**
   * Wait for page to load
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(1000);
  }

  /**
   * Upload a file
   */
  async uploadFile(locator: Locator, filePath: string, description: string = 'Upload'): Promise<void> {
    console.log(`[${description}] ${filePath}`);
    await locator.setInputFiles(filePath);
  }

  /**
   * Scroll element into view
   */
  async scrollIntoView(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
  }

  /**
   * Check for application errors (toast messages, error divs)
   */
  async checkForErrors(): Promise<void> {
    const errorSelectors = [
      '.slds-notify_toast',
      '.error',
      '.toastMessage',
      '.slds-has-error',
      '.forceActionsText'
    ];
    
    const successKeywords = ['success', 'successfully', 'saved', 'completed', 'created', 'updated', 'record updated'];
    const errorKeywords = ['error', 'failed', 'exception', 'unable', 'invalid', 'required', 'denied'];

    for (const selector of errorSelectors) {
      const element = this.page.locator(selector).first();
      const visible = await element.isVisible().catch(() => false);
      
      if (visible) {
        const text = (await element.textContent() || '').trim().toLowerCase();
        console.log(`Toast detected: ${text}`);
        
        // Check for success message
        if (successKeywords.some(k => text.includes(k))) {
          console.log('✓ Success message detected');
          continue;
        }
        
        // Check for error message
        if (errorKeywords.some(k => text.includes(k))) {
          throw new Error(`Application Error: ${text}`);
        }
      }
    }
  }

  /**
   * Get text content from element
   */
  async getText(locator: Locator): Promise<string> {
    return (await locator.textContent()) || '';
  }

  /**
   * Check if element is visible (returns boolean, doesn't throw)
   */
  async isVisible(locator: Locator, timeout: number = 5000): Promise<boolean> {
    return await locator.isVisible({ timeout }).catch(() => false);
  }

  /**
   * Press a key on a locator
   */
  async pressKey(locator: Locator, key: string, description: string = 'Press key'): Promise<void> {
    console.log(`[${description}] ${key}`);
    await locator.press(key);
  }

  /**
   * Verify current URL contains expected partial URL
   */
  async verifyURL(partialURL: string, description: string = 'Verify URL'): Promise<void> {
    console.log(`[${description}] ${partialURL}`);
    await expect(this.page).toHaveURL(new RegExp(partialURL));
    console.log(`✓ URL contains: ${partialURL}`);
  }

  /**
   * Highlight element and take screenshot (for debugging)
   */
  async highlightAndScreenshot(locator: Locator, name: string): Promise<void> {
    try {
      await locator.evaluate((el) => {
        el.style.border = '3px solid red';
        el.style.background = 'yellow';
      });
      await this.page.screenshot({ path: `screenshots/${name}.png` });
      await locator.evaluate((el) => {
        el.style.border = '';
        el.style.background = '';
      });
    } catch (e) {
      console.log(`Could not highlight element: ${name}`);
    }
  }
}
