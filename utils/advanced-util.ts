/**
 * Advanced Testing Utilities
 * 
 * Additional helper methods based on Java Selenium framework functionality
 */

import { Page, Locator, expect } from '@playwright/test';

/**
 * Screenshot Utility
 * Enhanced screenshot capabilities similar to Java framework
 */
export class ScreenshotUtil {
  constructor(private page: Page) {}

  /**
   * Take manual screenshot with custom name
   */
  async manualScreenshot(description: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${description.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.png`;
    
    await this.page.screenshot({
      path: `test-results/manual-screenshots/${filename}`,
      fullPage: true
    });
    
    console.log(`📸 Screenshot: ${description}`);
  }

  /**
   * Take screenshot of specific element
   */
  async elementScreenshot(locator: Locator, description: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${description.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.png`;
    
    await locator.screenshot({
      path: `test-results/manual-screenshots/${filename}`
    });
    
    console.log(`📸 Element Screenshot: ${description}`);
  }

  /**
   * Highlight element before taking screenshot
   */
  async highlightAndScreenshot(locator: Locator, description: string): Promise<void> {
    await locator.evaluate((el: HTMLElement) => {
      el.style.border = '3px solid red';
      el.style.backgroundColor = 'yellow';
    });
    
    await this.elementScreenshot(locator, description);
    
    // Remove highlight
    await locator.evaluate((el: HTMLElement) => {
      el.style.border = '';
      el.style.backgroundColor = '';
    });
  }
}

/**
 * Validation Utility
 * Multiple validation methods similar to Java framework
 */
export class ValidationUtil {
  constructor(private page: Page) {}

  /**
   * Verify multiple error messages in alert popup
   */
  async verifyMultipleErrorMessages(expectedErrors?: string[]): Promise<boolean> {
    try {
      const errorLocator = this.page.locator('//div/span[contains(text(),"Review the following")]');
      const errorListLocator = this.page.locator('//ul[contains(@class,"error")]/li');
      
      await expect(errorLocator.first()).toBeVisible({ timeout: 5000 });
      
      const errors = await errorListLocator.allTextContents();
      const filteredErrors = errors.filter(text => text.trim() !== '');
      
      console.log(`❌ Found ${filteredErrors.length} error(s):`);
      filteredErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });

      // Optionally verify expected errors
      if (expectedErrors && expectedErrors.length > 0) {
        expectedErrors.forEach(expected => {
          const found = filteredErrors.some(actual => actual.includes(expected));
          if (found) {
            console.log(`✓ Expected error found: ${expected}`);
          } else {
            console.log(`✗ Expected error NOT found: ${expected}`);
          }
        });
      }
      
      return true;
    } catch (error) {
      console.log('No error messages found');
      return false;
    }
  }

  /**
   * Verify element is present and visible
   */
  async verifyElementPresent(locator: Locator, description: string): Promise<void> {
    try {
      await expect(locator).toBeVisible({ timeout: 10000 });
      console.log(`✓ ${description} is present`);
    } catch (error) {
      throw new Error(`❌ ${description} is NOT present`);
    }
  }

  /**
   * Verify text in element matches expected
   */
  async verifyTextContent(locator: Locator, expectedText: string, description: string): Promise<void> {
    const actualText = await locator.textContent();
    if (actualText?.includes(expectedText)) {
      console.log(`✓ ${description}: Text matches "${expectedText}"`);
    } else {
      throw new Error(`❌ ${description}: Expected "${expectedText}", got "${actualText}"`);
    }
  }

  /**
   * Verify page title or header
   */
  async verifyPageHeader(headerText: string): Promise<void> {
    const headerLocator = this.page.locator(`//h1[text()='${headerText}']`);
    await expect(headerLocator).toBeVisible({ timeout: 15000 });
    console.log(`✓ Page header verified: ${headerText}`);
  }
}

/**
 * Wait Utility
 * Advanced wait methods
 */
export class WaitUtil {
  constructor(private page: Page) {}

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('load');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
  }

  /**
   * Wait for specific time (use sparingly)
   */
  async waitFor(milliseconds: number): Promise<void> {
    await this.page.waitForTimeout(milliseconds);
  }

  /**
   * Wait for element to be stable (not moving)
   */
  async waitForElementStable(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.waitFor({ state: 'attached' });
    
    // Wait for animations to complete
    await this.page.waitForTimeout(500);
  }

  /**
   * Wait for any of multiple elements to appear
   */
  async waitForAny(locators: Locator[], timeout: number = 10000): Promise<Locator | null> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      for (const locator of locators) {
        try {
          if (await locator.isVisible()) {
            return locator;
          }
        } catch (error) {
          // Continue checking
        }
      }
      await this.page.waitForTimeout(500);
    }
    
    return null;
  }
}

/**
 * Frame/IFrame Utility
 * Handle iframe operations similar to Java framework
 */
export class FrameUtil {
  constructor(private page: Page) {}

  /**
   * Switch to iframe by title or selector
   */
  async switchToFrame(frameSelector: string): Promise<void> {
    const frame = this.page.frameLocator(frameSelector);
    console.log(`↪️  Switched to frame: ${frameSelector}`);
  }

  /**
   * Check if iframe is present
   */
  async isFramePresent(frameSelector: string): Promise<boolean> {
    try {
      const frameElement = this.page.locator(frameSelector);
      return await frameElement.isVisible();
    } catch (error) {
      return false;
    }
  }
}

/**
 * Dropdown/Select Utility
 * Advanced dropdown handling
 */
export class DropdownUtil {
  constructor(private page: Page) {}

  /**
   * Select dropdown by visible text
   */
  async selectByText(locator: Locator, text: string): Promise<void> {
    await locator.click();
    await this.page.waitForTimeout(1000);
    
    const option = this.page.locator(`//li[contains(text(),'${text}')]`);
    await option.click();
    
    console.log(`✓ Selected dropdown option: ${text}`);
  }

  /**
   * Select dropdown by value attribute
   */
  async selectByValue(locator: Locator, value: string): Promise<void> {
    await locator.selectOption(value);
    console.log(`✓ Selected dropdown value: ${value}`);
  }

  /**
   * Get all dropdown options
   */
  async getAllOptions(selectLocator: Locator): Promise<string[]> {
    const options = await selectLocator.locator('option').allTextContents();
    return options;
  }

  /**
   * Verify dropdown contains specific option
   */
  async verifyOptionExists(selectLocator: Locator, optionText: string): Promise<boolean> {
    const options = await this.getAllOptions(selectLocator);
    return options.some(opt => opt.includes(optionText));
  }
}

/**
 * File Upload Utility
 * Handle file uploads similar to Java framework
 */
export class FileUploadUtil {
  constructor(private page: Page) {}

  /**
   * Upload single file
   */
  async uploadFile(inputLocator: Locator, filePath: string): Promise<void> {
    await inputLocator.setInputFiles(filePath);
    console.log(`✓ Uploaded file: ${filePath}`);
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(inputLocator: Locator, filePaths: string[]): Promise<void> {
    await inputLocator.setInputFiles(filePaths);
    console.log(`✓ Uploaded ${filePaths.length} files`);
  }

  /**
   * Clear uploaded file
   */
  async clearUploadedFile(inputLocator: Locator): Promise<void> {
    await inputLocator.setInputFiles([]);
    console.log(`✓ Cleared uploaded file`);
  }
}

/**
 * Alert/Dialog Utility
 * Handle JavaScript alerts and dialogs
 */
export class AlertUtil {
  constructor(private page: Page) {}

  /**
   * Accept alert dialog
   */
  async acceptAlert(): Promise<void> {
    this.page.on('dialog', async dialog => {
      console.log(`✓ Alert text: ${dialog.message()}`);
      await dialog.accept();
    });
  }

  /**
   * Dismiss alert dialog
   */
  async dismissAlert(): Promise<void> {
    this.page.on('dialog', async dialog => {
      console.log(`✓ Alert dismissed: ${dialog.message()}`);
      await dialog.dismiss();
    });
  }

  /**
   * Get alert text
   */
  async getAlertText(): Promise<string> {
    return new Promise((resolve) => {
      this.page.once('dialog', async dialog => {
        const text = dialog.message();
        await dialog.accept();
        resolve(text);
      });
    });
  }
}

/**
 * Scroll Utility
 * Advanced scrolling operations
 */
export class ScrollUtil {
  constructor(private page: Page) {}

  /**
   * Scroll element into view
   */
  async scrollIntoView(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(500);
  }

  /**
   * Scroll to bottom of page
   */
  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await this.page.waitForTimeout(1000);
  }

  /**
   * Scroll to top of page
   */
  async scrollToTop(): Promise<void> {
    await this.page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await this.page.waitForTimeout(500);
  }

  /**
   * Scroll by coordinates
   */
  async scrollBy(x: number, y: number): Promise<void> {
    await this.page.evaluate(([xPos, yPos]) => {
      window.scrollBy(xPos, yPos);
    }, [x, y]);
  }
}

/**
 * Keyboard Utility
 * Advanced keyboard operations
 */
export class KeyboardUtil {
  constructor(private page: Page) {}

  /**
   * Press Enter key
   */
  async pressEnter(): Promise<void> {
    await this.page.keyboard.press('Enter');
  }

  /**
   * Press Tab key
   */
  async pressTab(): Promise<void> {
    await this.page.keyboard.press('Tab');
  }

  /**
   * Press Escape key
   */
  async pressEscape(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }

  /**
   * Type text with delay (simulate human typing)
   */
  async typeWithDelay(text: string, delayMs: number = 100): Promise<void> {
    await this.page.keyboard.type(text, { delay: delayMs });
  }

  /**
   * Keyboard shortcut (e.g., Ctrl+A)
   */
  async pressShortcut(modifiers: string, key: string): Promise<void> {
    await this.page.keyboard.press(`${modifiers}+${key}`);
  }
}
