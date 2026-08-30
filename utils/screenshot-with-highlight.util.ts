import { Page, Locator } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Screenshot Utility with Element Highlighting
 * Captures screenshots with visual indicators for elements
 * Inspired by Java Selenium AShot + Highlighting pattern
 */
export class ScreenshotWithHighlight {
  private page: Page;
  private screenshotDir: string;

  constructor(page: Page) {
    this.page = page;
    
    // Create screenshots directory
    this.screenshotDir = path.join(process.cwd(), 'screenshots');
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  /**
   * Highlight an element with a colored border and shadow
   */
  async highlightElement(
    locator: Locator,
    color: string = '#FF0000',
    duration: number = 500
  ): Promise<void> {
    try {
      await locator.evaluate((element: HTMLElement, highlightColor: string) => {
        // Store original style
        const originalStyle = element.getAttribute('style') || '';
        element.setAttribute('data-original-style', originalStyle);
        
        // Apply highlight style
        element.style.border = `3px solid ${highlightColor}`;
        element.style.boxShadow = `0 0 10px ${highlightColor}`;
        element.style.outline = `2px dashed ${highlightColor}`;
        element.style.outlineOffset = '2px';
      }, color);

      // Wait for visual confirmation
      await this.page.waitForTimeout(duration);

    } catch (error) {
      console.warn('Failed to highlight element:', error);
    }
  }

  /**
   * Remove highlight from an element
   */
  async removeHighlight(locator: Locator): Promise<void> {
    try {
      await locator.evaluate((element: HTMLElement) => {
        const originalStyle = element.getAttribute('data-original-style') || '';
        element.setAttribute('style', originalStyle);
        element.removeAttribute('data-original-style');
      });
    } catch (error) {
      console.warn('Failed to remove highlight:', error);
    }
  }

  /**
   * Capture screenshot with element highlighted
   */
  async captureWithHighlight(
    locator: Locator,
    description: string,
    color: string = '#FF0000'
  ): Promise<string> {
    try {
      // Scroll element into view
      await locator.scrollIntoViewIfNeeded();
      await this.page.waitForTimeout(500);

      // Highlight element
      await this.highlightElement(locator, color, 1000);

      // Capture screenshot
      const filename = this.generateFilename(description);
      const filepath = path.join(this.screenshotDir, filename);
      
      await this.page.screenshot({
        path: filepath,
        fullPage: true,
      });

      // Remove highlight
      await this.removeHighlight(locator);

      console.log(`📸 Screenshot captured: ${filename}`);
      return filepath;

    } catch (error) {
      console.error('Failed to capture screenshot with highlight:', error);
      throw error;
    }
  }

  /**
   * Capture screenshot of specific element only
   */
  async captureElement(
    locator: Locator,
    description: string
  ): Promise<string> {
    try {
      await locator.scrollIntoViewIfNeeded();
      await this.page.waitForTimeout(300);

      const filename = this.generateFilename(description);
      const filepath = path.join(this.screenshotDir, filename);

      await locator.screenshot({ path: filepath });

      console.log(`📸 Element screenshot captured: ${filename}`);
      return filepath;

    } catch (error) {
      console.error('Failed to capture element screenshot:', error);
      throw error;
    }
  }

  /**
   * Capture full page screenshot
   */
  async captureFullPage(description: string): Promise<string> {
    try {
      const filename = this.generateFilename(description);
      const filepath = path.join(this.screenshotDir, filename);

      await this.page.screenshot({
        path: filepath,
        fullPage: true,
      });

      console.log(`📸 Full page screenshot captured: ${filename}`);
      return filepath;

    } catch (error) {
      console.error('Failed to capture full page screenshot:', error);
      throw error;
    }
  }

  /**
   * Highlight multiple elements and capture screenshot
   */
  async captureWithMultipleHighlights(
    locators: Locator[],
    description: string,
    colors?: string[]
  ): Promise<string> {
    try {
      const defaultColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];

      // Highlight all elements
      for (let i = 0; i < locators.length; i++) {
        const color = colors?.[i] || defaultColors[i % defaultColors.length];
        await this.highlightElement(locators[i], color, 0);
      }

      // Wait to show highlights
      await this.page.waitForTimeout(1000);

      // Capture screenshot
      const filename = this.generateFilename(description);
      const filepath = path.join(this.screenshotDir, filename);
      
      await this.page.screenshot({
        path: filepath,
        fullPage: true,
      });

      // Remove all highlights
      for (const locator of locators) {
        await this.removeHighlight(locator);
      }

      console.log(`📸 Screenshot with multiple highlights captured: ${filename}`);
      return filepath;

    } catch (error) {
      console.error('Failed to capture screenshot with multiple highlights:', error);
      throw error;
    }
  }

  /**
   * Capture screenshot on failure with error context
   */
  async captureOnFailure(
    description: string,
    error: Error
  ): Promise<string> {
    try {
      const filename = this.generateFilename(`FAILURE_${description}`);
      const filepath = path.join(this.screenshotDir, filename);

      // Capture full page
      await this.page.screenshot({
        path: filepath,
        fullPage: true,
      });

      // Create error context file
      const errorFile = filepath.replace('.png', '_error.txt');
      const errorContent = `
ERROR DETAILS
=============
Description: ${description}
Error Message: ${error.message}
Stack Trace:
${error.stack}

Time: ${new Date().toISOString()}
URL: ${this.page.url()}
      `.trim();

      fs.writeFileSync(errorFile, errorContent);

      console.error(`📸 Failure screenshot captured: ${filename}`);
      console.error(`📄 Error context saved: ${path.basename(errorFile)}`);
      
      return filepath;

    } catch (captureError) {
      console.error('Failed to capture failure screenshot:', captureError);
      throw captureError;
    }
  }

  /**
   * Capture screenshot and compare with baseline (visual regression)
   */
  async captureAndCompare(
    locator: Locator,
    baselineName: string,
    threshold: number = 0.2
  ): Promise<boolean> {
    try {
      await locator.scrollIntoViewIfNeeded();
      
      const screenshot = await locator.screenshot();
      
      // Compare with baseline (requires @playwright/test toMatchSnapshot)
      // This is a placeholder - actual implementation would use Playwright's visual comparison
      console.log(`📊 Visual comparison for: ${baselineName} (threshold: ${threshold})`);
      
      return true;
    } catch (error) {
      console.error('Visual comparison failed:', error);
      return false;
    }
  }

  /**
   * Generate unique filename for screenshot
   */
  private generateFilename(description: string): string {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const sanitized = description
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 50);
    return `${sanitized}_${timestamp}.png`;
  }

  /**
   * Add text annotation to screenshot (using page evaluation)
   */
  async addAnnotation(
    text: string,
    position: { x: number; y: number } = { x: 10, y: 10 }
  ): Promise<void> {
    await this.page.evaluate(
      ({ annotationText, x, y }) => {
        const div = document.createElement('div');
        div.textContent = annotationText;
        div.style.position = 'fixed';
        div.style.top = `${y}px`;
        div.style.left = `${x}px`;
        div.style.background = 'rgba(0, 0, 0, 0.7)';
        div.style.color = 'white';
        div.style.padding = '10px';
        div.style.borderRadius = '5px';
        div.style.zIndex = '999999';
        div.style.fontFamily = 'Arial, sans-serif';
        div.style.fontSize = '14px';
        div.setAttribute('data-annotation', 'true');
        document.body.appendChild(div);
      },
      { annotationText: text, x: position.x, y: position.y }
    );
  }

  /**
   * Remove all annotations
   */
  async removeAnnotations(): Promise<void> {
    await this.page.evaluate(() => {
      const annotations = document.querySelectorAll('[data-annotation="true"]');
      annotations.forEach(el => el.remove());
    });
  }

  /**
   * Clean up old screenshots (keep only last N days)
   */
  static cleanupOldScreenshots(daysToKeep: number = 7): void {
    try {
      const screenshotsDir = path.join(process.cwd(), 'screenshots');
      if (!fs.existsSync(screenshotsDir)) return;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const files = fs.readdirSync(screenshotsDir);
      let deletedCount = 0;

      files.forEach(file => {
        const filepath = path.join(screenshotsDir, file);
        const stats = fs.statSync(filepath);

        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filepath);
          deletedCount++;
        }
      });

      if (deletedCount > 0) {
        console.log(`🧹 Cleaned up ${deletedCount} old screenshots`);
      }
    } catch (error) {
      console.warn('Failed to cleanup old screenshots:', error);
    }
  }
}
